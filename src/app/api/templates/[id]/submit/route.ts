import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WhatoozTemplate } from '@/lib/templates/types'
import { validateTemplate } from '@/lib/templates/validator'
import { compileTemplate } from '@/lib/templates/compiler'
import { createTemplate } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: templateRecord, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !templateRecord) {
      return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
    }

    const template: WhatoozTemplate = templateRecord.definition_json

    // 1. Validate
    const validationResult = validateTemplate(template)
    if (!validationResult.valid) {
      return NextResponse.json({ error: 'Le template est invalide', details: validationResult.errors }, { status: 400 })
    }

    // 2. Compile
    const compiledPayload = compileTemplate(template)

    // Fetch config
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('organization_id', templateRecord.organization_id)
      .single()

    if (!config || !config.waba_id || !config.access_token_encrypted) {
      return NextResponse.json({ error: 'WhatsApp n\'est pas configuré pour cette organisation' }, { status: 400 })
    }

    const accessToken = decrypt(config.access_token_encrypted)

    // 3. Send to Meta using createTemplate
    let metaResult;
    try {
      metaResult = await createTemplate({
        wabaId: config.waba_id,
        accessToken,
        name: template.name,
        language: template.language,
        category: template.category,
        components: compiledPayload.components
      })
    } catch (metaErr: any) {
      console.error('[Template Submit Meta Error]', metaErr)
      return NextResponse.json({ error: `Erreur Meta: ${metaErr.message}` }, { status: 400 })
    }

    // 4. Update Database
    const { data: updatedRecord, error: updateError } = await supabase
      .from('whatsapp_templates')
      .update({
        status: metaResult.status, 
        compiled_payload: compiledPayload,
        meta_template_id: metaResult.id,
        meta_status: metaResult.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updatedRecord)
  } catch (error: any) {
    console.error('Erreur Submission Templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
