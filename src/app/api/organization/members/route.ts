import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkQuota } from '@/lib/quota'

export const dynamic = 'force-dynamic'

/**
 * GET /api/organization/members
 * Lists all members of the current organization.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  // Fetch using the secure view created in Migration 004
  const { data: members, error } = await supabase
    .from('organization_members_view')
    .select('*')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ members })
}

/**
 * POST /api/organization/members
 * Invite a new user by email or create them manually.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  // Verify the current user is OWNER or ADMIN
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', currentUser.id)
    .single()

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Check Agent Quota
  const quota = await checkQuota(organizationId, 'agents')
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error }, { status: 403 })
  }

  const body = await request.json()
  const { email, fullName, role = 'AGENT', method = 'invite', password } = body

  if (!email || !fullName) {
    return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 })
  }

  try {
    let newUserId: string

    if (method === 'manual' && password) {
      // Create user manually
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      })
      if (createError) throw createError
      newUserId = newUser.user.id
    } else {
      // Invite via magic link
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName }
      })
      if (inviteError) throw inviteError
      newUserId = inviteData.user.id
    }

    // Add profile
    await supabaseAdmin.from('profiles').upsert({
      user_id: newUserId,
      full_name: fullName,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Add to organization_members
    const { error: memberError } = await supabaseAdmin.from('organization_members').insert({
      organization_id: organizationId,
      user_id: newUserId,
      role: role
    })

    if (memberError) throw memberError

    return NextResponse.json({ success: true, userId: newUserId })
  } catch (error: any) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: error.message || 'Failed to add member' }, { status: 500 })
  }
}

/**
 * DELETE /api/organization/members
 * Remove a member from the organization
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  // Verify the current user is OWNER or ADMIN
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', currentUser.id)
    .single()

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const { targetUserId } = body

  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
  }

  if (targetUserId === currentUser.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', targetUserId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
