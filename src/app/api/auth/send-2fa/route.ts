import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    // Générer un code à 4 chiffres
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // Expire dans 10 minutes

    const { error: dbError } = await supabase.from('verification_codes').insert({
      phone,
      code,
      expires_at: expiresAt.toISOString()
    })

    if (dbError) {
      console.error('Error saving verification code:', dbError)
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
    }

    // Préparer les paramètres pour l'envoi WhatsApp
    // Le nom du template est "whatooz"
    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const host = req.headers.get('host')
    const baseUrl = `${protocol}://${host}`
    
    // S'il faut une organisation id pour envoyer le message depuis /api/whatsapp/send
    // Note : L'utilisateur n'est pas encore inscrit, il faut utiliser l'ID de l'organisation par défaut 
    // ou une clé API si /api/whatsapp/send l'exige.
    // L'API send s'attend à "x-organization-id" dans le header, 
    // on va utiliser la configuration WHATZ d'une organisation par défaut, 
    // ou bien on fait l'appel WhatsApp directement ici.
    // Faisons l'appel WhatsApp Meta API directement ici pour éviter les problèmes d'auth organisationnelle.
    
    // ----------------------------------------------------
    // Appel direct à Meta pour être sûr que ça part 
    // depuis le compte Whatooz (le propriétaire de la plateforme)
    // ----------------------------------------------------
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
    
    if (!META_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
       console.error("META_ACCESS_TOKEN or WHATSAPP_PHONE_ID is missing in env")
       return NextResponse.json({ error: 'WhatsApp config missing on server' }, { status: 500 })
    }
    
    // Dans sa demande, l'utilisateur indique : "et la variable est je pense {{1}}"
    // Un template d'authentification standard a soit une variable "body", soit un paramètre de type "button" / "url"
    // S'il s'agit d'un body avec {{1}}, on envoie la variable body. 
    // S'il s'agit d'un COPY_CODE, on envoie la variable button.
    // Mettons les deux pour être certain que Meta l'accepte selon sa configuration.
    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone.replace('+', ''), // Nettoyage simple du +, Meta attend le format international sans le +
        type: 'template',
        template: {
          name: 'whatooz',
          language: { code: 'fr' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: code
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: code
                }
              ]
            }
          ]
        }
      })
    })

    if (!metaResponse.ok) {
      const errData = await metaResponse.json()
      console.error('Error sending WhatsApp message via Meta API:', errData)
      // Si on échoue avec les 2 components (body + button), 
      // essayons de renvoyer seulement le bouton COPY_CODE
      if (errData.error?.message?.includes('format does not match')) {
         const metaRetry = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             messaging_product: 'whatsapp',
             recipient_type: 'individual',
             to: phone.replace('+', ''),
             type: 'template',
             template: {
               name: 'whatooz',
               language: { code: 'fr' },
               components: [
                 {
                   type: 'button',
                   sub_type: 'url',
                   index: '0',
                   parameters: [
                     {
                       type: 'text',
                       text: code
                     }
                   ]
                 }
               ]
             }
           })
         })
         
         if (!metaRetry.ok) {
           const retryErr = await metaRetry.json()
           console.error('Retry failed as well:', retryErr)
           return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
         }
      } else {
        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Code sent successfully' })
  } catch (err: any) {
    console.error('send-2fa error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
