import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { planId, organization_id } = await req.json()
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch the plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // 3. Call SasPay API to create a checkout session
    const saspayResponse = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SASPAY_API_KEY || ''}`
      },
      body: JSON.stringify({
        amount: plan.price_fcfa,
        currency: 'XOF',
        description: `Abonnement Whatooz - Plan ${plan.name}`,
        customer: {
          email: user.email,
        },
        // Meta data used by the webhook to identify what the payment was for
        metadata: {
          type: 'subscription',
          organization_id: organization_id,
          plan_id: planId
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=cancel`,
      })
    })

    const saspayData = await saspayResponse.json()

    if (!saspayResponse.ok) {
      console.error('SasPay Subscription API Error:', saspayData)
      return NextResponse.json({ error: 'Payment gateway error', details: saspayData }, { status: 500 })
    }

    // Return the checkout URL to redirect the user
    return NextResponse.json({ checkout_url: saspayData.checkout_url })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
