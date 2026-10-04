import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/whatsapp/encryption'
import {
  exchangeCodeForToken,
  debugTokenInfo,
  getWabaPhoneNumbers,
  verifyPhoneNumber,
  subscribeWabaToApp,
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
    const { code } = body
    let { wabaId, phoneNumberId } = body

    console.log('[EMBEDDED_SIGNUP] Step 1: Request received', {
      hasCode: !!code,
      wabaId: wabaId || 'not provided',
      phoneNumberId: phoneNumberId || 'not provided',
    })

    if (!code) {
      return NextResponse.json(
        { error: 'Code d\'autorisation Meta requis' },
        { status: 400 }
      )
    }

    // 1. Exchange code for access token
    console.log('[EMBEDDED_SIGNUP] Step 2: Exchanging code for access token...')
    let accessToken: string
    try {
      const tokenResult = await exchangeCodeForToken({ code })
      accessToken = tokenResult.access_token
      console.log('[EMBEDDED_SIGNUP] Step 2: Token exchange successful', {
        hasToken: !!accessToken,
        tokenType: tokenResult.token_type,
      })
    } catch (err) {
      console.error('[EMBEDDED_SIGNUP] Step 2 FAILED: Token exchange error:', err)
      const msg = err instanceof Error ? err.message : 'Token exchange failed'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!accessToken) {
      console.error('[EMBEDDED_SIGNUP] Step 2 FAILED: No access token in response')
      return NextResponse.json(
        { error: 'Impossible de récupérer le jeton d\'accès Meta' },
        { status: 400 }
      )
    }

    // 2. If wabaId is not passed by frontend, auto-discover via debug_token
    if (!wabaId) {
      console.log('[EMBEDDED_SIGNUP] Step 3: Auto-discovering WABA ID via debug_token...')
      try {
        const debugInfo = await debugTokenInfo({ inputToken: accessToken })
        console.log('[EMBEDDED_SIGNUP] Step 3: debug_token result:', {
          app_id: debugInfo.app_id,
          is_valid: debugInfo.is_valid,
          scopes: debugInfo.granular_scopes?.map(s => ({ scope: s.scope, targets: s.target_ids })),
        })
        const wabaScope = debugInfo.granular_scopes?.find(
          (s) => s.scope === 'whatsapp_business_management'
        )
        if (wabaScope?.target_ids && wabaScope.target_ids.length > 0) {
          wabaId = wabaScope.target_ids[0]
          console.log('[EMBEDDED_SIGNUP] Step 3: WABA ID discovered:', wabaId)
        } else {
          console.warn('[EMBEDDED_SIGNUP] Step 3: No WABA ID found in granular_scopes')
        }
      } catch (err) {
        console.error('[EMBEDDED_SIGNUP] Step 3 FAILED: debug_token error:', err)
      }
    }

    // 3. If phoneNumberId is not passed, auto-discover via WABA phone numbers
    if (wabaId && !phoneNumberId) {
      console.log('[EMBEDDED_SIGNUP] Step 4: Auto-discovering Phone Number ID from WABA:', wabaId)
      try {
        const phoneNumbers = await getWabaPhoneNumbers({ wabaId, accessToken })
        console.log('[EMBEDDED_SIGNUP] Step 4: Phone numbers found:', phoneNumbers.length, phoneNumbers.map(p => ({ id: p.id, display: p.display_phone_number })))
        if (phoneNumbers.length > 0) {
          phoneNumberId = phoneNumbers[0].id
          console.log('[EMBEDDED_SIGNUP] Step 4: Phone Number ID discovered:', phoneNumberId)
        }
      } catch (err) {
        console.error('[EMBEDDED_SIGNUP] Step 4 FAILED: Phone number discovery error:', err)
      }
    }

    if (!phoneNumberId || !wabaId) {
      console.error('[EMBEDDED_SIGNUP] FAILED: Missing identifiers', { wabaId, phoneNumberId })
      return NextResponse.json(
        {
          error: 'Impossible d\'identifier le Phone Number ID ou le WABA ID associé à ce compte.',
          partial: { wabaId, phoneNumberId },
        },
        { status: 400 }
      )
    }

    // 4. Verify phone info with Meta
    console.log('[EMBEDDED_SIGNUP] Step 5: Verifying phone number with Meta...')
    let phoneInfo
    try {
      phoneInfo = await verifyPhoneNumber({ phoneNumberId, accessToken })
      console.log('[EMBEDDED_SIGNUP] Step 5: Phone verified:', {
        display: phoneInfo.display_phone_number,
        name: phoneInfo.verified_name,
        quality: phoneInfo.quality_rating,
      })
    } catch (err) {
      console.error('[EMBEDDED_SIGNUP] Step 5 FAILED: Phone verification error:', err)
      const msg = err instanceof Error ? err.message : 'Phone verification failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // 4.5. Subscribe WABA to app webhooks
    console.log('[EMBEDDED_SIGNUP] Step 5.5: Subscribing WABA to app webhooks...')
    try {
      await subscribeWabaToApp({ wabaId, accessToken })
      console.log('[EMBEDDED_SIGNUP] Step 5.5: WABA webhooks subscribed successfully')
    } catch (subErr) {
      console.warn('[EMBEDDED_SIGNUP] Step 5.5 WARNING: Could not subscribe WABA to webhooks:', subErr)
    }

    // 5. Resolve Supabase user
    console.log('[EMBEDDED_SIGNUP] Step 6: Resolving Supabase user...')
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      console.error('[EMBEDDED_SIGNUP] Step 6 FAILED: No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 })
    }
    console.log('[EMBEDDED_SIGNUP] Step 6: User found:', currentUser.id)

    // 6. Get organization ID from header
    const targetOrganizationId = request.headers.get('x-organization-id')
    if (!targetOrganizationId) {
      console.error('[EMBEDDED_SIGNUP] Step 7 FAILED: No organization ID in header')
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }
    console.log('[EMBEDDED_SIGNUP] Step 7: Organization ID:', targetOrganizationId)

    // 7. Encrypt token and store in whatsapp_config
    console.log('[EMBEDDED_SIGNUP] Step 8: Saving to database...')
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
      console.error('[EMBEDDED_SIGNUP] Step 8 FAILED: Database upsert error:', upsertError)
      return NextResponse.json(
        { error: `Échec de sauvegarde WhatsApp: ${upsertError.message}` },
        { status: 500 }
      )
    }

    console.log('[EMBEDDED_SIGNUP] ✅ COMPLETE: WhatsApp connection saved successfully', {
      organizationId: targetOrganizationId,
      wabaId,
      phoneNumberId,
      displayPhone: phoneInfo.display_phone_number,
    })

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
    console.error('[EMBEDDED_SIGNUP] UNHANDLED ERROR:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
