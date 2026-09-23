import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { organization_id, items, customer } = await req.json()

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

    // 3. Create the Order marked as PENDING_PAYMENT (or a distinct WhatsApp status)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        organization_id,
        contact_id: contactId,
        total_amount: totalAmount,
        currency,
        status: 'PENDING_PAYMENT',
        payment_provider: 'whatsapp',
        metadata: { customer_email: customer.email, requested_via: 'whatsapp' }
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

    return NextResponse.json({ order_id: order.id, status: 'success' })
    
  } catch (error: any) {
    console.error('WhatsApp Checkout error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
