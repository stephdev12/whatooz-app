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
        let paymentStatus = 'PENDING'
        if (status === 'COMPLETED' || status === 'SUCCESS') {
          paymentStatus = 'PAID'

          // Add to wallet balance
          await supabaseAdmin.rpc('increment_wallet_balance', {
            org_id: order.organization_id,
            amount_to_add: order.total_amount
          })
        } else if (status === 'FAILED') {
          paymentStatus = 'FAILED'
        }

        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: paymentStatus,
            payment_reference: transactionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)

        // Trigger Automation
        // We simulate a webhook event for automations
        const triggerType = paymentStatus === 'PAID' ? 'payment_confirmed' : (paymentStatus === 'FAILED' ? 'payment_failed' : null)
        if (triggerType) {
          // E.g. find automations listening to payment_confirmed and execute them
          // Left as placeholder for automation engine
          console.log(`[SasPay Webhook] Automation trigger: ${triggerType} for order ${orderId}`)
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[SasPay Webhook] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
