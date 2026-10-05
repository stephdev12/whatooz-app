require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSearch() {
  const query = 'casque'; // the word the AI might be searching
  const limit = 5;
  const organizationId = '7014da9c-63a8-4edf-896c-b7aff58b0358';
  
  const { data, error } = await supabase
      .from('meta_catalog_products')
      .select('id, retailer_id, name, description, price, currency, availability')
      .eq('organization_id', organizationId)
      .ilike('name', `%${query}%`)
      .limit(limit);

  console.log("Search result for", query, ":", data);
}

checkSearch();
