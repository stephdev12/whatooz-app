import { AgentTool } from '../AgentToolRegistry';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const createOrderTool: AgentTool = {
  name: 'create_order',
  description: 'Create a pending order for the customer based on a product they want to buy. Use this after the customer confirms their intent to purchase.',
  parameters: {
    type: 'object',
    properties: {
      retailer_id: { type: 'string', description: 'The retailer ID of the product' },
      quantity: { type: 'number', description: 'The quantity to order' },
      agreed_price: { type: 'number', description: 'The final negotiated price for a single unit' }
    },
    required: ['retailer_id', 'agreed_price']
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    const { data: product } = await supabase
      .from('meta_catalog_products')
      .select('id, name')
      .eq('organization_id', context.organizationId)
      .eq('retailer_id', args.retailer_id)
      .single();

    if (!product) return { error: 'Product not found' };

    const qty = args.quantity || 1;
    const total = args.agreed_price * qty;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        organization_id: context.organizationId,
        agent_id: context.agentId,
        conversation_id: context.conversationId,
        subtotal: total,
        total_amount: total,
        payment_status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error("[createOrderTool] Error:", error);
      return { error: 'Failed to create order' };
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      retailer_id: args.retailer_id,
      meta_product_id: product.id,
      name: product.name,
      quantity: qty,
      unit_price: args.agreed_price
    });

    await supabase.from('agent_conversation_state')
      .update({ current_order_id: order.id })
      .eq('agent_id', context.agentId)
      .eq('conversation_id', context.conversationId);

    return { 
      success: true, 
      order_id: order.id, 
      total_amount: total,
      message: 'Order created successfully. You can now generate a payment link using create_payment.' 
    };
  }
};

export const createPaymentTool: AgentTool = {
  name: 'create_payment',
  description: 'Generate a SasPay payment link for the current order. Use this to ask the customer to pay.',
  parameters: {
    type: 'object',
    properties: {
      order_id: { type: 'string', description: 'The ID of the order' }
    },
    required: ['order_id']
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    const { data: order } = await supabase
      .from('orders')
      .select('id, total_amount')
      .eq('id', args.order_id)
      .eq('organization_id', context.organizationId)
      .single();

    if (!order) return { error: 'Order not found or access denied' };

    // Placeholder link. In reality, call SasPayService.createPayment
    const mockLink = `https://checkout.saspay.me/mock_${order.id.substring(0,8)}`;
    
    const { data: tx, error } = await supabase
      .from('payment_transactions')
      .insert({
        organization_id: context.organizationId,
        order_id: order.id,
        amount: order.total_amount,
        status: 'pending',
        payment_link: mockLink
      })
      .select()
      .single();

    if (error) return { error: 'Failed to create payment transaction' };

    return {
      success: true,
      payment_url: tx.payment_link,
      message: 'Payment link generated successfully. Please share this URL with the customer.'
    };
  }
};
