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


import { sendProductMessage, sendCatalogMessage, sendProductListMessage } from '@/lib/whatsapp/meta-api';
import { decrypt } from '@/lib/whatsapp/encryption';

export const sendProductToUserTool: AgentTool = {
  name: 'send_interactive_product',
  description: 'Envoyer une carte de produit interactive directement dans WhatsApp avec un bouton. Utilisez ceci quand le client demande un produit précis ou quand vous proposez un produit pertinent.',
  parameters: {
    type: 'object',
    properties: {
      retailer_id: { type: 'string', description: 'Le retailer_id du produit' },
      body_text: { type: 'string', description: 'Le texte du message qui accompagnera le produit' }
    },
    required: ['retailer_id', 'body_text']
  },
  execute: async (args, context) => {
    if (!args.retailer_id) {
      return { error: "Vous devez spécifier un retailer_id. Utilisez D'ABORD search_products pour trouver le produit exact." };
    }
    const supabase = supabaseAdmin;
    if (!context.customerPhone) return { error: "Numéro du client introuvable" };

    const { data: userConfig } = await supabase
      .from('whatsapp_config')
      .select('access_token_encrypted, phone_number_id')
      .eq('organization_id', context.organizationId)
      .single();

    if (!userConfig || !userConfig.access_token_encrypted) return { error: "Configuration WhatsApp non trouvée" };

    const { data: product } = await supabase
      .from('meta_catalog_products')
      .select('catalog_id')
      .eq('organization_id', context.organizationId)
      .eq('retailer_id', args.retailer_id)
      .single();

    if (!product || !product.catalog_id) return { error: "Produit non trouvé dans le catalogue" };

    const accessToken = decrypt(userConfig.access_token_encrypted);

    try {
      await sendProductMessage({
        phoneNumberId: userConfig.phone_number_id,
        accessToken,
        to: context.customerPhone,
        catalogId: product.catalog_id,
        productRetailerId: args.retailer_id,
        bodyText: args.body_text || "Voici le produit demandé :"
      });
      return { success: true, message: "Produit envoyé avec succès" };
    } catch (e: any) {
      return { error: "Échec de l'envoi du produit", details: e.message };
    }
  }
};

export const sendCatalogToUserTool: AgentTool = {
  name: 'send_interactive_catalog',
  description: 'Envoyer le catalogue complet de la boutique directement dans WhatsApp (message avec bouton "Voir le catalogue"). Utilisez ceci quand le client demande à voir tous les produits ou le catalogue.',
  parameters: {
    type: 'object',
    properties: {
      body_text: { type: 'string', description: 'Le texte du message' }
    },
    required: ['body_text']
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    if (!context.customerPhone) return { error: "Numéro du client introuvable" };

    const { data: userConfig } = await supabase
      .from('whatsapp_config')
      .select('access_token_encrypted, phone_number_id')
      .eq('organization_id', context.organizationId)
      .single();

    if (!userConfig || !userConfig.access_token_encrypted) return { error: "Configuration WhatsApp non trouvée" };

    const accessToken = decrypt(userConfig.access_token_encrypted);

    try {
      await sendCatalogMessage({
        phoneNumberId: userConfig.phone_number_id,
        accessToken,
        to: context.customerPhone,
        bodyText: args.body_text || "Voici notre catalogue complet :"
      });
      return { success: true, message: "Catalogue envoyé avec succès" };
    } catch (e: any) {
      return { error: "Échec de l'envoi du catalogue", details: e.message };
    }
  }
};

export const sendProductListToUserTool: AgentTool = {
  name: 'send_interactive_product_list',
  description: 'Envoyer une liste (carousel) de produits interactifs dans WhatsApp. Utilisez ceci quand le client demande une catégorie de produits ou quand vous voulez lui proposer plusieurs choix de produits.',
  parameters: {
    type: 'object',
    properties: {
      retailer_ids: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'Les retailer_id des produits à inclure (maximum 30)' 
      },
      title: { type: 'string', description: 'Le titre de la sélection (ex: Nos Casques)' },
      body_text: { type: 'string', description: 'Le texte du message qui accompagnera la liste' }
    },
    required: ['retailer_ids', 'title', 'body_text']
  },
  execute: async (args, context) => {
    if (!args.retailer_ids || args.retailer_ids.length === 0) {
      return { error: "Vous devez spécifier au moins un retailer_id. Utilisez D'ABORD search_products pour trouver les produits." };
    }
    const supabase = supabaseAdmin;
    if (!context.customerPhone) return { error: "Numéro du client introuvable" };

    const { data: userConfig } = await supabase
      .from('whatsapp_config')
      .select('access_token_encrypted, phone_number_id')
      .eq('organization_id', context.organizationId)
      .single();

    if (!userConfig || !userConfig.access_token_encrypted) return { error: "Configuration WhatsApp non trouvée" };

    // Find the catalog ID from the first product
    const { data: product } = await supabase
      .from('meta_catalog_products')
      .select('catalog_id')
      .eq('organization_id', context.organizationId)
      .eq('retailer_id', args.retailer_ids[0])
      .single();

    if (!product || !product.catalog_id) return { error: "Produits non trouvés dans le catalogue" };

    const accessToken = decrypt(userConfig.access_token_encrypted);

    try {
      await sendProductListMessage({
        phoneNumberId: userConfig.phone_number_id,
        accessToken,
        to: context.customerPhone,
        catalogId: product.catalog_id,
        headerText: "Sélection",
        sections: [
          {
            title: (args.title || "Notre Sélection").substring(0, 24),
            product_items: args.retailer_ids.slice(0, 30).map((id: string) => ({ product_retailer_id: id }))
          }
        ],
        bodyText: args.body_text || "Voici une sélection de produits qui pourraient vous intéresser :"
      });
      return { success: true, message: "Liste de produits envoyée avec succès" };
    } catch (e: any) {
      return { error: "Échec de l'envoi de la liste de produits", details: e.message };
    }
  }
};
