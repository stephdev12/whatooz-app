import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getHeaderHandleForImage,
} from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/templates — List all templates from Meta.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!config?.access_token_encrypted || !config.waba_id) {
    return NextResponse.json(
      { error: 'WhatsApp not configured' },
      { status: 400 }
    )
  }

  const accessToken = decrypt(config.access_token_encrypted)

  try {
    const templates = await listTemplates({
      wabaId: config.waba_id,
      accessToken,
    })
    return NextResponse.json({ templates })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list templates'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/whatsapp/templates — Create a new template.
 *
 * Body:
 * - name: string
 * - language: string (e.g. 'fr')
 * - category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
 * - headerText?: string
 * - bodyText: string
 * - footerText?: string
 * - buttons?: Array<{ type: string; text: string; url?: string }>
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!config?.access_token_encrypted || !config.waba_id) {
    return NextResponse.json(
      { error: 'WhatsApp not configured' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const {
    name,
    language,
    category,
    headerType,
    headerText,
    headerImageUrl,
    bodyText,
    footerText,
    buttons,
  } = body

  if (!name || !language || !category || !bodyText) {
    return NextResponse.json(
      { error: 'name, language, category, and bodyText are required' },
      { status: 400 }
    )
  }

  const accessToken = decrypt(config.access_token_encrypted)

  // Build Meta components array
  const components: Array<Record<string, unknown>> = []

  if (headerType === 'IMAGE') {
    const sampleImage =
      headerImageUrl?.trim() ||
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'

    const appId =
      process.env.META_APP_ID ||
      process.env.NEXT_PUBLIC_META_APP_ID ||
      '1638932931226462'

    try {
      const handle = await getHeaderHandleForImage({
        appId,
        accessToken,
        imageUrl: sampleImage,
      })
      components.push({
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [handle],
        },
      })
    } catch (uploadErr) {
      console.error('[Template POST] Image Resumable Upload error:', uploadErr)
      const msg =
        uploadErr instanceof Error ? uploadErr.message : 'Erreur upload image Meta'
      return NextResponse.json(
        { error: `Échec du traitement de l’image par Meta : ${msg}` },
        { status: 400 }
      )
    }
  } else if (headerType === 'TEXT' || headerText) {
    if (headerText?.trim()) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: headerText.trim(),
      })
    }
  }

  components.push({
    type: 'BODY',
    text: bodyText,
  })

  if (footerText) {
    components.push({
      type: 'FOOTER',
      text: footerText,
    })
  }

  if (buttons?.length) {
    components.push({
      type: 'BUTTONS',
      buttons: buttons.map(
        (btn: { type: string; text: string; url?: string }) => {
          if (btn.type === 'URL') {
            return { type: 'URL', text: btn.text, url: btn.url }
          }
          return { type: 'QUICK_REPLY', text: btn.text }
        }
      ),
    })
  }

  try {
    const result = await createTemplate({
      wabaId: config.waba_id,
      accessToken,
      name,
      language,
      category,
      components,
    })

    // Cache locally
    await supabaseAdmin.from('message_templates').insert({
      organization_id: organizationId,
      meta_template_id: result.id,
      name,
      language,
      category,
      status: result.status || 'PENDING',
      components: JSON.stringify(components),
    })

    return NextResponse.json({ success: true, template: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create template'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/whatsapp/templates — Update an existing template on Meta.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!config?.access_token_encrypted || !config.waba_id) {
    return NextResponse.json({ error: 'WhatsApp non configuré' }, { status: 400 })
  }

  const body = await request.json()
  const {
    templateId,
    templateName,
    headerType,
    headerText,
    headerImageUrl,
    bodyText,
    footerText,
    buttons,
  } = body

  if (!bodyText) {
    return NextResponse.json({ error: 'Le corps du texte (bodyText) est requis.' }, { status: 400 })
  }

  const accessToken = decrypt(config.access_token_encrypted)

  try {
    // Build updated components
    const components: Array<Record<string, unknown>> = []

    if (headerType === 'TEXT' && headerText) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText })
    } else if (headerType === 'IMAGE' && headerImageUrl) {
      const appId =
        process.env.META_APP_ID ||
        process.env.NEXT_PUBLIC_META_APP_ID ||
        '1638932931226462'

      const handle = await getHeaderHandleForImage({
        appId,
        accessToken,
        imageUrl: headerImageUrl,
      })
      components.push({
        type: 'HEADER',
        format: 'IMAGE',
        example: { header_handle: [handle] },
      })
    }

    components.push({ type: 'BODY', text: bodyText })

    if (footerText) {
      components.push({ type: 'FOOTER', text: footerText })
    }

    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      const validButtons = buttons.map((b: any) => {
        if (b.type === 'URL') {
          return { type: 'URL', text: b.text, url: b.url }
        }
        return { type: 'QUICK_REPLY', text: b.text }
      })
      components.push({ type: 'BUTTONS', buttons: validButtons })
    }

    if (templateId) {
      try {
        await updateTemplate({
          templateId,
          accessToken,
          components,
        })
      } catch (metaErr) {
        const metaMsg = metaErr instanceof Error ? metaErr.message : ''
        if (metaMsg.includes('Unsupported post request')) {
          throw new Error("Ce modèle ne peut pas être modifié. Il n'est pas dans un état modifiable ou il manque les autorisations.")
        }
        throw metaErr
      }
    }

    // Update local cache
    if (templateName) {
      await supabaseAdmin
        .from('message_templates')
        .update({
          components,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('name', templateName)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Échec de mise à jour du template'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/whatsapp/templates — Delete a template by name.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!config?.access_token_encrypted || !config.waba_id) {
    return NextResponse.json(
      { error: 'WhatsApp not configured' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { templateName } = body

  if (!templateName) {
    return NextResponse.json(
      { error: 'templateName is required' },
      { status: 400 }
    )
  }

  const accessToken = decrypt(config.access_token_encrypted)

  try {
    await deleteTemplate({
      wabaId: config.waba_id,
      accessToken,
      templateName,
    })

    // Remove from local cache
    await supabaseAdmin
      .from('message_templates')
      .delete()
      .eq('organization_id', organizationId)
      .eq('name', templateName)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete template'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
