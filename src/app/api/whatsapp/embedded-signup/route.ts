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

    // 4. Resolve Supabase user and Organization ID
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetOrganizationId = request.headers.get('x-organization-id')
    if (!targetOrganizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // 5. Encrypt token and store in whatsapp_config
    const encryptedToken = encrypt(accessToken)

    const { error: upsertError } = await supabaseAdmin
      .from('whatsapp_config')
      .upsert(
        {
          organization_id: targetOrganizationId,
          phone_number_id: phoneNumberId,
          waba_id: wabaId,
          access_token_encrypted: encryptedToken,
          display_phone_number: phoneInfo.display_phone_number,
          verified_name: phoneInfo.verified_name ?? null,
          quality_rating: phoneInfo.quality_rating ?? null,
          connected: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
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
