import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkQuota } from '@/lib/quota'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sendTemplateMessage, listTemplates } from '@/lib/whatsapp/meta-api'

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

      // Resolve template language & components
      let resolvedLang = message_payload.templateLanguage || message_payload.languageCode
      let templateComponents = message_payload.templateComponents

      // If components or language missing, lookup from database or Meta API
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

        // If still missing and config has waba_id, fetch from Meta API
        if ((!templateComponents || templateComponents.length === 0) && config.waba_id) {
          try {
            const accessToken = decrypt(config.access_token_encrypted)
            const metaTemplates = await listTemplates({ wabaId: config.waba_id, accessToken })
            const foundMetaTmpl = metaTemplates.find((t: any) => t.name === templateName)
            if (foundMetaTmpl) {
              templateComponents = foundMetaTmpl.components || []
              if (!resolvedLang) resolvedLang = foundMetaTmpl.language || 'fr'
            }
          } catch (fetchErr) {
            console.warn('Could not fetch template details from Meta API:', fetchErr)
          }
        }
      }

      if (!resolvedLang) resolvedLang = 'fr'

      // Get organization name for mapping
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .maybeSingle()
      const orgName = orgData?.name || 'Whatooz'

      const variableMappings = message_payload.templateVariablesMapping || message_payload.variableMappings || {}

      // Helper function to resolve mapping value for a contact
      const resolveMappingValue = (mapping: any, contact: any, fallbackVal: string): string => {
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

      // Helper function to build Meta components for a contact
      const buildComponentsForContact = (contact: any): Array<Record<string, unknown>> | undefined => {
        if (!templateComponents || !Array.isArray(templateComponents) || templateComponents.length === 0) {
          // Fallback if no components structure is known:
          // ONLY create body parameters if variableMappings has keys
          const keys = Object.keys(variableMappings)
          if (keys.length === 0) return undefined

          const bodyParams = keys.map(k => ({
            type: 'text',
            text: resolveMappingValue(variableMappings[k], contact, 'Client')
          }))
          return [{ type: 'body', parameters: bodyParams }]
        }

        const comps: Array<Record<string, unknown>> = []

        for (const comp of templateComponents) {
          const compType = (comp.type || '').toUpperCase()

          // 1. Header (TEXT or MEDIA format)
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

                    const val = resolveMappingValue(mapping, contact, 'Client')
                    return { type: 'text', text: val || 'Client' }
                  })
                  comps.push({ type: 'header', parameters: headerParams })
                }
              }
            } else if (['IMAGE', 'VIDEO'].includes(format)) {
              // Media Header: Meta strictly requires { type: 'image'|'video', [type]: { link } }
              const mediaType = format.toLowerCase()
              const mapping =
                variableMappings['header_media_url'] ||
                variableMappings['header_image_url'] ||
                variableMappings['header_image'] ||
                variableMappings['header']

              let mediaLink = ''
              if (mapping) {
                mediaLink = resolveMappingValue(mapping, contact, '')
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
              // Document Header with optional filename
              const mapping =
                variableMappings['header_media_url'] ||
                variableMappings['header_document_url'] ||
                variableMappings['header']

              let mediaLink = ''
              if (mapping) {
                mediaLink = resolveMappingValue(mapping, contact, '')
              }
              if (!mediaLink || !mediaLink.startsWith('http')) {
                mediaLink = comp.example?.header_url?.[0] || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              }

              const docFilename =
                resolveMappingValue(variableMappings['header_document_filename'], contact, '') ||
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
              // Location Header (coordinates & address)
              const latVal = resolveMappingValue(variableMappings['header_location_latitude'], contact, '4.0510564')
              const lngVal = resolveMappingValue(variableMappings['header_location_longitude'], contact, '9.7678687')
              const locName = resolveMappingValue(variableMappings['header_location_name'], contact, orgName || 'Notre établissement')
              const locAddress = resolveMappingValue(variableMappings['header_location_address'], contact, 'Centre-ville')

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

                  const val = resolveMappingValue(mapping, contact, idx === 0 ? 'Cher client' : 'Client')
                  return { type: 'text', text: val || 'Client' }
                })
                comps.push({ type: 'body', parameters: bodyParams })
              }
              // STRICT: If matches.length === 0, DO NOT add body component!
            }
          }

          // 3. Dynamic Buttons (URL, Copy Code, Flow)
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

                  let val = resolveMappingValue(mapping, contact, contact.phone || 'order')
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
                  resolveMappingValue(variableMappings[`button_${btnIndex}_code`], contact, '') ||
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
                  resolveMappingValue(variableMappings[`button_${btnIndex}_flow_token`], contact, '') ||
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
                    link = resolveMappingValue(mapping, contact, '')
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
                    const headerParams = matches.map((placeholder: string, pIdx: number) => {
                      const mapping =
                        variableMappings[`card_${cardIdx}_header_${placeholder}`] ||
                        variableMappings[`card_${cardIdx}_header_${pIdx + 1}`] ||
                        variableMappings[`header_${placeholder}`]
                      const val = resolveMappingValue(mapping, contact, 'Client')
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
                    const val = resolveMappingValue(mapping, contact, pIdx === 0 ? 'Cher client' : 'Client')
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
                      let val = resolveMappingValue(mapping, contact, contact.phone || 'order')
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
            const components = buildComponentsForContact(contact)

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
              
              // Only retry if it is genuinely a translation not found error (Meta 132001)
              // Do NOT retry for parameter errors (132000, 132012 or 131008)!
              const isTranslationMissing =
                errMsg.includes('132001') ||
                (errMsg.toLowerCase().includes('translation') &&
                  !errMsg.includes('132000') &&
                  !errMsg.includes('132012') &&
                  !errMsg.includes('131008') &&
                  !errMsg.includes('parameter'))

              if (isTranslationMissing) {
                const altLang = resolvedLang.includes('_') ? resolvedLang.split('_')[0] : `${resolvedLang}_FR`
                console.log(`[Broadcast Dispatch] Retrying ${templateName} with alternate language ${altLang} for ${cleanedPhone}`)
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
