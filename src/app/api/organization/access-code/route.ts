import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Org ID required' }, { status: 400 })

    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select('id, access_code')
      .eq('id', orgId)
      .single()

    if (error) throw error

    return NextResponse.json({ access_code: org?.access_code })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = request.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Org ID required' }, { status: 400 })

    // Verify user is OWNER or ADMIN
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json({ error: 'Seuls les administrateurs peuvent régénérer le code.' }, { status: 403 })
    }

    // Generate new random 8-character code
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({ access_code: newCode })
      .eq('id', orgId)
      .select('access_code')
      .single()

    if (error) throw error

    return NextResponse.json({ access_code: data.access_code })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
