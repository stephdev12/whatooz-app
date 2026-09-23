import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use Service Role for backend-only operations that bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const META_APP_SECRET = process.env.META_APP_SECRET || ''

export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  // We use META_APP_SECRET as the verify_token based on user preference
  if (mode === 'subscribe' && token === META_APP_SECRET) {
    console.log('WEBHOOK_VERIFIED')
    return new NextResponse(challenge, { status: 200 })
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    
    // 1. Verify Signature (Optional but recommended for production)
    const signature = req.headers.get('x-hub-signature-256')
    if (signature && META_APP_SECRET) {
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', META_APP_SECRET)
        .update(rawBody)
        .digest('hex')}`
      if (signature !== expectedSignature) {
        console.warn('Webhook signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)

    // Check if this is a WhatsApp API event
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 404 })
    }

    // Process all entries
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const value = change.value
          const phoneNumberId = value.metadata?.phone_number_id
          
          if (!phoneNumberId) continue

          // Find the organization for this phone_number_id
          const { data: config } = await supabase
            .from('whatsapp_config')
            .select('organization_id')
            .eq('phone_number_id', phoneNumberId)
            .single()

          if (!config) {
            console.log('No organization found for phone_number_id:', phoneNumberId)
            continue
          }

          const orgId = config.organization_id

          // Process messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const contactData = value.contacts?.find((c: any) => c.wa_id === message.from)
              const customerPhone = message.from
              const customerName = contactData?.profile?.name || 'Inconnu'
              const wamid = message.id
              const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString()
              
              let messageText = ''
              if (message.type === 'text') {
                messageText = message.text.body
              } else if (message.type === 'button') {
                messageText = message.button.text
              } else if (message.type === 'interactive') {
                if (message.interactive.type === 'button_reply') {
                  messageText = message.interactive.button_reply.title
                } else if (message.interactive.type === 'list_reply') {
                  messageText = message.interactive.list_reply.title
                }
              } else {
                messageText = `[${message.type.toUpperCase()}]`
              }

              // 1. Find or create contact
              let contactId = null
              const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('organization_id', orgId)
                .eq('phone', customerPhone)
                .single()

              if (existingContact) {
                contactId = existingContact.id
              } else {
                const { data: newContact } = await supabase
                  .from('contacts')
                  .insert({
                    organization_id: orgId,
                    phone: customerPhone,
                    name: customerName,
                    status: 'ACTIVE'
                  })
                  .select()
                  .single()
                
                if (newContact) contactId = newContact.id
              }

              // 2. Find or create conversation
              let conversationId = null
              const { data: existingConv } = await supabase
                .from('conversations')
                .select('id, unread_count')
                .eq('organization_id', orgId)
                .eq('contact_phone', customerPhone)
                .single()

              if (existingConv) {
                conversationId = existingConv.id
                // Update conversation
                await supabase
                  .from('conversations')
                  .update({
                    last_message_text: messageText,
                    last_message_at: timestamp,
                    unread_count: (existingConv.unread_count || 0) + 1,
                    status: 'open'
                  })
                  .eq('id', conversationId)
              } else {
                const { data: newConv } = await supabase
                  .from('conversations')
                  .insert({
                    organization_id: orgId,
                    contact_id: contactId,
                    contact_phone: customerPhone,
                    contact_name: customerName,
                    last_message_text: messageText,
                    last_message_at: timestamp,
                    unread_count: 1,
                    status: 'open'
                  })
                  .select()
                  .single()
                  
                if (newConv) conversationId = newConv.id
              }

              // 3. Insert message
              if (conversationId) {
                // Check if message already exists (idempotency)
                const { data: existingMsg } = await supabase
                  .from('messages')
                  .select('id')
                  .eq('wamid', wamid)
                  .single()

                if (!existingMsg) {
                  await supabase
                    .from('messages')
                    .insert({
                      organization_id: orgId,
                      conversation_id: conversationId,
                      direction: 'inbound',
                      message_type: message.type,
                      content_text: messageText,
                      wamid: wamid,
                      status: 'delivered',
                      created_at: timestamp
                    })
                }
              }
            }
          }

          // Process statuses (message read, delivered, failed)
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              const wamid = status.id
              const messageStatus = status.status // 'sent', 'delivered', 'read', 'failed'
              
              await supabase
                .from('messages')
                .update({ status: messageStatus })
                .eq('wamid', wamid)
            }
          }
        }
      }
    }

    // Always return 200 OK to Meta to acknowledge receipt, otherwise they retry
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error handling webhook:', error)
    // Even on error, it's safer to return 200 to prevent infinite retries from Meta,
    // but for debugging purposes, you might want to return 500
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
