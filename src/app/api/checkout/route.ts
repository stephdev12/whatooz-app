import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { organization_id, items, customer, return_url } = await req.json()

    if (!organization_id || !items || items.length === 0 || !customer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch product prices to validate total amount
    const productIds = items.map((item: any) => item.id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, currency')
      .in('id', productIds)

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ error: 'Products not found' }, { status: 400 })
    }

    let totalAmount = 0
    let currency = products[0].currency

    const validItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.id)
      if (!product) throw new Error(`Product ${item.id} not found`)
      totalAmount += product.price * item.quantity
      return {
        product_id: item.id,
        quantity: item.quantity,
        unit_price: product.price
      }
    })

    // 2. Find or Create Contact for the customer
    let contactId = null
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('phone', customer.phone)
      .single()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: organization_id,
          name: customer.name,
          phone: customer.phone,
          status: 'ACTIVE'
        })
        .select()
        .single()
      
      if (!contactError && newContact) {
        contactId = newContact.id
      }
    }

    // 3. Create the Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        organization_id,
        contact_id: contactId,
        total_amount: totalAmount,
        currency,
        status: 'PENDING_PAYMENT',
        payment_provider: 'saspay',
        metadata: { customer_email: customer.email }
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error('Failed to create order')
    }

    // 4. Create Order Items
    const orderItemsToInsert = validItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }))

    await supabase.from('order_items').insert(orderItemsToInsert)

    // 5. Call SasPay API
    // Ensure you have SASPAY_API_KEY in your .env.local
    const saspayResponse = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SASPAY_API_KEY || 'sk_test_mock_key'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: totalAmount.toString(),
        currency,
        description: `Commande sur Whatooz - ${organization_id}`,
        customer_email: customer.email || 'customer@example.com',
        customer_name: customer.name,
        customer_phone: customer.phone,
        return_url: return_url || `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
        metadata: { order_id: order.id }
      })
    })

    const saspayData = await saspayResponse.json()

    if (!saspayResponse.ok) {
      console.error('SasPay API Error:', saspayData)
      // Even if SasPay fails, we created the order, but we can't redirect to payment
      return NextResponse.json({ error: 'Payment gateway error', details: saspayData }, { status: 500 })
    }

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({ 
        payment_reference: saspayData.id,
        saspay_checkout_url: saspayData.checkout_url 
      })
      .eq('id', order.id)

    return NextResponse.json({ checkout_url: saspayData.checkout_url, order_id: order.id })
    
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
