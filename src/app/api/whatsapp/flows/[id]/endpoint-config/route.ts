import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FlowCrypto } from '@/lib/whatsapp/flows/crypto'
import { decrypt } from '@/lib/whatsapp/encryption'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: config } = await supabaseAdmin
    .from('flow_endpoint_configs')
    .select('*')
    .eq('flow_id', id)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!config) {
    return NextResponse.json({ active: false, publicKey: null })
  }

  return NextResponse.json({
    active: config.is_active,
    publicKey: config.public_key_pem
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const { action } = body

  if (action === 'generate') {
    // Generate new keys
    const { publicKey, privateKey } = FlowCrypto.generateKeyPair()

    const { data: existing } = await supabaseAdmin
      .from('flow_endpoint_configs')
      .select('id')
      .eq('flow_id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin
        .from('flow_endpoint_configs')
        .update({
          public_key_pem: publicKey,
          private_key_pem: privateKey,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('flow_endpoint_configs')
        .insert({
          organization_id: organizationId,
          flow_id: id,
          public_key_pem: publicKey,
          private_key_pem: privateKey,
          is_active: true
        })
    }

    return NextResponse.json({ success: true, publicKey })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
