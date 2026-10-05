require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const defaultTools = [
  'search_products', 'get_product', 'calculate_negotiated_price',
  'create_order', 'create_payment', 'list_available_automations', 'run_automation',
  'send_interactive_product', 'send_interactive_catalog', 'send_interactive_product_list'
];

async function main() {
  const { data: agents, error } = await supabase.from('ai_agents').select('id');
  if (error) {
    console.error('Error fetching agents:', error);
    return;
  }

  for (const agent of agents) {
    const permissions = defaultTools.map(tool => ({
      agent_id: agent.id,
      tool_name: tool,
      can_execute: true
    }));

    await supabase.from('agent_tool_permissions').delete().eq('agent_id', agent.id);
    const { error: insertErr } = await supabase.from('agent_tool_permissions').insert(permissions);
    
    if (insertErr) {
      console.error(`Error inserting tools for agent ${agent.id}:`, insertErr);
    } else {
      console.log(`Granted tools to agent ${agent.id}`);
    }
  }
}

main();
