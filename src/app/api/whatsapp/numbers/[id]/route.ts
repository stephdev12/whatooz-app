import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/whatsapp/numbers/[id] — Update phone number label or set as default.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { phoneLabel, isDefault } = body

    // 1. Verify existence in this organization
    const { data: targetNumber } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (!targetNumber) {
      return NextResponse.json({ error: 'Numéro introuvable dans cette organisation' }, { status: 404 })
    }

    // 2. If setting as default, clear default from others
    if (isDefault) {
      await supabaseAdmin
        .from('whatsapp_config')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (phoneLabel !== undefined) {
      updates.phone_label = phoneLabel.trim()
    }
    if (isDefault !== undefined) {
      updates.is_default = !!isDefault
    }

    const { data: updated, error } = await supabaseAdmin
      .from('whatsapp_config')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      number: {
        id: updated.id,
        phone_number_id: updated.phone_number_id,
        display_phone_number: updated.display_phone_number,
        verified_name: updated.verified_name,
        phone_label: updated.phone_label,
        is_default: updated.is_default,
        quality_rating: updated.quality_rating,
        status: updated.status,
      },
    })
  } catch (err: any) {
    console.error('[Numbers PATCH] Error:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}

/**
 * DELETE /api/whatsapp/numbers/[id] — Disconnect a WhatsApp phone number.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // 1. Verify target number
    const { data: targetNumber } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (!targetNumber) {
      return NextResponse.json({ error: 'Numéro introuvable' }, { status: 404 })
    }

    const wasDefault = targetNumber.is_default

    // 2. Delete number from whatsapp_config
    const { error: deleteError } = await supabaseAdmin
      .from('whatsapp_config')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 3. If was default, promote another number to default
    if (wasDefault) {
      const { data: remaining } = await supabaseAdmin
        .from('whatsapp_config')
        .select('id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (remaining && remaining.length > 0) {
        await supabaseAdmin
          .from('whatsapp_config')
          .update({ is_default: true })
          .eq('id', remaining[0].id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Numéro WhatsApp déconnecté avec succès.',
    })
  } catch (err: any) {
    console.error('[Numbers DELETE] Error:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}
