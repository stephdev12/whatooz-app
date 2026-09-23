import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FlowCrypto } from '@/lib/whatsapp/flows/crypto';

// Use service role for webhooks as they run without user context
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Meta WhatsApp Flow Data Exchange Endpoint
 * Receives encrypted POST requests from Meta when users interact with Flow endpoints.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Extract payload from Meta
    const body = await req.json();
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
      return NextResponse.json({ error: 'Missing encryption parameters' }, { status: 400 });
    }

    // React 19 unwrap
    const { id: flowId } = await params;

    // 2. Fetch Flow Endpoint Config (contains RSA Private Key)
    const { data: config, error: configError } = await supabase
      .from('flow_endpoint_configs')
      .select('private_key_pem, organization_id')
      .eq('flow_id', flowId)
      .eq('is_active', true)
      .single();

    if (configError || !config || !config.private_key_pem) {
      console.error('[Flow Endpoint] Missing or inactive config for flow:', flowId);
      return NextResponse.json({ error: 'Endpoint config not found or inactive' }, { status: 404 });
    }

    // 3. Decrypt Request
    let decryptedData;
    try {
      const { decryptedBody } = FlowCrypto.decryptRequest(
        encrypted_aes_key,
        initial_vector,
        encrypted_flow_data,
        config.private_key_pem
      );
      decryptedData = decryptedBody;
    } catch (cryptoErr: any) {
       console.error('[Flow Endpoint] Decryption failed', cryptoErr);
       return NextResponse.json({ error: 'Decryption failed' }, { status: 400 });
    }

    console.log('[Flow Endpoint] Decrypted Action:', decryptedData.action);

    // 4. Process Action based on Flow logic
    const { action, data, screen, version } = decryptedData;
    let responsePayload: any = {};

    // Standard Meta health check action
    if (action === 'ping') {
      responsePayload = {
        data: {
          status: 'active'
        }
      };
    } 
    // INIT action (when flow starts if configured to fetch initial data)
    else if (action === 'INIT') {
       responsePayload = {
         screen: screen || 'MAIN_SCREEN',
         data: {
            // we could fetch dynamic user data here
            ...data,
            is_init: true
         }
       };
    }
    // DATA_EXCHANGE action (e.g. dynamic dropdowns or intermediate steps)
    else if (action === 'data_exchange') {
       responsePayload = {
         screen: screen || 'MAIN_SCREEN',
         data: {
            ...data,
            status: 'success'
         }
       };
    }
    // COMPLETE action (End of flow)
    else if (action === 'complete') {
       // Save submission
       await supabase.from('flow_submissions').insert({
          organization_id: config.organization_id,
          flow_id: flowId,
          submission_data: data,
          screen_id: screen
       });

       responsePayload = {
         screen: 'SUCCESS_SCREEN', // Ideally the flow designer defines this
         data: {
           status: 'submitted'
         }
       };
    } else {
       // Unknown action, fallback
       responsePayload = {
         screen: screen,
         data: data
       };
    }

    // 5. Encrypt Response
    // Meta requires the response to be encrypted using the SAME AES Key, but with a FLIPPED Initial Vector.
    // FlowCrypto decryptRequest doesn't return the raw AES key to us, we need it. 
    // Ah, wait. Our FlowCrypto.decryptRequest needs to return the decrypted AES key buffer so we can use it to encrypt.
    // Let's re-implement decryption here to keep the buffer, or fix FlowCrypto.

    // To keep it simple, since I noticed my crypto.ts didn't return the AES Key buffer, I'll decrypt the key here again.
    import('crypto').then(crypto => {
        const decryptedAesKeyBuffer = crypto.privateDecrypt(
          {
            key: config.private_key_pem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          Buffer.from(encrypted_aes_key, 'base64')
        );

        const encryptedResponse = FlowCrypto.encryptResponse(
          responsePayload, 
          decryptedAesKeyBuffer, 
          Buffer.from(initial_vector, 'base64')
        );

        return new NextResponse(encryptedResponse, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
    });
    
    // For synchronous flow in route:
    const cryptoModule = await import('crypto');
    const decryptedAesKeyBuffer = cryptoModule.privateDecrypt(
      {
        key: config.private_key_pem,
        padding: cryptoModule.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encrypted_aes_key, 'base64')
    );

    const encryptedResponse = FlowCrypto.encryptResponse(
      responsePayload, 
      decryptedAesKeyBuffer, 
      Buffer.from(initial_vector, 'base64')
    );

    return new NextResponse(encryptedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error: any) {
    console.error('[Flow Endpoint Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
