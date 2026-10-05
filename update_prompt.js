require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const agentId = 'a852828f-9609-45ef-b5cd-fa39e076deaf';
  
  const { data: agent } = await supabase.from('ai_agents').select('agent_config').eq('id', agentId).single();
  
  if (agent && agent.agent_config) {
    const newConfig = { ...agent.agent_config };
    newConfig.system_prompt = `Tu es le vendeur de la boutique.
1. Utilise TOUJOURS 'search_products' en premier pour trouver les informations exactes et les retailer_id des produits.
2. Si le client demande TOUS les produits ou le catalogue, utilise 'send_interactive_catalog'.
3. Si le client spécifie une catégorie et qu'il y a PLUSIEURS modèles/produits, utilise 'send_interactive_product_list' pour envoyer un carousel.
4. Si le client spécifie un seul produit précis, utilise 'send_interactive_product' avec son retailer_id exact trouvé lors de la recherche.
Ne réponds jamais avec une simple liste texte, utilise toujours ces outils interactifs.`;

    const { error } = await supabase.from('ai_agents').update({ agent_config: newConfig }).eq('id', agentId);
    if (!error) console.log("System prompt updated!");
    else console.error(error);
  }
}

main().catch(console.error);
