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
        // Idempotency check: see if payment is already processed
        const { data: existingTx } = await supabaseAdmin
          .from('payment_transactions')
          .select('status')
          .eq('order_id', orderId)
          .eq('provider', 'saspay')
          .maybeSingle()
          
        if (existingTx && existingTx.status === 'paid') {
          console.log(`[SasPay Webhook] Order ${orderId} already paid. Skipping.`)
          return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 })
        }

        let paymentStatus = 'pending'
        if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'paid') {
          paymentStatus = 'paid'

          // Get the wallet to update balance and ledger
          const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id, available_balance')
            .eq('organization_id', order.organization_id)
            .single()

          if (wallet) {
            // Apply Whatooz Fee (e.g. 2.5%)
            const feePercent = 0.025
            const feeAmount = Math.round(order.total_amount * feePercent)
            const netAmount = order.total_amount - feeAmount

            // Insert SALE transaction into ledger
            await supabaseAdmin.from('wallet_transactions').insert({
              wallet_id: wallet.id,
              type: 'SALE',
              amount: netAmount,
              currency: 'XOF',
              reference: order.id,
              status: 'COMPLETED',
              metadata: { 
                 gross_amount: order.total_amount,
                 fee_amount: feeAmount,
                 saspay_transaction_id: transactionId
              }
            })

            // Update available_balance atomically (in a real prod app, use RPC for strict atomicity)
            await supabaseAdmin.from('wallets').update({
              available_balance: wallet.available_balance + netAmount,
              updated_at: new Date().toISOString()
            }).eq('id', wallet.id)
          }
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
