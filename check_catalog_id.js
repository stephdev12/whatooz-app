require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('meta_catalog_products')
    .select('id, retailer_id, name, catalog_id, organization_id')
    .eq('retailer_id', 'jt4zd4o4mc');

  if (error) console.error(error);
  else {
    data.forEach(p => {
      console.log(`Product: ${p.name}`);
      console.log(`  retailer_id: ${p.retailer_id}`);
      console.log(`  catalog_id: "${p.catalog_id}" (length: ${p.catalog_id?.length || 0})`);
      console.log(`  org: ${p.organization_id}`);
    });
  }
}
main();
