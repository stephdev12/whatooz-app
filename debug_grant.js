require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const defaultTools = [
  'search_products', 'get_product', 'calculate_negotiated_price',
  'create_order', 'create_payment', 'list_available_automations', 'run_automation',
  'send_interactive_product', 'send_interactive_catalog'
];

async function main() {
  const { data: agents } = await supabase.from('ai_agents').select('*');
  
  for (const agent of agents) {
    const permissions = defaultTools.map(tool => ({
      agent_id: agent.id,
      tool_name: tool,
      can_execute: true
    }));

    await supabase.from('agent_tool_permissions').delete().eq('agent_id', agent.id);
    const result = await supabase.from('agent_tool_permissions').insert(permissions).select();
    
    console.log("Result for agent", agent.id, ":", result);
  }
}

main().catch(console.error);
