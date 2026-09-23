require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const targetEmail = 'stephaneboyce@gmail.com'
  console.log(`Fetching user: ${targetEmail}...`)
  
  // We can fetch all users and find the target one
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError) {
    console.error('Error fetching users:', userError)
    return
  }

  const user = users.users.find(u => u.email === targetEmail)
  
  if (!user) {
    console.log(`User ${targetEmail} not found. Please sign up first.`)
    return
  }

  console.log(`Found user: ${user.email} (ID: ${user.id})`)

  console.log('Creating organization for user...')
  const orgId = uuidv4()
  
  const { error: orgError } = await supabase
    .from('organizations')
    .insert([
      {
        id: orgId,
        name: 'Organisation de Stephane',
        slug: 'stephane-org-' + Date.now()
      }
    ])

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return
  }

  console.log('Linking user to organization as OWNER...')
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert([
      {
        organization_id: orgId,
        user_id: user.id,
        role: 'OWNER'
      }
    ])

  if (memberError) {
    console.error('Error linking user:', memberError)
    return
  }

  console.log('Successfully created and linked organization for ' + targetEmail + '!')
}

run()
