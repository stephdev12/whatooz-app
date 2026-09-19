import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  listWabaFlows,
  getWabaFlowDetails,
  createWabaFlow,
  updateWabaFlowJson,
  publishWabaFlow,
  deleteWabaFlow,
} from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/flows — List WhatsApp Flows (local cache + Meta status).
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Fetch local flows
  const { data: localFlows, error: dbError } = await supabaseAdmin
    .from('whatsapp_flows')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // 2. Load WhatsApp config to sync live statuses from Meta
  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!config?.access_token_encrypted || !config.waba_id) {
    return NextResponse.json({ flows: localFlows ?? [], metaConnected: false })
  }

  let metaFlows: any[] = []
  let accessToken = ''
  try {
    accessToken = decrypt(config.access_token_encrypted)
    metaFlows = await listWabaFlows({
      wabaId: config.waba_id,
      accessToken,
    })
  } catch (err) {
    console.warn('[Flows GET] Could not fetch live flows from Meta:', err)
  }

  let allFlows = [...(localFlows ?? [])]

  // Auto-import flows from Meta (e.g. created in Meta Flow Builder) that are not in local database
  for (const mf of metaFlows) {
    const existing = allFlows.find((lf) => lf.meta_flow_id === mf.id)
    if (!existing) {
      try {
        let liveFlowJson: any = { version: '7.3', screens: [] }
        if (accessToken) {
          try {
            const details = await getWabaFlowDetails({ flowId: mf.id, accessToken })
            if (details?.flow_json) {
              liveFlowJson = typeof details.flow_json === 'string' ? JSON.parse(details.flow_json) : details.flow_json
            }
          } catch (detailErr) {
            console.warn('[Flows GET] Could not fetch detail for flow:', mf.id, detailErr)
          }
        }

        const { data: imported } = await supabaseAdmin
          .from('whatsapp_flows')
          .insert({
            user_id: user.id,
            meta_flow_id: mf.id,
            name: mf.name,
            categories: mf.categories || ['OTHER'],
            status: mf.status,
            flow_json: liveFlowJson,
          })
          .select()
          .single()
        if (imported) {
          allFlows.unshift(imported)
        }
      } catch (importErr) {
        console.warn('[Flows GET] Could not auto-sync Meta flow:', mf.name, importErr)
      }
    } else if (!existing.flow_json?.screens?.length && accessToken) {
      // Flow exists locally but has empty screens (e.g. was previously imported without JSON)
      try {
        const details = await getWabaFlowDetails({ flowId: mf.id, accessToken })
        if (details?.flow_json) {
          const parsed = typeof details.flow_json === 'string' ? JSON.parse(details.flow_json) : details.flow_json
          if (parsed?.screens?.length) {
            existing.flow_json = parsed
            await supabaseAdmin
              .from('whatsapp_flows')
              .update({ flow_json: parsed })
              .eq('id', existing.id)
          }
        }
      } catch (detailErr) {
        console.warn('[Flows GET] Could not update flow_json for existing flow:', mf.id, detailErr)
      }
    }
  }

  // Merge live statuses and validation errors from Meta
  const merged = allFlows.map((lf) => {
    const mf = metaFlows.find((m) => m.id === lf.meta_flow_id)
    return {
      ...lf,
      status: mf?.status || lf.status,
      validation_errors: mf?.validation_errors || [],
    }
  })

  // Fetch submitted responses
  const { data: responses } = await supabaseAdmin
    .from('flow_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({
    flows: merged,
    responses: responses ?? [],
    metaConnected: true,
  })
}

/**
 * POST /api/whatsapp/flows — Create, upload flow.json and optionally publish.
 *
 * Body:
 * - name: string
 * - categories?: string[]
 * - flowJson: Record<string, unknown>
 * - publish?: boolean
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!config?.access_token_encrypted || !config.waba_id) {
    return NextResponse.json(
      { error: 'WhatsApp non configuré. Veuillez connecter votre WABA dans les paramètres.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const {
    name,
    categories = ['OTHER'],
    flowJson,
    publish = false,
    flowCta,
    bodyText,
    headerText,
    headerImageUrl,
    footerText,
  } = body

  const VALID_CATEGORIES = [
    'SIGN_UP',
    'SIGN_IN',
    'APPOINTMENT_BOOKING',
    'LEAD_GENERATION',
    'CONTACT_US',
    'CUSTOMER_SUPPORT',
    'SURVEY',
    'OTHER',
  ]
  const cleanCategories = (Array.isArray(categories) && categories.length > 0 ? categories : ['OTHER'])
    .map((c: string) => {
      const u = String(c).trim().toUpperCase()
      return VALID_CATEGORIES.includes(u) ? u : 'OTHER'
    })
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)

  if (!name || !flowJson) {
    return NextResponse.json(
      { error: 'Le nom et la définition des écrans (flowJson) sont requis.' },
      { status: 400 }
    )
  }

  const accessToken = decrypt(config.access_token_encrypted)

  try {
    // 1. Create the flow container and upload flow_json atomically in Meta
    const metaFlow = await createWabaFlow({
      wabaId: config.waba_id,
      accessToken,
      name,
      categories: cleanCategories,
      flowJson,
      publish: false,
    })

    // 3. Publish if requested
    let status = 'DRAFT'
    let publishWarning: string | undefined

    if (publish) {
      try {
        await publishWabaFlow({
          flowId: metaFlow.id,
          accessToken,
        })
        status = 'PUBLISHED'
      } catch (pubErr) {
        console.warn('[Flows POST] Meta publication attempt failed (saved as DRAFT):', pubErr)
        publishWarning =
          'Le Flow a été créé avec succès sur Meta en mode Brouillon (DRAFT). Meta restreint la publication publique aux comptes d’entreprise ayant complété la vérification Meta (Business Verification). Vous pouvez toutefois déjà tester et envoyer ce Flow sans restriction !'
      }
    }

    const localFlowJson = {
      ...flowJson,
      _ui_meta: {
        flow_cta: flowCta || 'Ouvrir le formulaire',
        body_text: bodyText || `Voici le formulaire "${name}". Cliquez ci-dessous pour le remplir :`,
        header_text: headerText || undefined,
        header_image_url: headerImageUrl || undefined,
        footer_text: footerText || undefined,
      },
    }

    // 4. Save into local Supabase database
    const { data: savedFlow, error: insertError } = await supabaseAdmin
      .from('whatsapp_flows')
      .insert({
        user_id: user.id,
        meta_flow_id: metaFlow.id,
        name,
        categories: cleanCategories,
        status,
        flow_json: localFlowJson,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Flows POST] Database insert error:', insertError)
    }

    return NextResponse.json({
      success: true,
      flow: savedFlow || {
        id: metaFlow.id,
        meta_flow_id: metaFlow.id,
        name,
        status,
        flow_json: localFlowJson,
      },
      warning: publishWarning,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Échec de création du Flow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/whatsapp/flows — Update flow metadata (screens, default message texts, CTA, header, image, footer).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { flowId, flowCta, bodyText, headerText, headerImageUrl, footerText, name, flowJson, categories } = body

  if (!flowId) {
    return NextResponse.json({ error: 'flowId is required' }, { status: 400 })
  }

  const { data: flowRow } = await supabaseAdmin
    .from('whatsapp_flows')
    .select('*')
    .eq('user_id', user.id)
    .or(`id.eq.${flowId},meta_flow_id.eq.${flowId}`)
    .maybeSingle()

  if (!flowRow) {
    return NextResponse.json({ error: 'Flow non trouvé' }, { status: 404 })
  }

  const currentJson = flowJson || flowRow.flow_json || {}
  const currentMeta = currentJson._ui_meta || flowRow.flow_json?._ui_meta || {}

  const updatedJson = {
    ...currentJson,
    _ui_meta: {
      ...currentMeta,
      ...(flowCta !== undefined ? { flow_cta: flowCta } : {}),
      ...(bodyText !== undefined ? { body_text: bodyText } : {}),
      ...(headerText !== undefined ? { header_text: headerText } : {}),
      ...(headerImageUrl !== undefined ? { header_image_url: headerImageUrl } : {}),
      ...(footerText !== undefined ? { footer_text: footerText } : {}),
    },
  }

  // If new flowJson is provided and flow has a meta_flow_id, sync to Meta
  if (flowJson && flowRow.meta_flow_id) {
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (config?.access_token_encrypted) {
      try {
        const accessToken = decrypt(config.access_token_encrypted)
        await updateWabaFlowJson({
          flowId: flowRow.meta_flow_id,
          accessToken,
          flowJson: updatedJson,
        })
      } catch (metaErr) {
        console.warn('[Flows PATCH] Meta flow.json sync error:', metaErr)
      }
    }
  }

  const updatePayload: Record<string, any> = {
    flow_json: updatedJson,
    updated_at: new Date().toISOString(),
  }
  if (name) updatePayload.name = name
  if (categories && Array.isArray(categories)) {
    const VALID_CATEGORIES = [
      'SIGN_UP',
      'SIGN_IN',
      'APPOINTMENT_BOOKING',
      'LEAD_GENERATION',
      'CONTACT_US',
      'CUSTOMER_SUPPORT',
      'SURVEY',
      'OTHER',
    ]
    const cleanCats = categories
      .map((c: string) => {
        const u = String(c).trim().toUpperCase()
        return VALID_CATEGORIES.includes(u) ? u : 'OTHER'
      })
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
    updatePayload.categories = cleanCats.length > 0 ? cleanCats : ['OTHER']
  }

  const { data: updatedFlow, error } = await supabaseAdmin
    .from('whatsapp_flows')
    .update(updatePayload)
    .eq('id', flowRow.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, flow: updatedFlow })
}

/**
 * DELETE /api/whatsapp/flows — Delete flow from Meta and local DB.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: config } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const body = await request.json()
  const { flowId, metaFlowId } = body

  if (!flowId && !metaFlowId) {
    return NextResponse.json({ error: 'flowId ou metaFlowId requis' }, { status: 400 })
  }

  if (config?.access_token_encrypted && metaFlowId) {
    try {
      const accessToken = decrypt(config.access_token_encrypted)
      await deleteWabaFlow({ flowId: metaFlowId, accessToken })
    } catch (err) {
      console.warn('[Flows DELETE] Meta deletion error (proceeding with local delete):', err)
    }
  }

  // Delete from local DB
  const query = supabaseAdmin.from('whatsapp_flows').delete().eq('user_id', user.id)
  if (flowId) query.eq('id', flowId)
  else if (metaFlowId) query.eq('meta_flow_id', metaFlowId)

  await query

  return NextResponse.json({ success: true })
}
