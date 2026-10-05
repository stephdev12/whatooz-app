require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { generateText, tool: aiTool } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const agentId = 'a852828f-9609-45ef-b5cd-fa39e076deaf'; // The agent from logs

  const { data: agent } = await supabase.from('ai_agents').select('*').eq('id', agentId).single();
  console.log("Agent:", agent.name, "| Model:", agent.model_provider, agent.model_name);
  console.log("System Prompt:", agent.system_prompt);

  const { data: perms } = await supabase.from('agent_tool_permissions').select('*').eq('agent_id', agentId);
  console.log("Granted tools:", perms.map(p => p.tool_name));
}

main().catch(console.error);
