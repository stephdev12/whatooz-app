import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/encryption'
import { checkQuota } from '@/lib/quota'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { organization_id, to, type, text, template } = body

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

    const { data: config, error: configError } = await supabaseAdmin
      .from('whatsapp_config')
      .select('phone_number_id, access_token_encrypted')
      .eq('organization_id', organization_id)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: 'WhatsApp integration not configured' }, { status: 400 })
    }

    // 3. Decrypt token
    const accessToken = decryptToken(config.access_token_encrypted)

    // 4. Build Meta API payload
    const metaPayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: type || 'text'
    }

    if (metaPayload.type === 'text' && text) {
      metaPayload.text = { preview_url: false, body: text }
    } else if (metaPayload.type === 'template' && template) {
      metaPayload.template = template
    } else {
      return NextResponse.json({ error: 'Invalid message type or missing content' }, { status: 400 })
    }

    // 5. Call Meta API
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

    // 6. Ensure Conversation exists
    let conversationId = null
    const { data: existingConv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('contact_phone', to)
      .single()

    if (existingConv) {
      conversationId = existingConv.id
      // Update last message
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message_text: metaPayload.type === 'text' ? text : `[${metaPayload.type.toUpperCase()}]`,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)
    } else {
      // Need contact ID if possible
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id, name')
        .eq('organization_id', organization_id)
        .eq('phone', to)
        .single()

      const { data: newConv } = await supabaseAdmin
        .from('conversations')
        .insert({
          organization_id: organization_id,
          contact_id: contact?.id || null,
          contact_phone: to,
          contact_name: contact?.name || null,
          last_message_text: metaPayload.type === 'text' ? text : `[${metaPayload.type.toUpperCase()}]`,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (newConv) conversationId = newConv.id
    }

    // 7. Save message to database
    if (conversationId && wamid) {
      await supabaseAdmin
        .from('messages')
        .insert({
          organization_id: organization_id,
          conversation_id: conversationId,
          direction: 'outbound',
          message_type: metaPayload.type,
          content_text: metaPayload.type === 'text' ? text : null,
          wamid: wamid,
          status: 'sent',
          sender_user_id: user.id
        })
    }

    return NextResponse.json({ success: true, wamid })
  } catch (error: any) {
    console.error('Send API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
