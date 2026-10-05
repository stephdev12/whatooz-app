const fs = require('fs');
const path = require('path');

const codeToAppend = `
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
        sections: [
          {
            title: args.title || "Notre Sélection",
            productRetailerIds: args.retailer_ids.slice(0, 30) // Max 30
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
`;

const filePath = path.join(__dirname, 'src', 'lib', 'agents', 'tools', 'productTools.ts');
fs.appendFileSync(filePath, codeToAppend);
console.log("Appended sendProductListToUserTool");
