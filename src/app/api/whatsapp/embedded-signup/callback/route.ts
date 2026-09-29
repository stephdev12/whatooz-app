import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/whatsapp/encryption'
import {
  exchangeCodeForToken,
  debugTokenInfo,
  getWabaPhoneNumbers,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/embedded-signup/callback
 * 
 * Handles direct URL redirection from Meta Hosted Embedded Signup:
 * User is redirected here after completing the flow on business.facebook.com
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatooz.space'

  console.log('[CALLBACK] Step 1: Callback received', {
    hasCode: !!code,
    error: error || 'none',
    errorDescription: errorDescription || 'none',
  })

  if (error || !code) {
    console.error('[CALLBACK] FAILED: Meta returned error or no code', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(errorDescription || 'Connexion Meta annulée')}`, baseUrl)
    )
  }

  try {
    // 1. Exchange code for access token (redirect_uri is REQUIRED for hosted flow)
    const redirectUri = `${baseUrl}/api/whatsapp/embedded-signup/callback`
    console.log('[CALLBACK] Step 2: Exchanging code for token with redirectUri:', redirectUri)
    
    const tokenResult = await exchangeCodeForToken({ code, redirectUri })
    const accessToken = tokenResult.access_token

    if (!accessToken) {
      throw new Error('Jeton d\'accès Meta introuvable dans la réponse')
    }
    console.log('[CALLBACK] Step 2: Token exchange successful')

    // 2. Auto-discover WABA
    console.log('[CALLBACK] Step 3: Auto-discovering WABA via debug_token...')
    const debugInfo = await debugTokenInfo({ inputToken: accessToken })
    console.log('[CALLBACK] Step 3: debug_token result:', {
      app_id: debugInfo.app_id,
      is_valid: debugInfo.is_valid,
      scopes: debugInfo.granular_scopes?.map(s => ({ scope: s.scope, targets: s.target_ids })),
    })
    
    const wabaScope = debugInfo.granular_scopes?.find(
      (s) => s.scope === 'whatsapp_business_management'
    )
    const wabaId = wabaScope?.target_ids?.[0]

    if (!wabaId) {
      throw new Error('WABA ID introuvable pour ce compte Meta')
    }
    console.log('[CALLBACK] Step 3: WABA ID:', wabaId)

    // 3. Auto-discover Phone Number
    console.log('[CALLBACK] Step 4: Fetching phone numbers for WABA:', wabaId)
    const phoneNumbers = await getWabaPhoneNumbers({ wabaId, accessToken })
    console.log('[CALLBACK] Step 4: Phone numbers found:', phoneNumbers.map(p => ({ id: p.id, display: p.display_phone_number })))
    
    const phoneNumberId = phoneNumbers[0]?.id
    if (!phoneNumberId) {
      throw new Error('Aucun numéro WhatsApp trouvé sur ce WABA')
    }

    // 4. Verify phone info
    console.log('[CALLBACK] Step 5: Verifying phone number:', phoneNumberId)
    const phoneInfo = await verifyPhoneNumber({ phoneNumberId, accessToken })
    console.log('[CALLBACK] Step 5: Phone verified:', {
      display: phoneInfo.display_phone_number,
      name: phoneInfo.verified_name,
    })

    // 5. Try to get the authenticated user from session
    console.log('[CALLBACK] Step 6: Resolving user session...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let organizationId: string | null = null

    if (user) {
      console.log('[CALLBACK] Step 6: User found from session:', user.id)
      // Get the user's primary organization
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      organizationId = member?.organization_id ?? null
      console.log('[CALLBACK] Step 6: Organization ID from session user:', organizationId)
    } else {
      console.warn('[CALLBACK] Step 6: No user session found (cookies lost after redirect)')
      // Fallback: try to find the organization that already has this WABA configured
      // or look for recent activity
      const { data: existingConfig } = await supabaseAdmin
        .from('whatsapp_config')
        .select('organization_id')
        .eq('waba_id', wabaId)
        .single()

      if (existingConfig) {
        organizationId = existingConfig.organization_id
        console.log('[CALLBACK] Step 6: Found existing org for this WABA:', organizationId)
      }
    }

    if (!organizationId) {
      console.error('[CALLBACK] FAILED: Could not resolve organization_id')
      // Store the data temporarily so the user can link it from settings
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(
          'Session expirée après la redirection Meta. Veuillez réessayer depuis les paramètres.'
        )}&waba_id=${wabaId}&phone_number_id=${phoneNumberId}`, baseUrl)
      )
    }

    // 6. Save to database
    console.log('[CALLBACK] Step 7: Saving to database...')
    const encryptedToken = encrypt(accessToken)
    const { error: upsertError } = await supabaseAdmin.from('whatsapp_config').upsert(
      {
        organization_id: organizationId,
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
      console.error('[CALLBACK] Step 7 FAILED: Database error:', upsertError)
      throw new Error(`Échec de sauvegarde: ${upsertError.message}`)
    }

    console.log('[CALLBACK] ✅ COMPLETE: WhatsApp connection saved', {
      organizationId,
      wabaId,
      phoneNumberId,
      displayPhone: phoneInfo.display_phone_number,
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?meta_connected=true', baseUrl)
    )
  } catch (err) {
    console.error('[CALLBACK] UNHANDLED ERROR:', err)
    const message = err instanceof Error ? err.message : 'Erreur de connexion'
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(message)}`, baseUrl)
    )
  }
}
