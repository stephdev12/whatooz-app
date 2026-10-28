import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'
import { verifyPhoneNumber, subscribeWabaToApp } from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/config — Load current WhatsApp config (token masked).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: configs } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  const config = configs?.[0]

  if (!config) {
    return NextResponse.json({ config: null, numbers: [], total_numbers: 0 })
  }

  return NextResponse.json({
    config: {
      id: config.id,
      phone_number_id: config.phone_number_id,
      waba_id: config.waba_id,
      display_phone_number: config.display_phone_number,
      verified_name: config.verified_name,
      phone_label: config.phone_label || (config.is_default ? 'Principal' : 'Secondaire'),
      is_default: !!config.is_default,
      has_token: !!config.access_token_encrypted,
      connected: config.connected,
    },
    total_numbers: configs.length,
    numbers: configs.map(c => ({
      id: c.id,
      phone_number_id: c.phone_number_id,
      display_phone_number: c.display_phone_number,
      verified_name: c.verified_name,
      phone_label: c.phone_label || (c.is_default ? 'Principal' : 'Secondaire'),
      is_default: !!c.is_default,
      connected: c.connected,
    }))
  })
}

/**
 * POST /api/whatsapp/config — Save & verify WhatsApp credentials.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const body = await request.json()

  // Allow re-subscribing webhooks for already configured WABA
  if (body.action === 'resync') {
    const { data: currentConfig } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (!currentConfig?.access_token_encrypted || !currentConfig.waba_id) {
      return NextResponse.json({ error: 'WhatsApp non configuré pour cette organisation' }, { status: 400 })
    }

    try {
      const token = decrypt(currentConfig.access_token_encrypted)
      await subscribeWabaToApp({ wabaId: currentConfig.waba_id, accessToken: token })
      return NextResponse.json({ success: true, message: 'Webhooks WhatsApp réactivés et synchronisés avec succès.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de synchronisation'
      return NextResponse.json({ error: `Erreur lors de la réactivation des webhooks: ${message}` }, { status: 500 })
    }
  }

  const { accessToken, phoneNumberId, wabaId } = body

  if (!accessToken || !phoneNumberId || !wabaId) {
    return NextResponse.json(
      { error: 'accessToken, phoneNumberId, and wabaId are required' },
      { status: 400 }
    )
  }

  // Verify credentials with Meta
  let phoneInfo
  try {
    phoneInfo = await verifyPhoneNumber({
      phoneNumberId,
      accessToken,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return NextResponse.json(
      { error: `Meta verification failed: ${message}` },
      { status: 400 }
    )
  }

  // Subscribe WABA to app webhooks
  try {
    await subscribeWabaToApp({ wabaId, accessToken })
    console.log(`[Config POST] WABA ${wabaId} subscribed to app webhooks successfully.`)
  } catch (subErr) {
    console.warn(`[Config POST] Could not subscribe WABA ${wabaId} to webhooks:`, subErr)
  }

  let encryptedToken: string
  try {
    encryptedToken = encrypt(accessToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Encryption failed'
    console.error('Token encryption error:', err)
    return NextResponse.json(
      { error: `Encryption error: ${message}` },
      { status: 500 }
    )
  }

  // Check if first number to set default
  const { count: existingCount } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const isFirstNumber = !existingCount || existingCount === 0

  const { error: upsertError } = await supabaseAdmin
    .from('whatsapp_config')
    .upsert(
      {
        organization_id: organizationId,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        access_token_encrypted: encryptedToken,
        display_phone_number: phoneInfo.display_phone_number,
        verified_name: phoneInfo.verified_name ?? null,
        quality_rating: phoneInfo.quality_rating ?? null,
        phone_label: phoneInfo.verified_name || (isFirstNumber ? 'Principal' : `Numéro ${phoneInfo.display_phone_number}`),
        is_default: isFirstNumber,
        status: 'active',
        connected: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone_number_id' }
    )

  if (upsertError) {
    console.error('whatsapp_config upsertError:', upsertError)
    return NextResponse.json(
      { error: `Database error: ${upsertError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    phoneInfo: {
      display_phone_number: phoneInfo.display_phone_number,
      verified_name: phoneInfo.verified_name,
    },
  })
}
