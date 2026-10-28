import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/whatsapp/encryption'
import { checkQuota } from '@/lib/quota'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const {
      organization_id,
      to,
      type,
      text,
      template,
      phone_number_id: requestedPhoneNumberId,
      reply_to_message_id,
      media_url,
      caption,
    } = body

    if (!organization_id || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Verify user belongs to organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Check Quotas
    const quota = await checkQuota(organization_id, 'messages')
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: 403 })
    }

    // 3. Get WhatsApp config using Service Role (since RLS restricts config access)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let configQuery = supabaseAdmin
      .from('whatsapp_config')
      .select('phone_number_id, access_token_encrypted, phone_label')
      .eq('organization_id', organization_id)

    if (requestedPhoneNumberId) {
      configQuery = configQuery.eq('phone_number_id', requestedPhoneNumberId)
    } else {
      configQuery = configQuery.order('is_default', { ascending: false })
    }

    const { data: configs, error: configError } = await configQuery.limit(1)
    const config = configs?.[0]

    if (configError || !config) {
      return NextResponse.json({ error: 'WhatsApp integration not configured' }, { status: 400 })
    }

    // 4. Decrypt token
    const accessToken = decrypt(config.access_token_encrypted)

    // Check for quote reply
    let contextMessageId: string | undefined = undefined
    let quotedMessageData: any = null
    if (reply_to_message_id) {
      const { data: replyMsg } = await supabaseAdmin
        .from('messages')
        .select('id, wamid, content_text, message_type')
        .eq('id', reply_to_message_id)
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

    // 5. Build Meta API payload
    const msgType = type || 'text'
    const metaPayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: msgType,
    }

    if (contextMessageId) {
      metaPayload.context = { message_id: contextMessageId }
    }

    if (msgType === 'text' && text) {
      metaPayload.text = { preview_url: false, body: text }
    } else if (msgType === 'template' && template) {
      metaPayload.template = template
    } else if (['image', 'video', 'audio', 'document'].includes(msgType) && media_url) {
      metaPayload[msgType] = {
        link: media_url,
        ...(caption ? { caption } : {}),
      }
    } else {
      return NextResponse.json({ error: 'Invalid message type or missing content' }, { status: 400 })
    }

    // 6. Call Meta API
    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${config.phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaPayload)
    })

    const metaData = await metaResponse.json()

    if (!metaResponse.ok) {
      console.error('Meta API Error:', metaData)
      return NextResponse.json({ error: 'Failed to send message via WhatsApp', details: metaData }, { status: metaResponse.status })
    }

    const wamid = metaData.messages?.[0]?.id

    // 7. Ensure Conversation exists
    let conversationId = null
    const { data: existingConv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('contact_phone', to)
      .limit(1)
      .maybeSingle()

    const displayMsg =
      msgType === 'text'
        ? text
        : `[${msgType.toUpperCase()}]${caption ? ': ' + caption : ''}`

    if (existingConv) {
      conversationId = existingConv.id
      // Update last message & has_replied
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message_text: displayMsg,
          last_message_at: new Date().toISOString(),
          has_replied: true,
          phone_number_id: config.phone_number_id,
        })
        .eq('id', conversationId)
    } else {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id, name')
        .eq('organization_id', organization_id)
        .eq('phone', to)
        .maybeSingle()

      const { data: newConv } = await supabaseAdmin
        .from('conversations')
        .insert({
          organization_id: organization_id,
          phone_number_id: config.phone_number_id,
          contact_id: contact?.id || null,
          contact_phone: to,
          contact_name: contact?.name || null,
          has_replied: true,
          last_message_text: displayMsg,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (newConv) conversationId = newConv.id
    }

    // 8. Save message to database
    if (conversationId && wamid) {
      await supabaseAdmin
        .from('messages')
        .insert({
          organization_id: organization_id,
          conversation_id: conversationId,
          phone_number_id: config.phone_number_id,
          direction: 'outbound',
          message_type: msgType,
          content_text: msgType === 'text' ? text : null,
          media_url: media_url || null,
          media_caption: caption || null,
          wamid: wamid,
          status: 'sent',
          sender_user_id: user.id,
          reply_to_message_id: reply_to_message_id || null,
          context_wamid: contextMessageId || null,
          quoted_content: quotedMessageData,
        })
    }

    return NextResponse.json({ success: true, wamid })
  } catch (error: any) {
    console.error('Send API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
