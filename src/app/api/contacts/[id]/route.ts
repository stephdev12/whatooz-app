import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/contacts/[id]
 * Delete a contact and optionally their conversations.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { id: contactId } = await params
  if (!contactId) {
    return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
  }

  const deleteConversations = request.nextUrl.searchParams.get('deleteConversations') === 'true'

  // Verify contact belongs to the organization
  const { data: contact, error: findError } = await supabase
    .from('contacts')
    .select('id, phone, name')
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .single()

  if (findError || !contact) {
    return NextResponse.json({ error: 'Contact introuvable ou accès refusé' }, { status: 404 })
  }

  // If user requested deleting associated conversations too
  if (deleteConversations && contact.phone) {
    // Find all conversation IDs to delete their messages
    const { data: convos } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('contact_phone', contact.phone)

    if (convos && convos.length > 0) {
      const convoIds = convos.map(c => c.id)
      await supabase
        .from('messages')
        .delete()
        .in('conversation_id', convoIds)

      await supabase
        .from('conversations')
        .delete()
        .in('id', convoIds)
    }
  } else {
    // Unlink contact from any conversations without deleting the message history
    await supabase
      .from('conversations')
      .update({ contact_id: null })
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
  }

  // Delete contact (cascades contact_notes, contact_tags)
  const { error: deleteError } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('organization_id', organizationId)

  if (deleteError) {
    console.error('Error deleting contact:', deleteError)
    return NextResponse.json({ error: 'Impossible de supprimer le contact' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Contact supprimé avec succès',
  })
}
