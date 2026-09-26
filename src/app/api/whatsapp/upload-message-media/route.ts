import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import { META_API_BASE } from '@/lib/whatsapp/config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // 1. Fetch organization WhatsApp config
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('access_token_encrypted, phone_number_id')
      .eq('organization_id', organizationId)
      .single()

    if (!config?.access_token_encrypted || !config.phone_number_id) {
      return NextResponse.json({ error: 'WhatsApp non configuré' }, { status: 400 })
    }

    const accessToken = decrypt(config.access_token_encrypted)
    const phoneNumberId = config.phone_number_id

    // 2. Prepare multipart form data for Meta
    const metaFormData = new FormData()
    metaFormData.append('messaging_product', 'whatsapp')
    metaFormData.append('file', file)
    
    // We can also extract and pass 'type' from file type if needed, but 'file' includes the mime type implicitly via Blob

    const url = `${META_API_BASE}/${phoneNumberId}/media`
    
    // 3. Upload to Meta
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: metaFormData,
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[Upload Message Media Error]', err)
      return NextResponse.json({ error: 'Échec de l\'upload vers Meta' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ mediaId: data.id, success: true })
  } catch (error: any) {
    console.error('[Upload Message Media Error]', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'upload du média' }, { status: 500 })
  }
}
