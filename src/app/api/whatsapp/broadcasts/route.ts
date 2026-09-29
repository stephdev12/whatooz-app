import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: broadcasts, error } = await supabase
    .from('broadcast_campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(broadcasts)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      organizationId, 
      name, 
      target_type, 
      target_tags, 
      target_contacts, 
      message_type, 
      message_payload, 
      scheduled_at,
      recurrence
    } = body

    if (!organizationId || !name || !message_type || !message_payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const status = scheduled_at ? 'scheduled' : 'sending'

    const { data: broadcast, error } = await supabase
      .from('broadcast_campaigns')
      .insert([
        {
          organization_id: organizationId,
          name,
          target_type,
          target_tags,
          target_contacts,
          message_type,
          message_payload,
          scheduled_at: scheduled_at || new Date().toISOString(),
          recurrence: recurrence || 'once',
          status
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // TODO: If status === 'sending' (immediate), we should trigger the background job
    // For now we just insert it. A cron job should pick it up, or we can fetch and send here.

    return NextResponse.json(broadcast)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
