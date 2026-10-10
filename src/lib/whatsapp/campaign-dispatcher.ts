import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sendTemplateMessage, listTemplates } from '@/lib/whatsapp/meta-api'

export interface DispatchResult {
  campaignId: string
  name: string
  status: 'completed' | 'failed'
  sentCount: number
  failedCount: number
  error?: string
}

/**
 * Resolves dynamic variable mapping value for a given contact.
 */
function resolveMappingValue(
  mapping: any,
  contact: { id?: string; name?: string | null; phone?: string },
  fallbackVal: string,
  orgName: string
): string {
  if (!mapping) return fallbackVal

  if (mapping.source === 'contact_first_name') {
    if (contact.name && contact.name.trim().length > 0) {
      return contact.name.trim().split(' ')[0]
    }
    return mapping.fallback || fallbackVal
  }

  if (mapping.source === 'contact_name') {
    return contact.name || mapping.fallback || fallbackVal
  }

  if (mapping.source === 'contact_phone') {
    return contact.phone || mapping.fallback || fallbackVal
  }

  if (mapping.source === 'organization_name') {
    return orgName
  }

  if (mapping.source === 'custom') {
    return mapping.customText || mapping.fallback || fallbackVal
  }

  return mapping.fallback || contact.name || fallbackVal
}

/**
 * Builds Meta API compliant template components for a single contact.
 */
export function buildComponentsForContact(
  templateComponents: any[],
  variableMappings: Record<string, any>,
  contact: { id?: string; name?: string | null; phone?: string },
  orgName: string
): Array<Record<string, unknown>> | undefined {
  if (!templateComponents || !Array.isArray(templateComponents) || templateComponents.length === 0) {
    const keys = Object.keys(variableMappings)
    if (keys.length === 0) return undefined

    const bodyParams = keys.map(k => ({
      type: 'text',
      text: resolveMappingValue(variableMappings[k], contact, 'Client', orgName)
    }))
    return [{ type: 'body', parameters: bodyParams }]
  }

  const comps: Array<Record<string, unknown>> = []

  for (const comp of templateComponents) {
    const compType = (comp.type || '').toUpperCase()

    // 1. Header (TEXT, IMAGE, VIDEO, DOCUMENT, LOCATION)
    if (compType === 'HEADER') {
      const format = (comp.format || 'TEXT').toUpperCase()
      if (format === 'TEXT') {
        if (comp.text) {
          const matches = comp.text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []
          if (matches.length > 0) {
            const headerParams = matches.map((placeholder: string, idx: number) => {
              const mapping =
                variableMappings[`header_${placeholder}`] ||
                variableMappings[`header_${idx + 1}`] ||
                variableMappings[placeholder] ||
                variableMappings['header']

              const val = resolveMappingValue(mapping, contact, 'Client', orgName)
              return { type: 'text', text: val || 'Client' }
            })
            comps.push({ type: 'header', parameters: headerParams })
          }
        }
      } else if (['IMAGE', 'VIDEO'].includes(format)) {
        const mediaType = format.toLowerCase()
        const mapping =
          variableMappings['header_media_url'] ||
          variableMappings['header_image_url'] ||
          variableMappings['header_image'] ||
          variableMappings['header']

        let mediaLink = ''
        if (mapping) {
          mediaLink = resolveMappingValue(mapping, contact, '', orgName)
        }
        if (!mediaLink || !mediaLink.startsWith('http')) {
          mediaLink = comp.example?.header_url?.[0] || ''
        }
        if (!mediaLink || !mediaLink.startsWith('http')) {
          if (mediaType === 'image') {
            mediaLink = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80'
          } else {
            mediaLink = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          }
        }

        comps.push({
          type: 'header',
          parameters: [
            {
              type: mediaType,
              [mediaType]: { link: mediaLink }
            }
          ]
        })
      } else if (format === 'DOCUMENT') {
        const mapping =
          variableMappings['header_media_url'] ||
          variableMappings['header_document_url'] ||
          variableMappings['header']

        let mediaLink = ''
        if (mapping) {
          mediaLink = resolveMappingValue(mapping, contact, '', orgName)
        }
        if (!mediaLink || !mediaLink.startsWith('http')) {
          mediaLink = comp.example?.header_url?.[0] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        }

        const docFilename =
          resolveMappingValue(variableMappings['header_document_filename'], contact, '', orgName) ||
          comp.example?.header_filename?.[0] ||
          'Document.pdf'

        comps.push({
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: {
                link: mediaLink,
                filename: docFilename,
              }
            }
          ]
        })
      } else if (format === 'LOCATION') {
        const latVal = resolveMappingValue(variableMappings['header_location_latitude'], contact, '4.0510564', orgName)
        const lngVal = resolveMappingValue(variableMappings['header_location_longitude'], contact, '9.7678687', orgName)
        const locName = resolveMappingValue(variableMappings['header_location_name'], contact, orgName || 'Notre établissement', orgName)
        const locAddress = resolveMappingValue(variableMappings['header_location_address'], contact, 'Centre-ville', orgName)

        comps.push({
          type: 'header',
          parameters: [
            {
              type: 'location',
              location: {
                latitude: latVal,
                longitude: lngVal,
                name: locName,
                address: locAddress
              }
            }
          ]
        })
      }
    }

    // 2. Body
    else if (compType === 'BODY') {
      if (comp.text) {
        const matches = comp.text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []
        if (matches.length > 0) {
          const bodyParams = matches.map((placeholder: string, idx: number) => {
            const mapping =
              variableMappings[`body_${placeholder}`] ||
              variableMappings[`body_${idx + 1}`] ||
              variableMappings[placeholder] ||
              variableMappings[String(idx + 1)]

            const val = resolveMappingValue(mapping, contact, idx === 0 ? 'Cher client' : 'Client', orgName)
            return { type: 'text', text: val || 'Client' }
          })
          comps.push({ type: 'body', parameters: bodyParams })
        }
      }
    }

    // 3. Dynamic Buttons
    else if (compType === 'BUTTONS' && Array.isArray(comp.buttons)) {
      comp.buttons.forEach((btn: any, btnIndex: number) => {
        const btnType = (btn.type || '').toUpperCase()
        if (btnType === 'URL') {
          const isDynamic =
            (btn.url && /\{\{([a-zA-Z0-9_-]+)\}\}/.test(btn.url)) ||
            (Array.isArray(btn.example) && btn.example.length > 0) ||
            btn.url_type === 'DYNAMIC'

          if (isDynamic) {
            const urlMatches = btn.url ? btn.url.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) : null
            const placeholder = urlMatches ? urlMatches[0] : '{{1}}'

            const mapping =
              variableMappings[`button_${btnIndex}_url`] ||
              variableMappings[`button_${btnIndex}`] ||
              variableMappings[`btn_${btnIndex}`] ||
              variableMappings[`button_${placeholder}`] ||
              variableMappings[placeholder]

            let val = resolveMappingValue(mapping, contact, contact.phone || 'order', orgName)
            if (!val || val.trim().length === 0) {
              val = contact.phone || 'order'
            }

            comps.push({
              type: 'button',
              sub_type: 'url',
              index: String(btnIndex),
              parameters: [{ type: 'text', text: val }]
            })
          }
        } else if (btnType === 'COPY_CODE' || btnType === 'COUPON_CODE') {
          const couponCode =
            resolveMappingValue(variableMappings[`button_${btnIndex}_code`], contact, '', orgName) ||
            btn.example?.[0] ||
            'PROMO'
          comps.push({
            type: 'button',
            sub_type: 'coupon_code',
            index: String(btnIndex),
            parameters: [{ type: 'coupon_code', coupon_code: couponCode }]
          })
        } else if (btnType === 'FLOW') {
          const flowToken =
            resolveMappingValue(variableMappings[`button_${btnIndex}_flow_token`], contact, '', orgName) ||
            `flow_${contact.id || contact.phone || Date.now()}`
          comps.push({
            type: 'button',
            sub_type: 'flow',
            index: String(btnIndex),
            parameters: [
              {
                type: 'action',
                action: {
                  flow_token: flowToken
                }
              }
            ]
          })
        }
      })
    }

    // 4. Carousel Component
    else if (compType === 'CAROUSEL' && Array.isArray(comp.cards)) {
      const cards = comp.cards.map((card: any, cardIdx: number) => {
        const cardComponents: Array<Record<string, unknown>> = []
        const cardSubComponents = card.components || []

        // Card Header (Media)
        const cHeader = cardSubComponents.find((c: any) => c.type?.toUpperCase() === 'HEADER')
        if (cHeader) {
          const cFormat = (cHeader.format || 'IMAGE').toUpperCase()
          if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(cFormat)) {
            const mediaType = cFormat.toLowerCase()
            const mapping =
              variableMappings[`card_${cardIdx}_media_url`] ||
              variableMappings[`card_${cardIdx}_image`] ||
              variableMappings[`card_${cardIdx}_header`]

            let link = ''
            if (mapping) {
              link = resolveMappingValue(mapping, contact, '', orgName)
            }
            if (!link || !link.startsWith('http')) {
              link = cHeader.example?.header_url?.[0] || ''
            }
            if (!link || !link.startsWith('http')) {
              if (mediaType === 'image') {
                link = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80'
              } else if (mediaType === 'video') {
                link = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
              } else {
                link = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              }
            }

            cardComponents.push({
              type: 'header',
              parameters: [
                {
                  type: mediaType,
                  [mediaType]: { link }
                }
              ]
            })
          } else if (cFormat === 'TEXT' && cHeader.text) {
            const matches = cHeader.text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []
            if (matches.length > 0) {
              const headerParams = matches.map((placeholder: string) => {
                const mapping =
                  variableMappings[`card_${cardIdx}_header_${placeholder}`] ||
                  variableMappings[`header_${placeholder}`]
                const val = resolveMappingValue(mapping, contact, 'Client', orgName)
                return { type: 'text', text: val || 'Client' }
              })
              cardComponents.push({ type: 'header', parameters: headerParams })
            }
          }
        }

        // Card Body
        const cBody = cardSubComponents.find((c: any) => c.type?.toUpperCase() === 'BODY')
        if (cBody?.text) {
          const matches = cBody.text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []
          if (matches.length > 0) {
            const bodyParams = matches.map((placeholder: string, pIdx: number) => {
              const mapping =
                variableMappings[`card_${cardIdx}_body_${placeholder}`] ||
                variableMappings[`card_${cardIdx}_body_${pIdx + 1}`] ||
                variableMappings[`body_${placeholder}`]
              const val = resolveMappingValue(mapping, contact, pIdx === 0 ? 'Cher client' : 'Client', orgName)
              return { type: 'text', text: val || 'Client' }
            })
            cardComponents.push({ type: 'body', parameters: bodyParams })
          }
        }

        // Card Buttons
        const cButtons = cardSubComponents.find((c: any) => c.type?.toUpperCase() === 'BUTTONS')
        if (cButtons?.buttons && Array.isArray(cButtons.buttons)) {
          cButtons.buttons.forEach((btn: any, btnIndex: number) => {
            const btnType = (btn.type || '').toUpperCase()
            if (btnType === 'URL') {
              const isDynamic =
                (btn.url && /\{\{([a-zA-Z0-9_-]+)\}\}/.test(btn.url)) ||
                (Array.isArray(btn.example) && btn.example.length > 0) ||
                btn.url_type === 'DYNAMIC'
              if (isDynamic) {
                const urlMatches = btn.url ? btn.url.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) : null
                const placeholder = urlMatches ? urlMatches[0] : '{{1}}'
                const mapping =
                  variableMappings[`card_${cardIdx}_button_${btnIndex}_url`] ||
                  variableMappings[`card_${cardIdx}_button_${btnIndex}`] ||
                  variableMappings[`button_${btnIndex}_url`]
                let val = resolveMappingValue(mapping, contact, contact.phone || 'order', orgName)
                if (!val || val.trim().length === 0) {
                  val = contact.phone || 'order'
                }
                cardComponents.push({
                  type: 'button',
                  sub_type: 'url',
                  index: String(btnIndex),
                  parameters: [{ type: 'text', text: val }]
                })
              }
            }
          })
        }

        return {
          card_index: cardIdx,
          components: cardComponents
        }
      })

      comps.push({
        type: 'carousel',
        cards
      })
    }
  }

  return comps.length > 0 ? comps : undefined
}

/**
 * Core engine that dispatches any broadcast campaign (direct or scheduled).
 */
export async function executeCampaign(campaignId: string): Promise<DispatchResult> {
  const { data: campaign, error: fetchErr } = await supabaseAdmin
    .from('broadcast_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (fetchErr || !campaign) {
    throw new Error(`Campagne introuvable (ID: ${campaignId})`)
  }

  const { organization_id: organizationId, name, message_payload } = campaign

  // Update status to sending
  await supabaseAdmin
    .from('broadcast_campaigns')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', campaignId)

  let recipientContacts: Array<{ id: string; name: string | null; phone: string }> = []

  // Resolve target audience
  if (campaign.target_contacts && Array.isArray(campaign.target_contacts) && campaign.target_contacts.length > 0) {
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone')
      .in('id', campaign.target_contacts)
      .eq('organization_id', organizationId)
    if (contacts) recipientContacts = contacts
  } else if (campaign.target_type === 'tags' && campaign.target_tags && campaign.target_tags.length > 0) {
    const { data: tagRows } = await supabaseAdmin
      .from('contact_tags')
      .select('contact_id, contacts(id, name, phone)')
      .in('tag_id', campaign.target_tags)

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
      .eq('id', campaignId)

    return {
      campaignId,
      name,
      status: 'failed',
      sentCount: 0,
      failedCount: 0,
      error: 'Aucun destinataire trouvé.'
    }
  }

  // Get WhatsApp configuration
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
      .eq('id', campaignId)

    return {
      campaignId,
      name,
      status: 'failed',
      sentCount: 0,
      failedCount: recipientContacts.length,
      error: 'Configuration WhatsApp introuvable pour cette organisation.'
    }
  }

  const templateName = message_payload.templateName || message_payload.templateId
  let resolvedLang = message_payload.templateLanguage || message_payload.languageCode
  let templateComponents = message_payload.templateComponents

  // Fetch template components if missing
  if (!resolvedLang || !templateComponents || !Array.isArray(templateComponents) || templateComponents.length === 0) {
    const { data: tmplRow } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('language, components, compiled_payload')
      .eq('organization_id', organizationId)
      .eq('name', templateName)
      .maybeSingle()

    if (tmplRow) {
      if (!resolvedLang) resolvedLang = tmplRow.language || 'fr'
      if (!templateComponents || templateComponents.length === 0) {
        templateComponents = tmplRow.compiled_payload || tmplRow.components || []
      }
    }

    if ((!templateComponents || templateComponents.length === 0) && config.waba_id) {
      try {
        const accessToken = decrypt(config.access_token_encrypted)
        const metaTemplates = await listTemplates({ wabaId: config.waba_id, accessToken })
        const found = metaTemplates.find((t: any) => t.name === templateName)
        if (found) {
          templateComponents = found.components || []
          if (!resolvedLang) resolvedLang = found.language || 'fr'
        }
      } catch (e) {
        console.warn('Could not fetch template details from Meta API:', e)
      }
    }
  }

  if (!resolvedLang) resolvedLang = 'fr'

  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .maybeSingle()
  const orgName = orgData?.name || 'Whatooz'

  const variableMappings = message_payload.templateVariablesMapping || message_payload.variableMappings || {}

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
        const components = buildComponentsForContact(templateComponents, variableMappings, contact, orgName)

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
          const isTranslationMissing =
            errMsg.includes('132001') ||
            (errMsg.toLowerCase().includes('translation') &&
              !errMsg.includes('132000') &&
              !errMsg.includes('132012') &&
              !errMsg.includes('131008') &&
              !errMsg.includes('parameter'))

          if (isTranslationMissing) {
            const altLang = resolvedLang.includes('_') ? resolvedLang.split('_')[0] : `${resolvedLang}_FR`
            sendResult = await sendTemplateMessage({
              phoneNumberId,
              accessToken,
              to: cleanedPhone,
              templateName,
              languageCode: altLang,
              components
            })
            resolvedLang = altLang
          } else {
            throw initialSendErr
          }
        }

        sentCount++

        // Save conversation and message with organization_id
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
                organization_id: organizationId,
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

  const isRecurring = campaign.recurrence === 'recurring' || campaign.message_payload?.scheduling?.mode === 'recurring'
  const finalStatus = (sentCount === 0 && failedCount > 0) 
    ? 'failed' 
    : isRecurring 
      ? 'scheduled' 
      : 'completed'

  await supabaseAdmin
    .from('broadcast_campaigns')
    .update({
      status: finalStatus,
      stats: {
        sent: sentCount,
        delivered: sentCount,
        read: 0,
        failed: failedCount
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return {
    campaignId,
    name,
    status: finalStatus === 'failed' ? 'failed' : 'completed',
    sentCount,
    failedCount,
    error: lastErrorMessage || undefined
  }
}

/**
 * Checks all due scheduled campaigns and recurring campaigns and dispatches them.
 */
export async function checkAndDispatchDueCampaigns(): Promise<{
  checked: number
  dispatched: number
  results: DispatchResult[]
}> {
  const now = new Date()
  const nowIso = now.toISOString()

  // 1. Fetch campaigns that are scheduled and ready to fire
  // A: One-off scheduled: status = 'scheduled' and scheduled_at <= now
  const { data: dueScheduled } = await supabaseAdmin
    .from('broadcast_campaigns')
    .select('id, name, scheduled_at, recurrence, message_payload')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)

  // B: Recurring campaigns (scheduled or completed): check day of week and current time
  const { data: recurringList } = await supabaseAdmin
    .from('broadcast_campaigns')
    .select('id, name, scheduled_at, recurrence, message_payload, updated_at')
    .or('recurrence.eq.recurring,status.eq.scheduled')

  const toDispatchIds = new Set<string>()

  if (dueScheduled) {
    dueScheduled.forEach(c => {
      // If recurrence === 'once' or no recurrence, it's definitely due
      if (!c.recurrence || c.recurrence === 'once') {
        toDispatchIds.add(c.id)
      }
    })
  }

  // Handle recurring schedules
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDayName = daysOfWeek[now.getUTCDay()]
  const currentHours = String(now.getUTCHours()).padStart(2, '0')
  const currentMinutes = String(now.getUTCMinutes()).padStart(2, '0')
  const currentTimeStr = `${currentHours}:${currentMinutes}`

  if (recurringList) {
    recurringList.forEach(c => {
      const scheduling = c.message_payload?.scheduling
      if (scheduling?.mode === 'recurring' && Array.isArray(scheduling.days)) {
        const isTodayScheduled = scheduling.days.includes(currentDayName)
        if (isTodayScheduled) {
          // Check if current time is within +/- 15 minutes of any scheduled time slot
          const times = scheduling.times || ['09:00']
          const isTimeSlotDue = times.some((tStr: string) => {
            const [tH, tM] = tStr.split(':').map(Number)
            const targetMin = tH * 60 + tM
            const currentMin = now.getUTCHours() * 60 + now.getUTCMinutes()
            return Math.abs(currentMin - targetMin) <= 15
          })

          // Ensure it wasn't already dispatched in the last 20 minutes
          const lastUpdated = c.updated_at ? new Date(c.updated_at).getTime() : 0
          const msSinceLastUpdate = Date.now() - lastUpdated
          if (isTimeSlotDue && msSinceLastUpdate > 20 * 60 * 1000) {
            toDispatchIds.add(c.id)
          }
        }
      }
    })
  }

  const idsToRun = Array.from(toDispatchIds)
  const results: DispatchResult[] = []

  for (const cId of idsToRun) {
    try {
      const res = await executeCampaign(cId)
      results.push(res)
    } catch (e: any) {
      console.error(`Error executing scheduled campaign ${cId}:`, e)
      results.push({
        campaignId: cId,
        name: 'Campagne',
        status: 'failed',
        sentCount: 0,
        failedCount: 1,
        error: e.message
      })
    }
  }

  return {
    checked: (dueScheduled?.length || 0) + (recurringList?.length || 0),
    dispatched: results.length,
    results
  }
}
