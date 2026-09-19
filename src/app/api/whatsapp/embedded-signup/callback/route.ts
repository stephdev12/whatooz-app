import { NextRequest, NextResponse } from 'next/server'
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
 * GET /api/whatsapp/embedded-signup/callback
 * 
 * Handles direct URL redirection from Meta Onboarding flow:
 * https://business.facebook.com/messaging/whatsapp/onboard/?app_id=...&redirect_uri=https://whatooz.space/api/whatsapp/embedded-signup/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatooz.space'

  if (error || !code) {
    console.error('Meta OAuth callback error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(errorDescription || 'Connexion Meta annulée')}`, baseUrl)
    )
  }

  try {
    const redirectUri = `${baseUrl}/api/whatsapp/embedded-signup/callback`
    const tokenResult = await exchangeCodeForToken({ code, redirectUri })
    const accessToken = tokenResult.access_token

    if (!accessToken) {
      throw new Error('Jeton d’accès Meta introuvable dans la réponse')
    }

    // Auto-discover WABA and Phone Number
    const debugInfo = await debugTokenInfo({ inputToken: accessToken })
    const wabaScope = debugInfo.granular_scopes?.find(
      (s) => s.scope === 'whatsapp_business_management'
    )
    const wabaId = wabaScope?.target_ids?.[0]

    if (!wabaId) {
      throw new Error('WABA ID introuvable pour ce compte Meta')
    }

    const phoneNumbers = await getWabaPhoneNumbers({ wabaId, accessToken })
    const phoneNumberId = phoneNumbers[0]?.id

    if (!phoneNumberId) {
      throw new Error('Aucun numéro WhatsApp trouvé sur ce WABA')
    }

    const phoneInfo = await verifyPhoneNumber({ phoneNumberId, accessToken })

    // Fetch user or profile
    let metaEmail: string | undefined
    let metaName: string | undefined
    try {
      const profile = await getMetaUserProfile({ accessToken })
      metaEmail = profile.email
      metaName = profile.name
    } catch {
      // ignore
    }

    const email = metaEmail || `whatsapp_${phoneNumberId}@whatooz.space`
    const fullName = metaName || `WhatsApp User ${phoneInfo.display_phone_number}`

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let userId = existingUsers?.users?.find((u) => u.email === email)?.id

    if (!userId) {
      const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      userId = newUser.user?.id
      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          user_id: userId,
          full_name: fullName,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (userId) {
      const encryptedToken = encrypt(accessToken)
      await supabaseAdmin.from('whatsapp_config').upsert(
        {
          user_id: userId,
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
    }

    return NextResponse.redirect(
      new URL('/dashboard/inbox?meta_connected=true', baseUrl)
    )
  } catch (err) {
    console.error('Callback error:', err)
    const message = err instanceof Error ? err.message : 'Erreur de connexion'
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(message)}`, baseUrl)
    )
  }
}
