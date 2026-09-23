import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { META_API_BASE } from '@/lib/whatsapp/config'

export async function POST(request: Request) {
  try {
    const { organization_id } = await request.json()
    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get WhatsApp config for this organization
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('waba_id, access_token_encrypted')
      .eq('organization_id', organization_id)
      .single()

    if (configError || !config || !config.waba_id || !config.access_token_encrypted) {
      return NextResponse.json(
        { error: 'Meta WhatsApp configuration missing for this organization.' },
        { status: 400 }
      )
    }

    const accessToken = decrypt(config.access_token_encrypted)
    const url = `${META_API_BASE}/${config.waba_id}/message_templates`

    console.log(`Syncing templates for WABA ID: ${config.waba_id}`)

    // 2. Fetch templates from Meta API
    const response = await fetch(`${url}?access_token=${accessToken}&limit=100`)
    const data = await response.json()

    if (!response.ok) {
      console.error('Meta API Error:', data.error)
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch templates from Meta' },
        { status: 500 }
      )
    }

    const metaTemplates = data.data || []

    if (metaTemplates.length === 0) {
      return NextResponse.json({ success: true, message: 'Aucun template trouvé chez Meta.' })
    }

    // 3. Upsert templates in our database
    const templatesToUpsert = metaTemplates.map((tpl: any) => ({
      organization_id,
      name: tpl.name,
      language: tpl.language,
      category: tpl.category,
      status: tpl.status, // Meta status strings match roughly ours (APPROVED, REJECTED, PENDING)
      definition_json: {}, // We could parse components here into our format if we wanted
      compiled_payload: tpl.components,
      meta_template_id: tpl.id,
      meta_status: tpl.status,
      rejection_reason: tpl.rejected_reason || null,
      updated_at: new Date().toISOString()
    }))

    const { error: upsertError } = await supabase
      .from('whatsapp_templates')
      .upsert(templatesToUpsert, {
        onConflict: 'organization_id, name, language'
      })

    if (upsertError) {
      console.error('Database Upsert Error:', upsertError)
      return NextResponse.json({ error: 'Failed to save templates to database' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${metaTemplates.length} templates synchronisés avec Meta.` 
    })
  } catch (error) {
    console.error('Error during template sync:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
