import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FlowCrypto } from '@/lib/whatsapp/flows/crypto'

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const flowId = searchParams.get('flow_id')

    if (!flowId) {
      return NextResponse.json({ error: 'Missing flow_id parameter' }, { status: 400 })
    }

    const rawBody = await request.text()
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
      return NextResponse.json({ error: 'Missing encryption payloads' }, { status: 400 })
    }

    // Get the private key for this flow
    const { data: config, error: configErr } = await supabaseAdmin
      .from('flow_endpoint_configs')
      .select('private_key_pem, is_active')
      .eq('flow_id', flowId)
      .maybeSingle()

    if (configErr || !config || !config.private_key_pem) {
      return NextResponse.json({ error: 'Endpoint configuration not found for this flow' }, { status: 404 })
    }

    if (!config.is_active) {
      return NextResponse.json({ error: 'Endpoint is inactive' }, { status: 403 })
    }

    // Decrypt request
    const { decryptedBody, aesKeyBuffer, ivBuffer } = FlowCrypto.decryptRequest(
      encrypted_aes_key,
      initial_vector,
      encrypted_flow_data,
      config.private_key_pem
    )

    console.log(`[Flow Endpoint] Received action: ${decryptedBody.action} for flow ${flowId}`)

    let responsePayload: any = {}

    // Handle standard actions
    if (decryptedBody.action === 'ping') {
      responsePayload = {
        data: {
          status: 'active'
        }
      }
    } else if (decryptedBody.action === 'INIT') {
      // Return initial data if needed
      responsePayload = {
        screen: decryptedBody.screen,
        data: {}
      }
    } else if (decryptedBody.action === 'data_exchange') {
      // Dynamic data handling based on the screen
      responsePayload = {
        screen: decryptedBody.screen,
        data: {
          // Dynamic data mapping can be added here
          // This is a placeholder response
          success: true
        }
      }
    } else {
      console.warn(`[Flow Endpoint] Unknown action: ${decryptedBody.action}`)
      responsePayload = {
        screen: decryptedBody.screen,
        data: {
          error: 'Unknown action'
        }
      }
    }

    // Encrypt response
    const encryptedResponse = FlowCrypto.encryptResponse(
      responsePayload,
      aesKeyBuffer,
      ivBuffer
    )

    return new NextResponse(encryptedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    })

  } catch (error: any) {
    console.error('[Flow Endpoint] Error processing request:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
