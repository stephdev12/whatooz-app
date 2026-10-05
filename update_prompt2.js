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
1. Si le client demande TOUS les produits ou le catalogue global, utilise 'send_interactive_catalog'.
2. Si le client demande un produit ou une catégorie précise (ex: "casque", "souris"), utilise TOUJOURS 'search_products' avec le paramètre 'query' pour chercher ce terme spécifique.
3. Après la recherche :
   - Si tu as trouvé PLUSIEURS produits (ex: plusieurs casques), utilise 'send_interactive_product_list' avec les retailer_ids trouvés pour lui envoyer le carousel.
   - Si tu as trouvé UN SEUL produit, utilise 'send_interactive_product' avec son retailer_id exact.
   - Si tu ne trouves rien, dis-le lui gentiment.
Ne réponds jamais avec une simple liste texte, utilise toujours ces outils interactifs. NE T'ARRETE PAS après la recherche, enchaîne directement avec l'envoi du produit/carousel.`;

    const { error } = await supabase.from('ai_agents').update({ agent_config: newConfig }).eq('id', agentId);
    if (!error) console.log("System prompt updated!");
    else console.error(error);
  }
}

main().catch(console.error);
