require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const conversationId = 'a420cefb-a233-4f34-8bc4-f762194c7897';
  
  // Get ALL tool calls, most recent first
  const { data, error } = await supabase
      .from('agent_tool_calls')
      .select('tool_name, arguments, result, status, created_at, duration_ms')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

  if (error) {
    console.error(error);
    return;
  }
  
  data.reverse().forEach(call => {
    console.log(`\n=== [${call.created_at}] Tool: ${call.tool_name} ===`);
    console.log('Status:', call.status, '| Duration:', call.duration_ms, 'ms');
    console.log('Args:', JSON.stringify(call.arguments));
    console.log('Result:', JSON.stringify(call.result));
  });

  // Also check ai_usage to see if generateText completed
  console.log('\n\n=== AI USAGE LOGS ===');
  const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);
  
  if (usage) {
    usage.reverse().forEach(u => {
      console.log(`[${u.created_at}] model=${u.model} steps=${u.tool_calls} in=${u.input_tokens} out=${u.output_tokens}`);
    });
  }
}

main();
