require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const agentId = 'a852828f-9609-45ef-b5cd-fa39e076deaf';
  const { data, error } = await supabase.from('agent_tool_permissions').select('*').eq('agent_id', agentId);
  if (error) console.error(error);
  else console.log(data);
}
main();
