import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  sendFlowMessage,
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
    caption,
  } = body

  if (!to || !type) {
    return NextResponse.json(
      { error: 'to and type are required' },
      { status: 400 }
    )
  }

  // Load WhatsApp config
  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (!config?.access_token_encrypted || !config.phone_number_id) {
    return NextResponse.json(
      { error: 'WhatsApp not configured. Go to Settings.' },
      { status: 400 }
    )
  }

  const accessToken = decrypt(config.access_token_encrypted)
  const phoneNumberId = config.phone_number_id

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

        try {
          result = await sendFlowMessage({
            phoneNumberId,
            accessToken,
            to,
            flowId,
            flowToken: `${flowId}_${Date.now()}`,
            flowCta: resolvedFlowCta,
            bodyText: resolvedBodyText,
            headerText: resolvedHeaderText,
            headerImageUrl: resolvedHeaderImageUrl,
            footerText: resolvedFooterText,
            screen: targetScreen,
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
              flowId,
              flowToken: `${flowId}_${Date.now()}`,
              flowCta: resolvedFlowCta,
              bodyText: resolvedBodyText,
              headerText: resolvedHeaderText,
              headerImageUrl: resolvedHeaderImageUrl,
              footerText: resolvedFooterText,
              screen: match[1],
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
        if (!mediaUrl) {
          return NextResponse.json(
            { error: 'mediaUrl is required for media messages' },
            { status: 400 }
          )
        }
        result = await sendMediaMessage({
          phoneNumberId,
          accessToken,
          to,
          mediaKind: type as MediaKind,
          mediaUrl,
          caption,
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
          contact_phone: to,
          contact_name: contactName,
          status: 'open',
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
      direction: 'outbound',
      message_type: type,
      content_text: contentText,
      media_url: mediaUrl ?? null,
      wamid: result.messageId,
      status: 'sent',
    })
    .select()
    .single()

  // Update conversation last_message
  if (activeConvoId) {
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: contentText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeConvoId)
  }

  return NextResponse.json({ success: true, messageId: result.messageId, message, conversationId: activeConvoId })
}
