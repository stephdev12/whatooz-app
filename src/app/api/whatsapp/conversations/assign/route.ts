import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/whatsapp/conversations/assign
 * Update a conversation's status and assigned user.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const body = await request.json()
  const { conversationId, assignedUserId, status, contactName } = body

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
  }

  // Build the update payload
  const updatePayload: any = {}
  if (assignedUserId !== undefined) {
    updatePayload.assigned_user_id = assignedUserId === 'unassigned' ? null : assignedUserId
  }
  if (status !== undefined) {
    updatePayload.status = status
  }
  if (contactName !== undefined) {
    updatePayload.contact_name = contactName
  }
  
  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updatePayload.updated_at = new Date().toISOString()

  const { data: conversation, error } = await supabase
    .from('conversations')
    .update(updatePayload)
    .eq('id', conversationId)
    .eq('organization_id', organizationId)
    .select('*')
    .single()

  if (error) {
    console.error('Update conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, conversation })
}
