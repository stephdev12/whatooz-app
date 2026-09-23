import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data, error } = await supabase
    .from('automations')
    .select('id, name, trigger_type, trigger_value, action_type, action_payload')
    .eq('trigger_type', 'flow_completed')
    .limit(5)

  if (error) console.error(error)
  else console.log(JSON.stringify(data, null, 2))
}
main()
