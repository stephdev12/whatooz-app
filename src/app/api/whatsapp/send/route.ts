import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  sendFlowMessage,
  sendProductMessage,
  getWabaFlowDetails,
  type MediaKind,
} from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/send — Send a message via WhatsApp Cloud API.
 *
 * Body:
 * - conversationId?: string
 * - to: string (phone number E.164)
 * - type: 'text' | 'template' | 'flow' | 'image' | 'video' | 'document' | 'audio'
 * - text?: string (for type=text)
 * - templateName?: string (for type=template)
 * - languageCode?: string (for type=template)
 * - headerImageUrl?: string (for template with image header)
 * - bodyVariables?: string[] (for template variables)
 * - components?: Array<Record<string, unknown>>
 * - flowId?: string (for type=flow)
 * - flowCta?: string (for type=flow)
 * - bodyText?: string (for type=flow)
 * - headerText?: string (for type=flow)
 * - footerText?: string (for type=flow)
 * - mediaUrl?: string (for media types)
 * - mediaId?: string (for media types)
 * - caption?: string
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
  console.log('--- WHATSAPP SEND INCOMING BODY ---', JSON.stringify(body, null, 2))
  const {
    conversationId,
    to,
    type,
    text,
    templateName,
    languageCode,
    headerImageUrl,
    bodyVariables,
    components,
    flowId,
    flowCta,
    bodyText,
    headerText,
    footerText,
    screen,
    mediaUrl,
    mediaId,
    caption,
    catalogId,
    productRetailerId,
    phoneNumberId: requestedPhoneNumberId,
    replyToMessageId,
    reply_to_message_id,
  } = body

  if (!to || !type) {
    return NextResponse.json(
      { error: 'to and type are required' },
      { status: 400 }
    )
  }

  // Check if conversation already has an assigned phone_number_id
  let targetPhoneNumberId = requestedPhoneNumberId
  let existingConvoData: any = null
  if (conversationId) {
    const { data: c } = await supabaseAdmin
      .from('conversations')
      .select('id, phone_number_id')
      .eq('id', conversationId)
      .maybeSingle()
    if (c) {
      existingConvoData = c
      if (!targetPhoneNumberId && c.phone_number_id) {
        targetPhoneNumberId = c.phone_number_id
      }
    }
  }

  // Load WhatsApp config for targeted or default number
  let configQuery = supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)

  if (targetPhoneNumberId) {
    configQuery = configQuery.eq('phone_number_id', targetPhoneNumberId)
  } else {
    configQuery = configQuery.order('is_default', { ascending: false })
  }

  const { data: configs } = await configQuery.limit(1)
  const config = configs?.[0]

  if (!config?.access_token_encrypted || !config.phone_number_id) {
    return NextResponse.json(
      { error: 'WhatsApp not configured. Go to Settings.' },
      { status: 400 }
    )
  }

  const accessToken = decrypt(config.access_token_encrypted)
  const phoneNumberId = config.phone_number_id

  // Contextual Quote Reply resolution
  const targetReplyId = replyToMessageId || reply_to_message_id
  let contextMessageId: string | undefined = undefined
  let quotedMessageData: any = null

  if (targetReplyId) {
    const { data: replyMsg } = await supabaseAdmin
      .from('messages')
      .select('id, wamid, content_text, message_type')
      .eq('id', targetReplyId)
      .maybeSingle()

    if (replyMsg?.wamid) {
      contextMessageId = replyMsg.wamid
      quotedMessageData = {
        id: replyMsg.id,
        text: replyMsg.content_text,
        type: replyMsg.message_type,
      }
    }
  }

  let result
  try {
    switch (type) {
      case 'text':
        if (!text) {
          return NextResponse.json(
            { error: 'text is required for text messages' },
            { status: 400 }
          )
        }
        result = await sendTextMessage({
          phoneNumberId,
          accessToken,
          to,
          text,
          contextMessageId,
        })
        break

      case 'template': {
        if (!templateName || !languageCode) {
          return NextResponse.json(
            { error: 'templateName and languageCode are required' },
            { status: 400 }
          )
        }

        // Build Meta template components (header image, body parameters)
        console.log('--- TEST SEND COMPONENTS ---', JSON.stringify(components, null, 2));
        let resolvedComponents: Array<Record<string, unknown>> = components || []
        if (resolvedComponents.length === 0) {
          const comps: Array<Record<string, unknown>> = []
          if (headerImageUrl) {
            comps.push({
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
            comps.push({
              type: 'body',
              parameters: bodyVariables.map((val: string) => ({
                type: 'text',
                text: String(val),
              })),
            })
          }
          if (comps.length > 0) {
            resolvedComponents = comps
          }
        }

        result = await sendTemplateMessage({
          phoneNumberId,
          accessToken,
          to,
          templateName,
          languageCode,
          components: resolvedComponents.length > 0 ? resolvedComponents : undefined,
        })
        break
      }

      case 'flow': {
        if (!flowId) {
          return NextResponse.json(
            { error: 'flowId is required for flow messages' },
            { status: 400 }
          )
        }

        const { data: flowRow } = await supabaseAdmin
          .from('whatsapp_flows')
          .select('*')
          .or(`id.eq.${flowId},meta_flow_id.eq.${flowId}`)
          .maybeSingle()

        // Dynamically resolve the first screen from local flow_json or live Meta API
        let targetScreen = screen
        if (!targetScreen || targetScreen === 'INIT') {
          if (flowRow?.flow_json?.screens?.[0]?.id) {
            targetScreen = flowRow.flow_json.screens[0].id
          } else if (flowRow?.meta_flow_id) {
            try {
              const details = await getWabaFlowDetails({
                flowId: flowRow.meta_flow_id,
                accessToken,
              })
              let parsedJson: any = details.flow_json
              if (typeof parsedJson === 'string') {
                parsedJson = JSON.parse(parsedJson)
              }
              if (parsedJson?.screens?.[0]?.id) {
                targetScreen = parsedJson.screens[0].id
                await supabaseAdmin
                  .from('whatsapp_flows')
                  .update({ flow_json: parsedJson })
                  .eq('id', flowRow.id)
              }
            } catch (fetchErr) {
              console.warn('[Send Flow] Could not fetch live flow_json from Meta:', fetchErr)
            }
          }
        }

        if (!targetScreen) {
          targetScreen = 'INIT'
        }

        const defaultCta =
          flowRow?.flow_json?._ui_meta?.flow_cta ||
          (flowRow as any)?.flow_cta ||
          'Ouvrir le formulaire'
        const defaultBody =
          flowRow?.flow_json?._ui_meta?.body_text ||
          (flowRow as any)?.body_text ||
          (flowRow?.name
            ? `Voici le formulaire "${flowRow.name}". Cliquez ci-dessous pour le remplir :`
            : 'Veuillez compléter ce formulaire pour continuer.')
        const defaultHeader =
          flowRow?.flow_json?._ui_meta?.header_text || (flowRow as any)?.header_text
        const defaultHeaderImage =
          flowRow?.flow_json?._ui_meta?.header_image_url || (flowRow as any)?.header_image_url
        const defaultFooter =
          flowRow?.flow_json?._ui_meta?.footer_text || (flowRow as any)?.footer_text

        const resolvedFlowCta = flowCta || defaultCta
        const resolvedBodyText = bodyText || text || defaultBody
        const resolvedHeaderText = headerText || defaultHeader
        const resolvedHeaderImageUrl = headerImageUrl || defaultHeaderImage
        const resolvedFooterText = footerText || defaultFooter

        const targetMetaFlowId =
          flowRow?.meta_flow_id && /^\d+$/.test(flowRow.meta_flow_id)
            ? flowRow.meta_flow_id
            : /^\d+$/.test(flowId)
              ? flowId
              : null

        if (!targetMetaFlowId) {
          return NextResponse.json(
            {
              error:
                "Ce flux WhatsApp n'a pas encore d'identifiant Meta valide ou n'est pas synchronisé. Veuillez d'abord l'enregistrer dans le Flow Builder.",
            },
            { status: 400 }
          )
        }

        try {
          result = await sendFlowMessage({
            phoneNumberId,
            accessToken,
            to,
            flowId: targetMetaFlowId,
            flowToken: `${targetMetaFlowId}_${Date.now()}`,
            flowCta: resolvedFlowCta,
            bodyText: resolvedBodyText,
            headerText: resolvedHeaderText,
            headerImageUrl: resolvedHeaderImageUrl,
            footerText: resolvedFooterText,
            screen: targetScreen,
            mode: flowRow?.status === 'DRAFT' ? 'draft' : undefined,
            contextMessageId,
          })
        } catch (sendErr: any) {
          // If Meta reports that the specified screen is not allowed, auto-retry with allowed screen!
          const match = sendErr.message?.match(/Allowed screen name is:\s*([A-Za-z0-9_]+)/)
          if (match && match[1] && match[1] !== targetScreen) {
            console.log(`[Send Flow] Retrying with Meta's allowed first screen: "${match[1]}"`)
            result = await sendFlowMessage({
              phoneNumberId,
              accessToken,
              to,
              flowId: targetMetaFlowId,
              flowToken: `${targetMetaFlowId}_${Date.now()}`,
              flowCta: resolvedFlowCta,
              bodyText: resolvedBodyText,
              headerText: resolvedHeaderText,
              headerImageUrl: resolvedHeaderImageUrl,
              footerText: resolvedFooterText,
              screen: match[1],
              mode: flowRow?.status === 'DRAFT' ? 'draft' : undefined,
              contextMessageId,
            })
          } else {
            throw sendErr
          }
        }
        break
      }

      case 'image':
      case 'video':
      case 'document':
      case 'audio':
        if (!mediaUrl && !mediaId) {
          return NextResponse.json(
            { error: 'mediaUrl or mediaId is required for media messages' },
            { status: 400 }
          )
        }
        result = await sendMediaMessage({
          phoneNumberId,
          accessToken,
          to,
          mediaKind: type as MediaKind,
          mediaUrl,
          mediaId,
          caption,
          contextMessageId,
        })
        break

      case 'product':
        if (!catalogId || !productRetailerId) {
          return NextResponse.json(
            { error: 'catalogId and productRetailerId are required for product messages' },
            { status: 400 }
          )
        }
        result = await sendProductMessage({
          phoneNumberId,
          accessToken,
          to,
          catalogId,
          productRetailerId,
          bodyText,
          footerText,
          contextMessageId,
        })
        break

      default:
        return NextResponse.json(
          { error: `Unsupported message type: ${type}` },
          { status: 400 }
        )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Persist the sent message
  const contentText =
    type === 'text'
      ? text
      : type === 'template'
        ? `[Template: ${templateName}]`
        : type === 'flow'
          ? `[WhatsApp Flow: ${flowCta || 'Formulaire'}]`
          : `[${type}]${caption ? ': ' + caption : ''}`

  // Find or create conversation if conversationId is missing
  let activeConvoId = conversationId
  if (!activeConvoId) {
    const { data: existingConvo } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('contact_phone', to)
      .maybeSingle()

    if (existingConvo) {
      activeConvoId = existingConvo.id
    } else {
      // Try to fetch name from contacts table first
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('name')
        .eq('organization_id', organizationId)
        .eq('phone', to)
        .maybeSingle()
        
      const contactName = contact?.name || to

      const { data: newConvo } = await supabaseAdmin
        .from('conversations')
        .insert({
          organization_id: organizationId,
          phone_number_id: phoneNumberId,
          contact_phone: to,
          contact_name: contactName,
          status: 'open',
          has_replied: true,
          last_message_text: contentText,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (newConvo) {
        activeConvoId = newConvo.id
      }
    }
  }

  const { data: message, error: insertError } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: activeConvoId,
      organization_id: organizationId,
      phone_number_id: phoneNumberId,
      direction: 'outbound',
      message_type: type,
      content_text: contentText,
      media_url: mediaUrl || mediaId || null,
      wamid: result.messageId,
      status: 'sent',
      reply_to_message_id: targetReplyId || null,
      context_wamid: contextMessageId || null,
      quoted_content: quotedMessageData,
      sender_user_id: user.id,
    })
    .select()
    .single()

  // Update conversation last_message and has_replied
  if (activeConvoId) {
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: contentText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_replied: true,
        phone_number_id: phoneNumberId,
      })
      .eq('id', activeConvoId)
  }

  return NextResponse.json({ success: true, messageId: result.messageId, message, conversationId: activeConvoId })
}
