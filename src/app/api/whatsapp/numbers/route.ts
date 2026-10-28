import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/whatsapp/encryption'
import { verifyPhoneNumber, subscribeWabaToApp } from '@/lib/whatsapp/meta-api'
import { checkQuota } from '@/lib/quota'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/numbers — List all connected WhatsApp phone numbers for the organization.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID requis' }, { status: 400 })
    }

    // 1. Fetch connected numbers
    const { data: configs, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (configError) {
      console.error('[Numbers GET] Error fetching configs:', configError)
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    // 2. Fetch conversation count per number
    const { data: convoStats } = await supabaseAdmin
      .from('conversations')
      .select('phone_number_id')
      .eq('organization_id', organizationId)

    const conversationCounts: Record<string, number> = {}
    for (const c of convoStats || []) {
      if (c.phone_number_id) {
        conversationCounts[c.phone_number_id] = (conversationCounts[c.phone_number_id] || 0) + 1
      }
    }

    // 3. Check quota
    const quota = await checkQuota(organizationId, 'whatsapp_numbers')

    const numbers = (configs || []).map((c) => ({
      id: c.id,
      phone_number_id: c.phone_number_id,
      waba_id: c.waba_id,
      display_phone_number: c.display_phone_number,
      verified_name: c.verified_name,
      phone_label: c.phone_label || (c.is_default ? 'Principal' : 'Secondaire'),
      quality_rating: c.quality_rating,
      is_default: !!c.is_default,
      status: c.status || (c.connected ? 'active' : 'disconnected'),
      connected: c.connected,
      conversations_count: conversationCounts[c.phone_number_id] || 0,
      created_at: c.created_at,
    }))

    return NextResponse.json({
      numbers,
      quota: {
        current: numbers.length,
        max: quota.max ?? 1,
        can_add_more: numbers.length < (quota.max ?? 1),
        plan_name: quota.planName,
      },
    })
  } catch (err: any) {
    console.error('[Numbers GET] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}

/**
 * POST /api/whatsapp/numbers — Add and verify a new WhatsApp Business phone number.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID requis' }, { status: 400 })
    }

    // 1. Quota check
    const quota = await checkQuota(organizationId, 'whatsapp_numbers')
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.error || 'Limite de numéros WhatsApp atteinte pour votre forfait.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { accessToken, phoneNumberId, wabaId, phoneLabel } = body

    if (!accessToken || !phoneNumberId || !wabaId) {
      return NextResponse.json(
        { error: 'accessToken, phoneNumberId et wabaId sont requis' },
        { status: 400 }
      )
    }

    // 2. Verify credentials with Meta
    let phoneInfo
    try {
      phoneInfo = await verifyPhoneNumber({
        phoneNumberId,
        accessToken,
      })
    } catch (err: any) {
      return NextResponse.json(
        { error: `Vérification Meta échouée : ${err.message || 'Informations invalides'}` },
        { status: 400 }
      )
    }

    // 3. Subscribe WABA to app webhooks
    try {
      await subscribeWabaToApp({ wabaId, accessToken })
    } catch (subErr) {
      console.warn(`[Numbers POST] Failed to subscribe WABA ${wabaId}:`, subErr)
    }

    // 4. Encrypt token
    const encryptedToken = encrypt(accessToken)

    // 5. Check if it's the first number
    const { count } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const isFirstNumber = (count || 0) === 0
    const label = phoneLabel?.trim() || phoneInfo.verified_name || (isFirstNumber ? 'Principal' : `Numéro ${phoneInfo.display_phone_number}`)

    const { data: inserted, error: insertError } = await supabaseAdmin
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
          phone_label: label,
          is_default: isFirstNumber,
          status: 'active',
          connected: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number_id' }
      )
      .select('*')
      .single()

    if (insertError) {
      console.error('[Numbers POST] Insert error:', insertError)
      return NextResponse.json({ error: `Erreur base de données: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      number: {
        id: inserted.id,
        phone_number_id: inserted.phone_number_id,
        display_phone_number: inserted.display_phone_number,
        verified_name: inserted.verified_name,
        phone_label: inserted.phone_label,
        is_default: inserted.is_default,
        quality_rating: inserted.quality_rating,
        connected: inserted.connected,
      },
    })
  } catch (err: any) {
    console.error('[Numbers POST] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}
