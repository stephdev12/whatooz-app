require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMessages() {
  const conversationId = 'a420cefb-a233-4f34-8bc4-f762194c7897';
  
  const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

  if (error) {
    console.error(error);
  } else {
    data.reverse().forEach(msg => {
      console.log(JSON.stringify(msg, null, 2));
      console.log('---');
    });
  }
}

checkMessages();
