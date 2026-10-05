require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('ai_agents')
    .update({ is_global: true })
    .eq('is_global', false);

  if (error) {
    console.error('Error updating agents:', error);
  } else {
    console.log('Successfully updated agents to be global by default.');
  }
}

main();
