import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyWebhookSignature } from '@/lib/whatsapp/webhook-signature'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  sendTextMessage,
  sendTemplateMessage,
  sendFlowMessage,
} from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/webhook — Meta webhook verification (challenge).
 */
export async function GET(request: NextRequest) {
  let searchParams = request.nextUrl.searchParams
  if (!searchParams.has('hub.mode') && request.url) {
    try {
      searchParams = new URL(request.url).searchParams
    } catch {
      // ignore
    }
  }

  const mode =
    searchParams.get('hub.mode') ||
    searchParams.get('mode') ||
    searchParams.get('hub_mode')
  const token =
    searchParams.get('hub.verify_token') ||
    searchParams.get('verify_token') ||
    searchParams.get('hub_verify_token') ||
    searchParams.get('token')
  const challenge =
    searchParams.get('hub.challenge') ||
    searchParams.get('challenge') ||
    searchParams.get('hub_challenge')

  // If accessed directly without Meta parameters (e.g. from browser or health-check)
  if (!mode && !token && !challenge) {
    console.log('[Webhook GET] Health check / direct access: Webhook is operational.')
    return NextResponse.json({
      status: 'active',
      service: 'Whatooz WhatsApp Webhook',
      message: 'Webhook endpoint is active and listening for Meta events.',
      timestamp: new Date().toISOString(),
    })
  }

  console.log('[Webhook GET] Meta verification request received:', { mode, token, challengeReceived: Boolean(challenge) })

  if (mode !== 'subscribe' || !challenge || !token) {
    console.warn('[Webhook GET] Invalid verification parameters:', { mode, token })
    return NextResponse.json(
      { error: 'Missing or invalid verification parameters. Expected hub.mode=subscribe' },
      { status: 400 }
    )
  }

  // Accepted verification tokens (configured in Meta Dashboard & .env)
  const validTokens = [
    process.env.META_WEBHOOK_VERIFY_TOKEN,
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    process.env.WEBHOOK_VERIFY_TOKEN,
    process.env.META_APP_SECRET,
    'whatooz_webhook_token',
  ].filter(Boolean)

  if (validTokens.includes(token)) {
    console.log('[Webhook GET] Meta webhook verified successfully! Challenge returned.')
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  console.warn('[Webhook GET] Verification failed. Token received did not match:', token)
  return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 })
}

/**
 * POST /api/whatsapp/webhook — Receive inbound messages & status updates.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Verify HMAC signature
  const signature = request.headers.get('x-hub-signature-256')
  if (!verifyWebhookSignature({ signature, body: rawBody })) {
    console.warn('[Webhook POST] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch (err) {
    console.error('[Webhook POST] Malformed JSON payload:', err)
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 })
  }

  const entries = body.entry ?? []
  for (const entry of entries) {
    const changes = entry.changes ?? []
    for (const change of changes) {
      if (change.field !== 'messages') continue

      const value = change.value
      const phoneNumberId = value.metadata?.phone_number_id
      if (!phoneNumberId) continue

      // Find the user config associated with this WhatsApp Phone Number ID
      const { data: config } = await supabaseAdmin
        .from('whatsapp_config')
        .select('user_id')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle()

      if (!config?.user_id) {
        console.warn(`[Webhook POST] No user config found for phone_number_id: ${phoneNumberId}`)
        continue
      }

      const userId = config.user_id

      // 1. Process Inbound Messages
      const messages = value.messages ?? []
      for (const msg of messages) {
        const senderPhone = msg.from
        const messageId = msg.id
        const timestamp = msg.timestamp
          ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
          : new Date().toISOString()

        let contentText = ''
        const messageType = msg.type || 'text'
        let mediaUrl = null

        const senderProfileName =
          value.contacts?.find((c: { wa_id: string }) => c.wa_id === senderPhone)
            ?.profile?.name || senderPhone

        switch (msg.type) {
          case 'text':
            contentText = msg.text?.body ?? ''
            break
          case 'image':
          case 'video':
          case 'audio':
          case 'document':
          case 'sticker':
            contentText = msg[msg.type]?.caption || `[${msg.type}]`
            mediaUrl = msg[msg.type]?.id ?? null
            break
          case 'interactive':
            if (msg.interactive?.type === 'nfm_reply') {
              const nfm = msg.interactive.nfm_reply
              let responseData: Record<string, unknown> = {}
              try {
                responseData = JSON.parse(nfm.response_json || '{}')
              } catch {
                responseData = { raw: nfm.response_json }
              }
              // Save response in flow_responses table
              await supabaseAdmin.from('flow_responses').insert({
                user_id: userId,
                contact_phone: senderPhone,
                contact_name: senderProfileName,
                response_data: responseData,
              })
              const previewFields = Object.entries(responseData)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')
              contentText = `📋 [Formulaire Flow complété] : ${previewFields || nfm.body || 'Soumis'}`
            } else {
              contentText =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                '[Réponse interactive]'
            }
            break
          case 'button':
            contentText = msg.button?.text || '[Bouton]'
            break
          case 'location':
            contentText = `📍 ${msg.location?.latitude}, ${msg.location?.longitude}`
            break
          case 'contacts':
            contentText = '👤 Contact partagé'
            break
          case 'reaction':
            contentText = msg.reaction?.emoji ?? '👍'
            break
          default:
            contentText = `[${msg.type}]`
        }

        // Find or create Contact (using maybeSingle to avoid PGRST116 errors)
        let contactId: string | null = null
        const { data: existingContact } = await supabaseAdmin
          .from('contacts')
          .select('id')
          .eq('user_id', userId)
          .eq('phone', senderPhone)
          .maybeSingle()

        if (existingContact) {
          contactId = existingContact.id
        } else {
          const { data: newContact } = await supabaseAdmin
            .from('contacts')
            .insert({
              user_id: userId,
              phone: senderPhone,
              name: senderProfileName,
            })
            .select('id')
            .maybeSingle()

          contactId = newContact?.id ?? null
        }

        // Find or create Conversation
        let conversationId: string | null = null
        const { data: existingConvo } = await supabaseAdmin
          .from('conversations')
          .select('id, unread_count')
          .eq('user_id', userId)
          .eq('contact_phone', senderPhone)
          .maybeSingle()

        if (existingConvo) {
          conversationId = existingConvo.id
          // Update existing conversation
          await supabaseAdmin
            .from('conversations')
            .update({
              last_message_text: contentText,
              last_message_at: timestamp,
              unread_count: (existingConvo.unread_count || 0) + 1,
              status: 'open',
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId)
        } else {
          const { data: newConvo } = await supabaseAdmin
            .from('conversations')
            .insert({
              user_id: userId,
              contact_id: contactId,
              contact_phone: senderPhone,
              contact_name: senderProfileName,
              status: 'open',
              last_message_text: contentText,
              last_message_at: timestamp,
              unread_count: 1,
            })
            .select('id')
            .maybeSingle()

          conversationId = newConvo?.id ?? null
        }

        if (!conversationId) continue

        // Insert Inbound Message
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversationId,
          user_id: userId,
          direction: 'inbound',
          message_type: messageType,
          content_text: contentText,
          media_url: mediaUrl,
          wamid: messageId,
          status: 'delivered',
          created_at: timestamp,
        })

        // -------------------------------------------------------------
        // 2.bis Auto-Reply with Payment Link for E-Commerce / Orders Flows
        // -------------------------------------------------------------
        if (msg.interactive?.type === 'nfm_reply') {
          try {
            const rawNfm = msg.interactive.nfm_reply
            const nfmData = typeof rawNfm?.response_json === 'string'
              ? JSON.parse(rawNfm.response_json || '{}')
              : rawNfm?.response_json || {}

            const isOrderOrPayment = Boolean(
              nfmData.modele_selectionne ||
              nfmData.product_id ||
              nfmData.action === 'pay_order' ||
              nfmData.action === 'order_payment' ||
              nfmData.adresse_livraison ||
              nfmData.categorie_produit
            )

            if (isOrderOrPayment) {
              const { data: userConfig } = await supabaseAdmin
                .from('whatsapp_config')
                .select('access_token_encrypted, phone_number_id')
                .eq('user_id', userId)
                .maybeSingle()

              if (userConfig?.access_token_encrypted) {
                const accessToken = decrypt(userConfig.access_token_encrypted)
                const clientName = nfmData.nom_client || senderProfileName || 'cher client'

                let modelName = 'TechWave TW14 Pro (256 Go)'
                let priceText = '325 000 FCFA (500€)'
                let priceAmount = '325000'

                const rawModel = String(nfmData.modele_selectionne || nfmData.product_id || '').toLowerCase()
                if (rawModel.includes('apex')) {
                  modelName = 'Apex Aura Ultra (128 Go)'
                  priceText = '260 000 FCFA (400€)'
                  priceAmount = '260000'
                } else if (rawModel.includes('virtu')) {
                  modelName = 'VirtuVision VX2'
                  priceText = '225 000 FCFA (350€)'
                  priceAmount = '225000'
                } else if (rawModel.includes('nova')) {
                  modelName = 'Nova N1 Edition'
                  priceText = '195 000 FCFA (300€)'
                  priceAmount = '195000'
                } else if (nfmData.product_name) {
                  modelName = String(nfmData.product_name)
                  priceText = String(nfmData.price || priceText)
                }

                const deliveryAddress = nfmData.adresse_livraison || nfmData.adresse || 'Non spécifiée'
                const orderRef = `CMD-${Math.floor(100000 + Math.random() * 900000)}`
                const paymentUrl = `https://checkout.whatooz.com/pay?ref=${orderRef}&amount=${priceAmount}`

                const paymentMsg =
                  `🎉 *Merci pour votre commande, ${clientName} !*\n\n` +
                  `📦 *Produit choisi :* ${modelName}\n` +
                  `💰 *Montant total :* ${priceText}\n` +
                  `📍 *Livraison prévue à :* ${deliveryAddress}\n\n` +
                  `💳 *Voici votre lien sécurisé pour régler votre achat :*\n` +
                  `👉 ${paymentUrl}\n\n` +
                  `✅ *Moyens acceptés :* Wave, Orange Money, MTN MoMo, Carte Bancaire.\n\n` +
                  `Dès confirmation de votre règlement, votre colis sera immédiatement expédié en 24h chrono. Merci de votre confiance ! 🚀`

                const sendRes = await sendTextMessage({
                  phoneNumberId,
                  accessToken,
                  to: senderPhone,
                  text: paymentMsg,
                })

                await supabaseAdmin.from('messages').insert({
                  conversation_id: conversationId,
                  user_id: userId,
                  direction: 'outbound',
                  message_type: 'text',
                  content_text: paymentMsg,
                  wamid: sendRes.messageId,
                  status: 'sent',
                })

                await supabaseAdmin
                  .from('conversations')
                  .update({
                    last_message_text: paymentMsg,
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', conversationId)
              }
            }
          } catch (paymentLinkErr) {
            console.error('[Webhook Flow Auto-Payment] Error:', paymentLinkErr)
          }
        }

        // -------------------------------------------------------------
        // 3. Process Automations (Chatbot / Scenarios)
        // -------------------------------------------------------------
        try {
          const isFirstMessage = !existingConvo
          const { data: automations } = await supabaseAdmin
            .from('automations')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

          if (automations && automations.length > 0) {
            const { data: userConfig } = await supabaseAdmin
              .from('whatsapp_config')
              .select('access_token_encrypted, phone_number_id')
              .eq('user_id', userId)
              .maybeSingle()

            if (userConfig?.access_token_encrypted) {
              const accessToken = decrypt(userConfig.access_token_encrypted)
              const normalizedInput = contentText.trim().toUpperCase()

              for (const auto of automations) {
                let shouldTrigger = false
                if (auto.trigger_type === 'keyword' && auto.trigger_value) {
                  const keyword = auto.trigger_value.trim().toUpperCase()
                  if (normalizedInput === keyword || normalizedInput.includes(keyword)) {
                    shouldTrigger = true
                  }
                } else if (auto.trigger_type === 'first_message' && isFirstMessage) {
                  shouldTrigger = true
                }

                if (shouldTrigger) {
                  const payload = (auto.action_payload as Record<string, any>) || {}
                  let outboundText = ''

                  if (auto.action_type === 'send_template') {
                    const templateName = payload.template_name
                    const languageCode = payload.language_code || 'fr'
                    const headerImageUrl = payload.header_image_url
                    const bodyVariables = payload.body_variables

                    const templateComponents: Array<Record<string, unknown>> = []
                    if (headerImageUrl) {
                      templateComponents.push({
                        type: 'header',
                        parameters: [
                          {
                            type: 'image',
                            image: { link: headerImageUrl },
                          },
                        ],
                      })
                    }
                    if (bodyVariables && Array.isArray(bodyVariables) && bodyVariables.length > 0) {
                      templateComponents.push({
                        type: 'body',
                        parameters: bodyVariables.map((v: string) => ({
                          type: 'text',
                          text: String(v),
                        })),
                      })
                    }

                    const sendRes = await sendTemplateMessage({
                      phoneNumberId,
                      accessToken,
                      to: senderPhone,
                      templateName,
                      languageCode,
                      components: templateComponents.length > 0 ? templateComponents : undefined,
                    })

                    outboundText = `[Template automatique: ${templateName}]`
                    await supabaseAdmin.from('messages').insert({
                      conversation_id: conversationId,
                      user_id: userId,
                      direction: 'outbound',
                      message_type: 'template',
                      content_text: outboundText,
                      wamid: sendRes.messageId,
                      status: 'sent',
                    })
                  } else if (auto.action_type === 'send_flow' && payload.flow_id) {
                    let flowScreen: string | undefined = payload.screen
                    if (!flowScreen) {
                      const { data: flowRow } = await supabaseAdmin
                        .from('whatsapp_flows')
                        .select('flow_json')
                        .or(`id.eq.${payload.flow_id},meta_flow_id.eq.${payload.flow_id}`)
                        .maybeSingle()
                      flowScreen = flowRow?.flow_json?.screens?.[0]?.id
                    }

                    const sendRes = await sendFlowMessage({
                      phoneNumberId,
                      accessToken,
                      to: senderPhone,
                      flowId: payload.flow_id,
                      flowCta: payload.flow_cta || 'Ouvrir le formulaire',
                      bodyText: payload.body_text || 'Veuillez remplir le formulaire ci-dessous :',
                      headerText: payload.header_text,
                      footerText: payload.footer_text,
                      screen: flowScreen,
                    })

                    outboundText = `[WhatsApp Flow: ${payload.flow_cta || 'Formulaire'}]`
                    await supabaseAdmin.from('messages').insert({
                      conversation_id: conversationId,
                      user_id: userId,
                      direction: 'outbound',
                      message_type: 'interactive',
                      content_text: outboundText,
                      wamid: sendRes.messageId,
                      status: 'sent',
                    })
                  } else if (auto.action_type === 'send_text' && payload.text) {
                    const sendRes = await sendTextMessage({
                      phoneNumberId,
                      accessToken,
                      to: senderPhone,
                      text: payload.text,
                    })

                    outboundText = payload.text
                    await supabaseAdmin.from('messages').insert({
                      conversation_id: conversationId,
                      user_id: userId,
                      direction: 'outbound',
                      message_type: 'text',
                      content_text: outboundText,
                      wamid: sendRes.messageId,
                      status: 'sent',
                    })
                  }

                  if (outboundText) {
                    // Update conversation with latest outbound message
                    await supabaseAdmin
                      .from('conversations')
                      .update({
                        last_message_text: outboundText,
                        last_message_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', conversationId)

                    // Increment automation execution count
                    await supabaseAdmin
                      .from('automations')
                      .update({
                        executions_count: (auto.executions_count || 0) + 1,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', auto.id)

                    // Stop after matching first priority rule
                    break
                  }
                }
              }
            }
          }
        } catch (autoErr) {
          console.error('[Webhook Automations] Error processing automation rule:', autoErr)
        }
      }

      // 2. Process Status Updates (sent → delivered → read)
      const statuses = value.statuses ?? []
      for (const status of statuses) {
        if (status.id && status.status) {
          await supabaseAdmin
            .from('messages')
            .update({ status: status.status })
            .eq('wamid', status.id)
        }
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
