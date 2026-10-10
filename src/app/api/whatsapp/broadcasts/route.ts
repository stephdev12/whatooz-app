import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkQuota } from '@/lib/quota'
import { executeCampaign } from '@/lib/whatsapp/campaign-dispatcher'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: broadcasts, error } = await supabase
    .from('broadcast_campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(broadcasts)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      organizationId, 
      name, 
      campaign_mode,
      target_type, 
      target_tags, 
      target_contacts, 
      message_type, 
      message_payload, 
      scheduled_at,
      recurrence
    } = body

    if (!organizationId || !name || !message_type || !message_payload) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // 1. Verify if organization is allowed to send campaigns (Starter minimum)
    const campaignQuota = await checkQuota(organizationId, 'campaigns')
    if (!campaignQuota.allowed) {
      return NextResponse.json({ error: campaignQuota.error }, { status: 403 })
    }

    // 2. Verify if scheduled/recurring campaigns are allowed (Requires Growth or higher)
    const isScheduled = Boolean(scheduled_at) || (recurrence && recurrence !== 'once') || (message_payload?.scheduling?.mode === 'recurring')
    if (isScheduled) {
      const scheduledQuota = await checkQuota(organizationId, 'scheduled_campaigns')
      if (!scheduledQuota.allowed) {
        return NextResponse.json({ error: scheduledQuota.error }, { status: 403 })
      }
    }

    const initialStatus = isScheduled ? 'scheduled' : 'sending'

    // 3. Create the campaign entry
    const { data: campaign, error } = await supabase
      .from('broadcast_campaigns')
      .insert([
        {
          organization_id: organizationId,
          name,
          target_type: target_type || 'all',
          target_tags: target_tags || [],
          target_contacts: target_contacts || [],
          message_type,
          message_payload,
          scheduled_at: isScheduled ? (scheduled_at || new Date().toISOString()) : null,
          recurrence: recurrence || (isScheduled ? 'recurring' : 'once'),
          status: initialStatus,
          stats: { sent: 0, delivered: 0, read: 0, failed: 0 }
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // 4. If direct execution (immediate), process the batch with contact personalization
    if (!isScheduled) {
      const dispatchRes = await executeCampaign(campaign.id)

      const { data: updatedCampaign } = await supabaseAdmin
        .from('broadcast_campaigns')
        .select('*')
        .eq('id', campaign.id)
        .single()

      if (dispatchRes.status === 'failed' && dispatchRes.sentCount === 0) {
        return NextResponse.json({
          ...(updatedCampaign || campaign),
          error: `Échec de l'envoi de la campagne (0 message envoyé). Erreur : ${dispatchRes.error || 'Vérifiez vos paramètres Meta et numéros autorisés.'}`
        }, { status: 400 })
      }

      return NextResponse.json(updatedCampaign || campaign)
    }

    return NextResponse.json(campaign)
  } catch (err: any) {
    console.error('Create campaign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
