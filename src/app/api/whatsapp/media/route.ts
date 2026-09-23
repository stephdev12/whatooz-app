import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import { uploadResumableMedia } from '@/lib/whatsapp/meta-api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const organizationId = formData.get('organization_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }
    if (!organizationId) {
      return NextResponse.json({ error: 'ID organisation manquant' }, { status: 400 })
    }

    // 1. Fetch organization WhatsApp config
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('access_token_encrypted')
      .eq('organization_id', organizationId)
      .single()

    if (!config || !config.access_token_encrypted) {
      return NextResponse.json({ error: 'WhatsApp non configuré' }, { status: 400 })
    }

    const accessToken = decrypt(config.access_token_encrypted)
    const appId = process.env.META_APP_ID

    if (!appId) {
      return NextResponse.json({ error: 'Configuration serveur (META_APP_ID) manquante' }, { status: 500 })
    }

    // 2. Prepare file bytes
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 3. Upload to Meta
    const result = await uploadResumableMedia({
      appId,
      accessToken,
      fileName: file.name,
      mimeType: file.type,
      bytes,
    })

    // (Optional) Save to template_media if needed, for now we just return the handle
    return NextResponse.json({ handle: result.handle, success: true })
  } catch (error: any) {
    console.error('[Upload Media Error]', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'upload du média' }, { status: 500 })
  }
}
