import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/automations — List all automation scenarios for current user.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: automations, error } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ automations: automations ?? [] })
}

/**
 * POST /api/whatsapp/automations — Create a new automation scenario.
 *
 * Body:
 * - name: string
 * - trigger_type: 'keyword' | 'first_message'
 * - trigger_value?: string
 * - action_type: 'send_template' | 'send_flow' | 'send_text'
 * - action_payload: {
 *     template_name?: string
 *     language_code?: string
 *     header_image_url?: string
 *     body_variables?: string[]
 *     flow_id?: string
 *     flow_cta?: string
 *     body_text?: string
 *     text?: string
 *   }
 * - is_active?: boolean
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    trigger_type = 'keyword',
    trigger_value,
    action_type,
    action_payload = {},
    is_active = true,
  } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Le nom de l’automatisation est requis.' }, { status: 400 })
  }

  if (trigger_type === 'keyword' && !trigger_value?.trim()) {
    return NextResponse.json(
      { error: 'Veuillez renseigner le mot-clé déclencheur (ex: DEVIS, INFO).' },
      { status: 400 }
    )
  }

  if (!['send_template', 'send_flow', 'send_text'].includes(action_type)) {
    return NextResponse.json({ error: 'Type d’action invalide.' }, { status: 400 })
  }

  // Validate action payload
  if (action_type === 'send_template' && !action_payload.template_name) {
    return NextResponse.json({ error: 'Le nom du template est requis pour cette action.' }, { status: 400 })
  }
  if (action_type === 'send_flow' && !action_payload.flow_id) {
    return NextResponse.json({ error: 'Veuillez sélectionner un WhatsApp Flow pour cette action.' }, { status: 400 })
  }
  if (action_type === 'send_text' && !action_payload.text?.trim()) {
    return NextResponse.json({ error: 'Le message texte de réponse est requis.' }, { status: 400 })
  }

  const { data: created, error } = await supabaseAdmin
    .from('automations')
    .insert({
      user_id: user.id,
      name: name.trim(),
      trigger_type,
      trigger_value: trigger_type === 'keyword' ? trigger_value.trim().toUpperCase() : null,
      action_type,
      action_payload,
      is_active,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ automation: created }, { status: 201 })
}

/**
 * PATCH /api/whatsapp/automations — Update automation (toggle active, update details).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, is_active, name, trigger_type, trigger_value, action_type, action_payload } = body

  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof is_active === 'boolean') updates.is_active = is_active
  if (name) updates.name = name.trim()
  if (trigger_type) updates.trigger_type = trigger_type
  if (trigger_value !== undefined) {
    updates.trigger_value = trigger_value ? trigger_value.trim().toUpperCase() : null
  }
  if (action_type) updates.action_type = action_type
  if (action_payload) updates.action_payload = action_payload

  const { data: updated, error } = await supabaseAdmin
    .from('automations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ automation: updated })
}

/**
 * DELETE /api/whatsapp/automations — Delete an automation scenario.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const searchParams = request.nextUrl.searchParams
  const id = body.id || searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('automations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
