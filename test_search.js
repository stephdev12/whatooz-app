require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProducts() {
  // Let's find out what organization the agent belongs to
  const agentId = 'a852828f-9609-45ef-b5cd-fa39e076deaf';
  const { data: agent } = await supabase.from('ai_agents').select('organization_id').eq('id', agentId).single();
  
  if (!agent) {
    console.log("Agent not found!");
    return;
  }
  
  console.log("Agent Organization ID:", agent.organization_id);

  // Now let's list all products for this organization
  const { data: products } = await supabase.from('meta_catalog_products')
    .select('retailer_id, name')
    .eq('organization_id', agent.organization_id);
    
  console.log("Products in DB for this organization:", products);
}

checkProducts();
