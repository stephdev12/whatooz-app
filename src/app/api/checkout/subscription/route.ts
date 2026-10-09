import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanDefinition, normalizePlanCode } from '@/lib/plans'

export async function POST(req: Request) {
  try {
    const { planId, organization_id } = await req.json()
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // 2. Fetch the plan details from database or static config
    let plan: any = null
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId)

    if (isUuid) {
      const { data: dbPlan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle()
      plan = dbPlan
    } else {
      const { data: dbPlan } = await supabase
        .from('plans')
        .select('*')
        .or(`code.eq.${planId},name.ilike.${planId}`)
        .maybeSingle()
      plan = dbPlan
    }

    // Fallback to static config if database row not yet created
    if (!plan) {
      const staticDef = getPlanDefinition(planId)
      plan = {
        id: isUuid ? planId : null,
        name: staticDef.name,
        price_fcfa: typeof staticDef.priceFcfa === 'number' ? staticDef.priceFcfa : 0,
      }
    }

    // 3. For Free tier (0 FCFA), switch directly without payment gateway
    if (plan.price_fcfa === 0) {
      if (plan.id) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            current_period_end: null,
          })
          .eq('organization_id', organization_id)
      }

      return NextResponse.json({
        success: true,
        checkout_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=free_activated`,
      })
    }

    // 4. Call SasPay API to create a checkout session for paid tiers
    const saspayResponse = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SASPAY_API_KEY || ''}`,
      },
      body: JSON.stringify({
        amount: plan.price_fcfa.toString(),
        currency: 'XOF',
        description: `Abonnement Whatooz - Forfait ${plan.name}`,
        customer_email: user.email || 'client@whatooz.com',
        customer_name: user.user_metadata?.full_name || 'Client',
        metadata: {
          type: 'subscription',
          organization_id: organization_id,
          plan_id: plan.id || planId,
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?status=success`,
      }),
    })

    const saspayData = await saspayResponse.json()

    if (!saspayResponse.ok) {
      console.error('SasPay Subscription API Error:', saspayData)
      return NextResponse.json({ error: 'Erreur de la passerelle de paiement SasPay', details: saspayData }, { status: 500 })
    }

    // Return the checkout URL to redirect the user
    const checkoutUrl = saspayData.data?.checkout_url || saspayData.checkout_url
    return NextResponse.json({ checkout_url: checkoutUrl })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
