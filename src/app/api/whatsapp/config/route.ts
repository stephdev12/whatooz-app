import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'
import { verifyPhoneNumber } from '@/lib/whatsapp/meta-api'

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

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (!config) {
    return NextResponse.json({ config: null })
  }

  return NextResponse.json({
    config: {
      phone_number_id: config.phone_number_id,
      waba_id: config.waba_id,
      display_phone_number: config.display_phone_number,
      verified_name: config.verified_name,
      has_token: !!config.access_token_encrypted,
      connected: config.connected,
    },
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
        connected: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
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
