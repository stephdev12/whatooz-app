import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('orgId')

    if (!id || !orgId) {
      return new NextResponse('Missing parameters', { status: 400 })
    }

    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('access_token_encrypted')
      .eq('organization_id', orgId)
      .single()

    if (!config || !config.access_token_encrypted) {
      return new NextResponse('WhatsApp not configured', { status: 400 })
    }

    const accessToken = decrypt(config.access_token_encrypted)

    // 1. Get media URL
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!mediaRes.ok) {
      return new NextResponse('Failed to fetch media metadata', { status: mediaRes.status })
    }

    const mediaData = await mediaRes.json()
    const url = mediaData.url
    const mimeType = mediaData.mime_type

    if (!url) {
      return new NextResponse('Media URL not found', { status: 404 })
    }

    // 2. Download media
    const fileRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!fileRes.ok) {
      return new NextResponse('Failed to download media file', { status: fileRes.status })
    }

    // 3. Proxy the response
    const headers = new Headers()
    if (mimeType) {
      headers.set('Content-Type', mimeType)
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(fileRes.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('[Media Proxy Error]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
