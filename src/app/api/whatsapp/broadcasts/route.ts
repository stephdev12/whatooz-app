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

      // Fetch contacts using supabaseAdmin for reliable access
      if (target_contacts && Array.isArray(target_contacts) && target_contacts.length > 0) {
        const { data: contacts } = await supabaseAdmin
          .from('contacts')
          .select('id, name, phone')
          .in('id', target_contacts)
          .eq('organization_id', organizationId)
        if (contacts) recipientContacts = contacts
      } else if (target_type === 'tags' && target_tags && target_tags.length > 0) {
        // Tag-based contacts
        const { data: tagRows } = await supabaseAdmin
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
        const { data: allContacts } = await supabaseAdmin
          .from('contacts')
          .select('id, name, phone')
          .eq('organization_id', organizationId)
        if (allContacts) recipientContacts = allContacts
      }

      if (recipientContacts.length === 0) {
        await supabaseAdmin
          .from('broadcast_campaigns')
          .update({
            status: 'failed',
            stats: { sent: 0, delivered: 0, read: 0, failed: 0 }
          })
          .eq('id', campaign.id)

        return NextResponse.json({
          ...campaign,
          status: 'failed',
          stats: { sent: 0, delivered: 0, read: 0, failed: 0 },
          error: 'Aucun contact destinataire trouvé pour cette audience.'
        })
      }

      // Check WhatsApp config
      const { data: config } = await supabaseAdmin
        .from('whatsapp_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (!config?.access_token_encrypted || !config?.phone_number_id) {
        await supabaseAdmin
          .from('broadcast_campaigns')
          .update({
            status: 'failed',
            stats: { sent: 0, delivered: 0, read: 0, failed: recipientContacts.length }
          })
          .eq('id', campaign.id)

        return NextResponse.json({
          error: 'WhatsApp n\'est pas connecté. Veuillez connecter votre numéro WhatsApp Cloud API dans les Paramètres avant de lancer une campagne.'
        }, { status: 400 })
      }

      const templateName = message_payload.templateName || message_payload.templateId
      if (!templateName) {
        await supabaseAdmin
          .from('broadcast_campaigns')
          .update({
            status: 'failed',
            stats: { sent: 0, delivered: 0, read: 0, failed: recipientContacts.length }
          })
          .eq('id', campaign.id)

        return NextResponse.json({ error: 'Nom du modèle WhatsApp manquant.' }, { status: 400 })
      }

      // Resolve template language: passed from client, or lookup in DB, or fallback
      let resolvedLang = message_payload.templateLanguage || message_payload.languageCode
      if (!resolvedLang) {
        const { data: tmplRow } = await supabaseAdmin
          .from('whatsapp_templates')
          .select('language')
          .eq('organization_id', organizationId)
          .eq('name', templateName)
          .maybeSingle()
        resolvedLang = tmplRow?.language || 'fr_FR'
      }

      const variableMappings = message_payload.templateVariablesMapping || message_payload.variableMappings || {}
      const detectedVars = Object.keys(variableMappings)

      let sentCount = 0
      let failedCount = 0
      let lastErrorMessage = ''

      try {
        const accessToken = decrypt(config.access_token_encrypted)
        const phoneNumberId = config.phone_number_id

        for (const contact of recipientContacts) {
          const rawPhone = contact.phone || ''
          const cleanedPhone = rawPhone.replace(/[^\d]/g, '')
          if (!cleanedPhone) {
            failedCount++
            continue
          }

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

            let sendResult: any = null
            try {
              sendResult = await sendTemplateMessage({
                phoneNumberId,
                accessToken,
                to: cleanedPhone,
                templateName,
                languageCode: resolvedLang,
                components
              })
            } catch (initialSendErr: any) {
              const errMsg = String(initialSendErr?.message || '')
              // If language translation error (Meta 132000), retry with alternate language format
              if (errMsg.includes('132000') || errMsg.toLowerCase().includes('translation') || errMsg.toLowerCase().includes('language')) {
                const altLang = resolvedLang.includes('_') ? resolvedLang.split('_')[0] : `${resolvedLang}_FR`
                sendResult = await sendTemplateMessage({
                  phoneNumberId,
                  accessToken,
                  to: cleanedPhone,
                  templateName,
                  languageCode: altLang,
                  components
                })
                resolvedLang = altLang // Memorize working language
              } else {
                throw initialSendErr
              }
            }

            sentCount++

            // Persist message in conversation thread
            try {
              let convoId: string | null = null
              const { data: existingConvo } = await supabaseAdmin
                .from('conversations')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('contact_phone', cleanedPhone)
                .maybeSingle()

              if (existingConvo) {
                convoId = existingConvo.id
                await supabaseAdmin
                  .from('conversations')
                  .update({
                    last_message_text: `[Campagne: ${name}] ${templateName}`,
                    last_message_at: new Date().toISOString(),
                  })
                  .eq('id', convoId)
              } else {
                const { data: newConvo } = await supabaseAdmin
                  .from('conversations')
                  .insert({
                    organization_id: organizationId,
                    contact_phone: cleanedPhone,
                    contact_name: contact.name || cleanedPhone,
                    status: 'open',
                    last_message_text: `[Campagne: ${name}] ${templateName}`,
                    last_message_at: new Date().toISOString(),
                  })
                  .select('id')
                  .maybeSingle()
                if (newConvo) convoId = newConvo.id
              }

              if (convoId) {
                await supabaseAdmin
                  .from('messages')
                  .insert({
                    conversation_id: convoId,
                    direction: 'outbound',
                    message_type: 'template',
                    content_text: `[Campagne: ${name}] Template: ${templateName}`,
                    status: 'sent',
                    wamid: sendResult?.messageId || null,
                  })
              }
            } catch (persistErr) {
              console.warn('Could not persist outbound campaign message:', persistErr)
            }
          } catch (sendErr: any) {
            console.error(`Failed to dispatch to ${contact.phone}:`, sendErr)
            lastErrorMessage = sendErr?.message || 'Erreur inconnue Meta API'
            failedCount++
          }
        }
      } catch (authErr: any) {
        console.error('WhatsApp dispatch auth error:', authErr)
        lastErrorMessage = authErr?.message || 'Erreur authentification WhatsApp'
        failedCount += recipientContacts.length
      }

      // Determine final status
      const finalStatus = (sentCount === 0 && failedCount > 0) ? 'failed' : 'completed'

      await supabaseAdmin
        .from('broadcast_campaigns')
        .update({
          status: finalStatus,
          stats: {
            sent: sentCount,
            delivered: sentCount,
            read: 0,
            failed: failedCount
          }
        })
        .eq('id', campaign.id)

      campaign.status = finalStatus
      campaign.stats = { sent: sentCount, delivered: sentCount, read: 0, failed: failedCount }

      if (finalStatus === 'failed') {
        return NextResponse.json({
          ...campaign,
          error: `Échec de l'envoi de la campagne (0 message envoyé). Erreur : ${lastErrorMessage || 'Vérifiez vos paramètres Meta et numéros autorisés.'}`
        }, { status: 400 })
      }
    }

    return NextResponse.json(campaign)
  } catch (err: any) {
    console.error('Create campaign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
