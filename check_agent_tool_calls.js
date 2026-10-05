require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTools() {
  const conversationId = 'a420cefb-a233-4f34-8bc4-f762194c7897';
  
  const { data, error } = await supabase
      .from('agent_tool_calls')
      .select('tool_name, arguments, result, status, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);

  if (error) {
    console.error(error);
  } else {
    data.reverse().forEach(call => {
      console.log(`[${call.created_at}] Tool: ${call.tool_name} (Status: ${call.status})`);
      console.log('Args:', JSON.stringify(call.arguments));
      console.log('Result:', JSON.stringify(call.result).substring(0, 500));
      console.log('---');
    });
  }
}

checkTools();
