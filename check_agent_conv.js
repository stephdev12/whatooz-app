require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConv() {
  const conversationId = 'a420cefb-a233-4f34-8bc4-f762194c7897';
  
  const { data, error } = await supabase
      .from('ai_agent_messages')
      .select('role, content, tool_calls, tool_results, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

  if (error) {
    console.error(error);
  } else {
    data.reverse().forEach(msg => {
      console.log(`[${msg.role}]`);
      if (msg.content) console.log(msg.content);
      if (msg.tool_calls) console.log('Tool calls:', JSON.stringify(msg.tool_calls));
      if (msg.tool_results) console.log('Tool results:', JSON.stringify(msg.tool_results));
      console.log('---');
    });
  }
}

checkConv();
