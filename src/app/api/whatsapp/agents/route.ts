import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Missing x-organization-id' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ agents: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Missing x-organization-id' }, { status: 400 })

    const body = await req.json()
    const { name, description, model, provider, system_prompt } = body

    const { data, error } = await supabaseAdmin
      .from('ai_agents')
      .insert({
        organization_id: orgId,
        name,
        description,
        status: 'ACTIVE',
        is_global: true,
        agent_config: {
          model: model || 'FAST',
          provider: provider || 'openai',
          temperature: 0.7,
          system_prompt: system_prompt || 'Vous êtes un assistant virtuel professionnel. Aidez le client avec ses demandes.',
          max_tokens: 1000,
        }
      })
      .select()
      .single()

    if (error) throw error

    const defaultTools = [
      'search_products', 'get_product', 'calculate_negotiated_price',
      'create_order', 'create_payment', 'list_available_automations', 'run_automation',
      'send_interactive_product', 'send_interactive_catalog', 'send_interactive_product_list'
    ]

    const permissions = defaultTools.map(tool => ({
      agent_id: data.id,
      tool_name: tool,
      can_execute: true
    }))

    await supabaseAdmin.from('agent_tool_permissions').insert(permissions)

    return NextResponse.json({ agent: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Missing x-organization-id' }, { status: 400 })

    const body = await req.json()
    const { id, status } = body

    const { data, error } = await supabaseAdmin
      .from('ai_agents')
      .update({ status })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ agent: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const orgId = req.headers.get('x-organization-id')
    if (!orgId) return NextResponse.json({ error: 'Missing x-organization-id' }, { status: 400 })

    const body = await req.json()
    const { id } = body

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
