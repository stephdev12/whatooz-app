import { AgentTool } from '../AgentToolRegistry';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const searchProductsTool: AgentTool = {
  name: 'search_products',
  description: 'Search the catalog for products based on a query. Returns a list of products with their ID, name, price, and availability.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query (e.g., "chaussures noires")' },
      max_results: { type: 'number', description: 'Maximum number of results to return (default: 5)' }
    },
    required: []
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    const limit = args.max_results || 5;
    
    const { data, error } = await supabase
      .from('meta_catalog_products')
      .select('id, retailer_id, name, description, price, currency, availability')
      .eq('organization_id', context.organizationId)
      .ilike('name', `%${args.query || ''}%`)
      .limit(limit);

    if (error) {
      console.error("[searchProductsTool] Error:", error);
      return { error: 'Failed to search products' };
    }
    
    return { products: data };
  }
};

export const getProductTool: AgentTool = {
  name: 'get_product',
  description: 'Get detailed information about a specific product using its retailer_id.',
  parameters: {
    type: 'object',
    properties: {
      retailer_id: { type: 'string', description: 'The retailer ID of the product' }
    },
    required: ['retailer_id']
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('meta_catalog_products')
      .select('id, retailer_id, name, description, price, currency, availability, image_url')
      .eq('organization_id', context.organizationId)
      .eq('retailer_id', args.retailer_id)
      .single();

    if (error) {
      return { error: `Product with retailer_id ${args.retailer_id} not found.` };
    }
    
    return { product: data };
  }
};

export const calculateNegotiatedPriceTool: AgentTool = {
  name: 'calculate_negotiated_price',
  description: 'Determine if a requested discount/price is allowed based on the agent configuration.',
  parameters: {
    type: 'object',
    properties: {
      retailer_id: { type: 'string', description: 'The retailer ID of the product' },
      requested_price: { type: 'number', description: 'The price the customer is asking for' }
    },
    required: ['retailer_id', 'requested_price']
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    
    const { data: agent } = await supabase.from('ai_agents').select('agent_config').eq('id', context.agentId).single();
    if (!agent) return { error: 'Agent not found' };
    
    const config = agent.agent_config;
    if (!config.sales.canNegotiatePrices) {
      return { allowed: false, reason: 'Price negotiation is not allowed.' };
    }

    const { data: product } = await supabase
      .from('meta_catalog_products')
      .select('price')
      .eq('organization_id', context.organizationId)
      .eq('retailer_id', args.retailer_id)
      .single();

    if (!product) return { error: 'Product not found' };
    
    const maxDiscountPct = config.sales.maxDiscount || 0;
    const minPrice = product.price * (1 - maxDiscountPct / 100);
    
    if (args.requested_price >= minPrice) {
      return {
        allowed: true,
        final_price: args.requested_price,
        reason: 'Within configured discount limit'
      };
    } else {
      return {
        allowed: false,
        final_price: minPrice,
        reason: 'Requested price is below the allowed limit. The minimum price is provided in final_price.'
      };
    }
  }
};
