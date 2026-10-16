import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/upload — Upload media (images, videos, documents) to Catbox
 * Returns a permanent, direct public HTTPS URL ready for WhatsApp Cloud API.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Check file size (max 25MB for WhatsApp media)
    const MAX_SIZE = 25 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale autorisée (25 Mo).' },
        { status: 400 }
      )
    }

    // Prepare upload to Catbox
    const catboxFormData = new FormData()
    catboxFormData.append('reqtype', 'fileupload')
    
    // Ensure filename has clean extension
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload.png'
    catboxFormData.append('fileToUpload', file, cleanFileName)

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxFormData,
    })

    const responseText = (await catboxRes.text()).trim()

    if (!catboxRes.ok || !responseText.startsWith('http')) {
      console.error('[Upload Catbox Error]', responseText)
      return NextResponse.json(
        { error: `Échec de l'hébergement de l'image : ${responseText || 'Erreur du serveur Catbox'}` },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      url: responseText,
      filename: cleanFileName,
      size: file.size,
      mimeType: file.type,
    })
  } catch (err: any) {
    console.error('[Upload API Exception]', err)
    return NextResponse.json(
      { error: err.message || 'Erreur interne lors du téléversement' },
      { status: 500 }
    )
  }
}
