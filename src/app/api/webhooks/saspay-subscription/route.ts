import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the service role key to bypass RLS since this is a webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('Received SasPay Subscription Webhook:', payload)

    // Security: Validate the webhook signature using process.env.SASPAY_WEBHOOK_SECRET
    // Since we don't have the exact signature verification logic for SasPay right now, 
    // ensure you add it before going to production.

    // Typically, SasPay sends the status and metadata
    // Example: { event: 'payment.success', data: { metadata: { type: 'subscription', organization_id: '...', plan_id: '...' } } }
    
    // Adjust these field extractions based on the exact SasPay webhook payload
    const event = payload.event
    const metadata = payload.data?.metadata || payload.metadata

    if (event === 'payment.success' && metadata?.type === 'subscription') {
      const organizationId = metadata.organization_id
      const planId = metadata.plan_id

      if (!organizationId || !planId) {
        console.error('Missing organization or plan in metadata')
        return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
      }

      // Update the subscription in Supabase
      // Add 30 days for a standard monthly subscription
      const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_end: currentPeriodEnd
        })
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to update subscription in Supabase:', error)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log(`Successfully updated subscription for org ${organizationId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('SasPay Webhook Error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
