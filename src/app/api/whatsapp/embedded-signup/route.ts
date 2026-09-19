import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/whatsapp/encryption'
import {
  exchangeCodeForToken,
  debugTokenInfo,
  getWabaPhoneNumbers,
  verifyPhoneNumber,
  getMetaUserProfile,
} from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/embedded-signup
 * 
 * Handles completion of WhatsApp Embedded Signup flow.
 * Exchanges OAuth authorization code for a business access token,
 * automatically detects WABA & Phone Number IDs if omitted,
 * encrypts the token, and links it to the user account in Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, redirectUri } = body
    let { wabaId, phoneNumberId } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Code d’autorisation Meta requis' },
        { status: 400 }
      )
    }

    // 1. Exchange code for access token
    const tokenResult = await exchangeCodeForToken({ code, redirectUri })
    const accessToken = tokenResult.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Impossible de récupérer le jeton d’accès Meta' },
        { status: 400 }
      )
    }

    // 2. If wabaId or phoneNumberId are not passed by frontend, auto-discover them
    if (!wabaId) {
      try {
        const debugInfo = await debugTokenInfo({ inputToken: accessToken })
        const wabaScope = debugInfo.granular_scopes?.find(
          (s) => s.scope === 'whatsapp_business_management'
        )
        if (wabaScope?.target_ids && wabaScope.target_ids.length > 0) {
          wabaId = wabaScope.target_ids[0]
        }
      } catch (err) {
        console.warn('Auto-discovery WABA ID via debug_token a échoué:', err)
      }
    }

    if (wabaId && !phoneNumberId) {
      try {
        const phoneNumbers = await getWabaPhoneNumbers({ wabaId, accessToken })
        if (phoneNumbers.length > 0) {
          phoneNumberId = phoneNumbers[0].id
        }
      } catch (err) {
        console.warn('Auto-discovery Phone Number ID a échoué:', err)
      }
    }

    if (!phoneNumberId || !wabaId) {
      return NextResponse.json(
        {
          error:
            'Impossible d’identifier le Phone Number ID ou le WABA ID associé à ce compte.',
          partial: { wabaId, phoneNumberId },
        },
        { status: 400 }
      )
    }

    // 3. Verify phone info with Meta
    const phoneInfo = await verifyPhoneNumber({
      phoneNumberId,
      accessToken,
    })

    // 4. Resolve Supabase user
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    let targetUserId = currentUser?.id

    // If user is not logged in, fetch Meta profile and sign in / create user
    if (!targetUserId) {
      let metaEmail: string | undefined
      let metaName: string | undefined
      try {
        const profile = await getMetaUserProfile({ accessToken })
        metaEmail = profile.email
        metaName = profile.name
      } catch (e) {
        console.warn('Could not fetch Meta profile:', e)
      }

      const email =
        metaEmail || `whatsapp_${phoneNumberId}@whatooz.space`
      const fullName = metaName || `WhatsApp User ${phoneInfo.display_phone_number}`

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find((u) => u.email === email)

      if (existingUser) {
        targetUserId = existingUser.id
      } else {
        // Create user in Supabase
        const { data: newUser, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: fullName },
          })

        if (createErr || !newUser.user) {
          return NextResponse.json(
            { error: `Échec création compte utilisateur: ${createErr?.message}` },
            { status: 500 }
          )
        }
        targetUserId = newUser.user.id

        // Create profile row
        await supabaseAdmin.from('profiles').upsert({
          user_id: targetUserId,
          full_name: fullName,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    // 5. Encrypt token and store in whatsapp_config
    const encryptedToken = encrypt(accessToken)

    const { error: upsertError } = await supabaseAdmin
      .from('whatsapp_config')
      .upsert(
        {
          user_id: targetUserId,
          phone_number_id: phoneNumberId,
          waba_id: wabaId,
          access_token_encrypted: encryptedToken,
          display_phone_number: phoneInfo.display_phone_number,
          verified_name: phoneInfo.verified_name ?? null,
          quality_rating: phoneInfo.quality_rating ?? null,
          connected: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      return NextResponse.json(
        { error: `Échec de sauvegarde WhatsApp: ${upsertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      phoneInfo: {
        id: phoneNumberId,
        waba_id: wabaId,
        display_phone_number: phoneInfo.display_phone_number,
        verified_name: phoneInfo.verified_name,
      },
    })
  } catch (err) {
    console.error('Embedded signup route error:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
