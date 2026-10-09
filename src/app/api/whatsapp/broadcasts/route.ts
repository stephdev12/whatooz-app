import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkQuota } from '@/lib/quota'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sendTemplateMessage } from '@/lib/whatsapp/meta-api'

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
      let recipientContacts: Array<{ id: string; name: string | null; phone: string }> = []

      // Fetch contacts
      if (target_contacts && Array.isArray(target_contacts) && target_contacts.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, name, phone')
          .in('id', target_contacts)
          .eq('organization_id', organizationId)
        if (contacts) recipientContacts = contacts
      } else if (target_type === 'tags' && target_tags && target_tags.length > 0) {
        // Tag-based contacts
        const { data: tagRows } = await supabase
          .from('contact_tags')
          .select('contact_id, contacts(id, name, phone)')
          .in('tag_id', target_tags)

        if (tagRows) {
          const map = new Map<string, any>()
          tagRows.forEach((r: any) => {
            if (r.contacts && !map.has(r.contacts.id)) {
              map.set(r.contacts.id, r.contacts)
            }
          })
          recipientContacts = Array.from(map.values())
        }
      } else {
        // All contacts
        const { data: allContacts } = await supabase
          .from('contacts')
          .select('id, name, phone')
          .eq('organization_id', organizationId)
        if (allContacts) recipientContacts = allContacts
      }

      // Check WhatsApp config
      const { data: config } = await supabaseAdmin
        .from('whatsapp_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()

      const templateName = message_payload.templateName || message_payload.templateId
      const variableMappings = message_payload.templateVariablesMapping || message_payload.variableMappings || {}
      const detectedVars = Object.keys(variableMappings)

      let sentCount = 0
      let failedCount = 0

      // Execute dispatch if WhatsApp is connected
      if (config?.access_token_encrypted && config?.phone_number_id && templateName) {
        try {
          const accessToken = decrypt(config.access_token_encrypted)
          const phoneNumberId = config.phone_number_id

          for (const contact of recipientContacts) {
            try {
              // Construct personalized parameters for this specific contact
              const parameters = detectedVars.map((v) => {
                const mapping = variableMappings[v]
                let val = 'Client'

                if (mapping) {
                  if (mapping.source === 'contact_first_name') {
                    val = contact.name ? contact.name.trim().split(' ')[0] : (mapping.fallback || 'Client')
                  } else if (mapping.source === 'contact_name') {
                    val = contact.name || mapping.fallback || 'Client'
                  } else if (mapping.source === 'contact_phone') {
                    val = contact.phone || ''
                  } else if (mapping.source === 'custom') {
                    val = mapping.customText || mapping.fallback || ''
                  } else {
                    val = mapping.fallback || contact.name || 'Client'
                  }
                }

                return {
                  type: 'text',
                  text: val || 'Client'
                }
              })

              const components = parameters.length > 0 ? [
                {
                  type: 'body',
                  parameters
                }
              ] : undefined

              await sendTemplateMessage({
                phoneNumberId,
                accessToken,
                to: contact.phone,
                templateName,
                languageCode: 'fr',
                components
              })

              sentCount++
            } catch (sendErr) {
              console.error(`Failed to dispatch to ${contact.phone}:`, sendErr)
              failedCount++
            }
          }
        } catch (authErr) {
          console.error('WhatsApp dispatch auth error:', authErr)
          failedCount += recipientContacts.length
        }
      } else {
        // WhatsApp not connected or demo mode: register simulated dispatch
        sentCount = recipientContacts.length
      }

      // Update campaign status
      await supabase
        .from('broadcast_campaigns')
        .update({
          status: 'completed',
          stats: {
            sent: sentCount,
            delivered: sentCount,
            read: 0,
            failed: failedCount
          }
        })
        .eq('id', campaign.id)

      campaign.status = 'completed'
      campaign.stats = { sent: sentCount, delivered: sentCount, read: 0, failed: failedCount }
    }

    return NextResponse.json(campaign)
  } catch (err: any) {
    console.error('Create campaign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
