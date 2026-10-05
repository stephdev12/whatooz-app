import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    // Validate SasPay signature if applicable here
    // const signature = request.headers.get('x-saspay-signature')

    const body = JSON.parse(rawBody)

    // Expected SasPay payload
    // { "order_id": "uuid", "transaction_id": "xyz", "status": "COMPLETED", "amount": 1000 }
    
    const event = body.event || ''
    const data = body.data || body

    const orderId = data.order_id || data.checkout_session_id
    const status = data.status
    const transactionId = data.transaction_id || data.id

    if (orderId && status) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, organization_id, total_amount')
        .eq('id', orderId)
        .maybeSingle()

      if (order) {
        let paymentStatus = 'pending'
        if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'paid') {
          paymentStatus = 'paid'

          // Add to wallet balance
          await supabaseAdmin.rpc('increment_wallet_balance', {
            org_id: order.organization_id,
            amount_to_add: order.total_amount
          })
        } else if (status === 'FAILED' || status === 'failed') {
          paymentStatus = 'failed'
        }

        // Update payment_transactions
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: paymentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .eq('provider', 'saspay')

        // Update orders
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: paymentStatus.toUpperCase(),
            payment_reference: transactionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)

        // Trigger Automation via Commerce Events
        const eventType = paymentStatus === 'paid' ? 'PAYMENT_SUCCESS' : (paymentStatus === 'failed' ? 'PAYMENT_FAILED' : null)
        if (eventType) {
          await supabaseAdmin.from('commerce_events').insert({
            organization_id: order.organization_id,
            event_type: eventType,
            order_id: orderId,
            payload: body
          })
          console.log(`[SasPay Webhook] Automation trigger: ${eventType} for order ${orderId}`)
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[SasPay Webhook] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
