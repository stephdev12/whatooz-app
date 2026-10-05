import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Missing org id' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()

    if (error) throw error

    // Fetch tool permissions
    const { data: perms } = await supabaseAdmin
      .from('agent_tool_permissions')
      .select('tool_name')
      .eq('agent_id', id)

    return NextResponse.json({ agent: data, tools: perms?.map((p) => p.tool_name) || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Missing org id' }, { status: 400 })

    const body = await req.json()
    const { name, description, agent_config, tools } = body

    const { data, error } = await supabaseAdmin
      .from('ai_agents')
      .update({ name, description, agent_config })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    if (tools && Array.isArray(tools)) {
      await supabaseAdmin.from('agent_tool_permissions').delete().eq('agent_id', id)
      const perms = tools.map((t: string) => ({ agent_id: id, tool_name: t, is_allowed: true }))
      if (perms.length > 0) {
        await supabaseAdmin.from('agent_tool_permissions').insert(perms)
      }
    }

    return NextResponse.json({ agent: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
