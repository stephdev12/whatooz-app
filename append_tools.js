const fs = require('fs');

const codeToAppend = `

import { sendProductMessage, sendCatalogMessage } from '@/lib/whatsapp/meta-api';
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
        bodyText: args.body_text
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
        bodyText: args.body_text
      });
      return { success: true, message: "Catalogue envoyé avec succès" };
    } catch (e: any) {
      return { error: "Échec de l'envoi du catalogue", details: e.message };
    }
  }
};
`;

fs.appendFileSync('src/lib/agents/tools/productTools.ts', codeToAppend);
