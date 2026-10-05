require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: agents } = await supabase.from('ai_agents').select('*');
  console.log("Agents:", agents);

  const { data: perms } = await supabase.from('agent_tool_permissions').select('*');
  console.log("Permissions count:", perms.length);
  if (perms.length > 0) {
    console.log("Sample perm:", perms[0]);
  }
}

main().catch(console.error);
