import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  sendTextMessage,
  sendTemplateMessage,
  sendFlowMessage,
  sendProductMessage,
  sendProductListMessage,
  sendCatalogMessage,
} from '@/lib/whatsapp/meta-api'
import { BuilderNode, BuilderEdge, WorkflowExecutionContext } from '@/components/automations/builder/types'

export interface WorkflowEngineConfig {
  accessToken: string
  phoneNumberId: string
  wabaId?: string
}

/**
 * Replace template variables formatted as {{ path.to.var }} with context values.
 * Supports:
 * - {{ contact.name }}, {{ contact.phone }}, {{ contact.id }}
 * - {{ message.text }}, {{ message.id }}
 * - {{ flow.response.FIELD_NAME }}
 * - {{ order.id }}, {{ order.total }}
 * - {{ steps.NODE_ID.FIELD }}
 * - {{ variables.VAR_NAME }}
 */
export function interpolateVariables(text: string, context: WorkflowExecutionContext): string {
  if (!text || typeof text !== 'string') return text

  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
    const trimmed = expression.trim()

    // 1. Direct helpers
    if (trimmed === 'contact.name') return context.contact?.name || ''
    if (trimmed === 'contact.phone') return context.contact?.phone || ''
    if (trimmed === 'contact.id') return context.contact?.id || ''
    if (trimmed === 'message.text') return context.message?.text || ''
    if (trimmed === 'message.id') return context.message?.id || ''
    if (trimmed === 'now') return new Date().toISOString()
    if (trimmed === 'date') return new Date().toLocaleDateString('fr-FR')
    if (trimmed === 'time') return new Date().toLocaleTimeString('fr-FR')

    // 2. Flow response variables: {{ flow.response.some_key }}
    if (trimmed.startsWith('flow.response.') && context.flowResponse) {
      const key = trimmed.replace('flow.response.', '').trim()
      const val = context.flowResponse[key]
      return val !== undefined && val !== null ? String(val) : ''
    }

    // 3. Step execution results: {{ steps.NODE_ID.some_key }}
    if (trimmed.startsWith('steps.') && context.steps) {
      const path = trimmed.replace('steps.', '').split('.')
      let curr: any = context.steps
      for (const p of path) {
        if (!curr || typeof curr !== 'object') return ''
        curr = curr[p]
      }
      return curr !== undefined && curr !== null ? String(curr) : ''
    }

    // 4. Custom context variables: {{ variables.some_key }}
    if (trimmed.startsWith('variables.') && context.variables) {
      const key = trimmed.replace('variables.', '').trim()
      const val = context.variables[key]
      return val !== undefined && val !== null ? String(val) : ''
    }

    // Fallback: search in context directly
    const parts = trimmed.split('.')
    let current: any = context
    for (const part of parts) {
      if (current === undefined || current === null) break
      current = current[part]
    }
    if (current !== undefined && current !== null && typeof current !== 'object') {
      return String(current)
    }

    return match
  })
}

/**
 * Evaluate condition node against execution context.
 */
export function evaluateCondition(node: BuilderNode, context: WorkflowExecutionContext): boolean {
  const data = node.data as any
  const field = (data.conditionField || 'message.text').trim()
  const operator = data.conditionType || 'equals'
  const expectedValue = String(data.conditionValue || '').trim()

  // Resolve actual value
  let actualValue = ''
  if (field === 'message.text') {
    actualValue = context.message?.text || ''
  } else if (field === 'contact.name') {
    actualValue = context.contact?.name || ''
  } else if (field === 'contact.phone') {
    actualValue = context.contact?.phone || ''
  } else if (field.startsWith('flow.response.') && context.flowResponse) {
    const key = field.replace('flow.response.', '')
    actualValue = context.flowResponse[key] ?? ''
  } else if (field === 'tag' && context.contact?.tags) {
    actualValue = context.contact.tags.join(',')
  } else {
    // Nested path traversal in context
    const parts = field.split('.')
    let curr: any = context
    for (const p of parts) {
      if (!curr) break
      curr = curr[p]
    }
    actualValue = curr !== undefined && curr !== null ? String(curr) : ''
  }

  const actualNormalized = String(actualValue).trim().toLowerCase()
  const expectedNormalized = expectedValue.toLowerCase()

  switch (operator) {
    case 'equals':
      return actualNormalized === expectedNormalized
    case 'not_equals':
      return actualNormalized !== expectedNormalized
    case 'contains':
      return actualNormalized.includes(expectedNormalized)
    case 'not_contains':
      return !actualNormalized.includes(expectedNormalized)
    case 'starts_with':
      return actualNormalized.startsWith(expectedNormalized)
    case 'ends_with':
      return actualNormalized.endsWith(expectedNormalized)
    case 'greater_than':
      return parseFloat(actualValue) > parseFloat(expectedValue)
    case 'less_than':
      return parseFloat(actualValue) < parseFloat(expectedValue)
    case 'exists':
      return actualValue !== '' && actualValue !== undefined && actualValue !== null
    case 'empty':
      return actualValue === '' || actualValue === undefined || actualValue === null
    default:
      return actualNormalized === expectedNormalized
  }
}

/**
 * Execute a single Action Node.
 */
export async function executeActionNode(
  node: BuilderNode,
  context: WorkflowExecutionContext,
  config: WorkflowEngineConfig
): Promise<any> {
  const data = node.data as any
  const actionType = data.actionType
  const payload = data.actionPayload || {}
  const recipientPhone = context.contact?.phone || ''

  const whatsappActions = [
    'send_message',
    'send_template',
    'send_flow',
    'send_product',
    'send_product_list',
    'send_product_carousel',
    'send_catalog',
  ]

  if (whatsappActions.includes(actionType) && !recipientPhone) {
    throw new Error(`Aucun numéro de téléphone destinataire fourni pour le nœud WhatsApp ${node.id}`)
  }

  console.log(`[Workflow Engine] Executing node "${data.label || node.id}" (Type: ${actionType}) for ${recipientPhone}`)

  switch (actionType) {
    case 'send_message': {
      const rawText = payload.text || data.text || ''
      const text = interpolateVariables(rawText, context)
      if (!text.trim()) {
        console.warn(`[Workflow Engine] Message text is empty for node ${node.id}`)
        return { skipped: true, reason: 'Empty text' }
      }

      const res = await sendTextMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        text,
      })

      // Also record message in database conversation if available
      try {
        await logOutboundMessage(context, text, 'text', res.messageId)
      } catch (err) {
        console.error('[Workflow Engine] Failed to log outbound message in DB:', err)
      }

      return res
    }

    case 'send_template': {
      const templateName = payload.template_name || payload.templateName || data.templateId || data.templateName
      const languageCode = payload.language_code || payload.languageCode || data.actionLanguage || 'fr'

      if (!templateName) {
        throw new Error(`Nom de template manquant pour le nœud ${node.id}`)
      }

      // Build components / variable replacements
      let components: Array<Record<string, unknown>> | undefined

      if (payload.components && Array.isArray(payload.components)) {
        components = payload.components
      } else {
        const bodyVariables: string[] = []
        const mapping = payload.templateVariablesMapping || data.templateVariablesMapping

        if (mapping && typeof mapping === 'object') {
          const keys = Object.keys(mapping).sort((a, b) => parseInt(a) - parseInt(b))
          for (const k of keys) {
            const rawVal = mapping[k]
            bodyVariables.push(interpolateVariables(rawVal, context))
          }
        } else if (Array.isArray(payload.body_variables)) {
          for (const v of payload.body_variables) {
            bodyVariables.push(interpolateVariables(v, context))
          }
        }

        const headerImageUrl = payload.header_image_url || payload.headerImageUrl
        const resolvedHeaderImage = headerImageUrl ? interpolateVariables(headerImageUrl, context) : undefined

        const comps: Array<Record<string, unknown>> = []
        if (resolvedHeaderImage) {
          comps.push({
            type: 'header',
            parameters: [{ type: 'image', image: { link: resolvedHeaderImage } }],
          })
        }
        if (bodyVariables.length > 0) {
          comps.push({
            type: 'body',
            parameters: bodyVariables.map((text) => ({ type: 'text', text })),
          })
        }
        if (comps.length > 0) components = comps
      }

      const res = await sendTemplateMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        templateName,
        languageCode,
        components,
      })

      try {
        await logOutboundMessage(context, `[Modèle: ${templateName}]`, 'template', res.messageId)
      } catch (err) {
        console.error('[Workflow Engine] Failed to log outbound template in DB:', err)
      }

      return res
    }

    case 'send_flow': {
      const flowId = payload.flow_id || payload.flowId || data.flowId
      const flowCta = interpolateVariables(payload.flow_cta || payload.flowCta || data.buttonText || 'Ouvrir', context)
      const bodyText = interpolateVariables(payload.body_text || payload.bodyText || data.ctaMessage || 'Veuillez remplir ce formulaire', context)

      if (!flowId) {
        throw new Error(`ID de flow manquant pour le nœud ${node.id}`)
      }

      // Get flow details to fetch screen_id if needed
      const { data: flowRow } = await supabaseAdmin
        .from('whatsapp_flows')
        .select('*')
        .eq('meta_flow_id', flowId)
        .maybeSingle()

      const firstScreen = flowRow?.flow_json?.screens?.[0]?.id || 'SCREEN_1'
      const flowToken = `${flowId}_${Date.now()}`

      const res = await sendFlowMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        flowId,
        flowToken,
        flowCta,
        screen: firstScreen,
        bodyText,
      })

      try {
        await logOutboundMessage(context, `[Flow WhatsApp: ${flowCta}]`, 'interactive', res.messageId)
      } catch (err) {
        console.error('[Workflow Engine] Failed to log outbound flow in DB:', err)
      }

      return res
    }

    case 'send_product': {
      const catalogId = payload.catalogId || data.catalogId
      const productRetailerId = payload.productRetailerId || data.productRetailerId
      const bodyText = interpolateVariables(payload.text || data.text || 'Découvrez notre produit', context)

      if (!catalogId || !productRetailerId) {
        throw new Error(`Catalogue ou référence produit manquante pour le nœud ${node.id}`)
      }

      const res = await sendProductMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        catalogId,
        productRetailerId,
        bodyText,
      })

      try {
        await logOutboundMessage(context, `[Produit: ${productRetailerId}]`, 'interactive', res.messageId)
      } catch (err) {
        console.error('[Workflow Engine] Failed to log outbound product in DB:', err)
      }

      return res
    }

    case 'send_product_list':
    case 'send_product_carousel': {
      const catalogId = payload.catalogId || data.catalogId
      const productRetailerIds = Array.isArray(payload.productRetailerIds)
        ? payload.productRetailerIds
        : (payload.productRetailerIds || '').split(',').map((s: string) => s.trim()).filter(Boolean)
      const bodyText = interpolateVariables(payload.text || data.text || 'Découvrez notre sélection', context)

      if (!catalogId || productRetailerIds.length === 0) {
        throw new Error(`Catalogue ou liste de produits manquante pour le nœud ${node.id}`)
      }

      const sections = [
        {
          title: 'Produits',
          product_items: productRetailerIds.map((id: string) => ({ product_retailer_id: id })),
        },
      ]

      const res = await sendProductListMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        catalogId,
        headerText: 'Catalogue',
        bodyText,
        sections,
      })

      return res
    }

    case 'send_catalog': {
      const bodyText = interpolateVariables(payload.message || data.catalogMessage || 'Consultez notre catalogue complet', context)
      const thumbnailProductRetailerId = payload.thumbnailProductRetailerId || data.thumbnailProductRetailerId

      const res = await sendCatalogMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        bodyText,
        thumbnailProductRetailerId,
      })

      return res
    }

    case 'create_saspay_payment': {
      // 1. Resolve amount (fixed or variable)
      let rawAmount = payload.amount || payload.paymentAmount || data.paymentAmount
      if (!rawAmount && context.order?.total_amount) {
        rawAmount = context.order.total_amount
      } else if (!rawAmount && context.order?.total) {
        rawAmount = context.order.total
      } else if (!rawAmount && context.flowResponse?.amount) {
        rawAmount = context.flowResponse.amount
      }
      
      const resolvedAmountStr = interpolateVariables(String(rawAmount || '1000'), context).trim()
      const numericAmount = Math.max(100, Math.round(parseFloat(resolvedAmountStr) || 1000))

      // 2. Resolve credentials & parameters
      const apiKey = (payload.apiKey || payload.saspayApiKey || process.env.SASPAY_API_KEY || '').trim()
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whatooz.space'
      const returnUrl = payload.returnUrl || `${baseUrl}/shop`
      const rawDescription = payload.description || payload.paymentDescription || `Paiement WhatsApp - ${context.contact.name || recipientPhone}`
      const description = interpolateVariables(rawDescription, context)

      if (!apiKey || apiKey === 'sk_live_votre_cle_secrete_saspay') {
        throw new Error(
          `Clé API SasPay non configurée. Veuillez renseigner votre clé secrète SasPay (sk_live_...) dans la configuration du bloc de paiement ou définir SASPAY_API_KEY.`
        )
      }

      // 3. Call REAL SasPay Checkout Session API
      console.log(`[Workflow Engine] Creating SasPay session: ${numericAmount} XOF for ${recipientPhone}`)
      const saspayResponse = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericAmount.toString(),
          currency: 'XOF',
          description,
          customer_email: context.flowResponse?.email || context.variables?.email || 'client@whatooz.com',
          customer_name: context.contact.name || recipientPhone || 'Client Whatooz',
          customer_phone: recipientPhone || undefined,
          return_url: returnUrl,
          metadata: {
            organization_id: context.organizationId,
            contact_phone: recipientPhone,
            automation_id: context.automationId,
            order_id: context.order?.id,
          },
        }),
      })

      const saspayData = await saspayResponse.json().catch(() => ({}))

      if (!saspayResponse.ok) {
        const errorDetail = saspayData.error?.detail || saspayData.message || saspayData.detail || JSON.stringify(saspayData)
        throw new Error(`Erreur API SasPay (${saspayResponse.status}): ${errorDetail}`)
      }

      const checkoutUrl = saspayData.data?.checkout_url || saspayData.checkout_url
      const sessionId = saspayData.data?.id || saspayData.id

      if (!checkoutUrl) {
        throw new Error(`SasPay n'a pas retourné de lien de paiement valide: ${JSON.stringify(saspayData)}`)
      }

      // 4. Record transaction in database
      try {
        await supabaseAdmin.from('payment_transactions').insert({
          organization_id: context.organizationId,
          order_id: context.order?.id || null,
          provider: 'saspay',
          provider_transaction_id: sessionId,
          payment_link: checkoutUrl,
          amount: numericAmount,
          currency: 'XOF',
          status: 'pending',
          customer_phone: recipientPhone || null,
          metadata: {
            source: 'automation_builder',
            automation_id: context.automationId,
          },
        })
      } catch (txErr) {
        console.error('[Workflow Engine] Failed to record payment_transactions in DB:', txErr)
      }

      // 5. Expose variables for subsequent nodes
      if (!context.variables) context.variables = {}
      context.variables.payment_url = checkoutUrl
      context.variables.checkout_url = checkoutUrl
      context.variables.amount = numericAmount
      context.variables.payment_amount = numericAmount

      // 6. Build and send WhatsApp message with REAL link
      const rawMsg = payload.message || payload.paymentMessage || data.paymentMessage || `Veuillez régler votre paiement de {{ amount }} FCFA via ce lien sécurisé :`
      const resolvedMsg = interpolateVariables(rawMsg, context)
      const fullText = `${resolvedMsg}\n\n👉 Lien de paiement sécurisé : ${checkoutUrl}`

      let res: any = { checkoutUrl, sessionId, amount: numericAmount }

      if (recipientPhone && config.accessToken && config.phoneNumberId) {
        res = await sendTextMessage({
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
          to: recipientPhone,
          text: fullText,
        })
        try {
          await logOutboundMessage(context, fullText, 'text', res.messageId)
        } catch (err) {
          console.error('[Workflow Engine] Failed to log outbound payment in DB:', err)
        }
      }

      return {
        ...res,
        checkoutUrl,
        sessionId,
        amount: numericAmount,
      }
    }

    case 'add_tag': {
      const tagName = interpolateVariables(payload.tagName || data.tagName || '', context).trim()
      if (!tagName) {
        return { skipped: true, reason: 'Empty tag name' }
      }

      if (context.contact?.id) {
        // Find or create tag
        let { data: existingTag } = await supabaseAdmin
          .from('tags')
          .select('id')
          .eq('organization_id', context.organizationId)
          .ilike('name', tagName)
          .maybeSingle()

        if (!existingTag) {
          const { data: newTag } = await supabaseAdmin
            .from('tags')
            .insert({
              organization_id: context.organizationId,
              name: tagName,
              color: '#3B82F6',
            })
            .select('id')
            .single()
          existingTag = newTag
        }

        if (existingTag?.id) {
          await supabaseAdmin
            .from('contact_tags')
            .upsert({
              contact_id: context.contact.id,
              tag_id: existingTag.id,
            }, { onConflict: 'contact_id,tag_id' })
        }
      }

      if (!context.contact.tags) context.contact.tags = []
      if (!context.contact.tags.includes(tagName)) {
        context.contact.tags.push(tagName)
      }

      return { addedTag: tagName }
    }

    case 'remove_tag': {
      const tagName = interpolateVariables(payload.tagName || data.tagName || '', context).trim()
      if (tagName && context.contact?.id) {
        const { data: tagRow } = await supabaseAdmin
          .from('tags')
          .select('id')
          .eq('organization_id', context.organizationId)
          .ilike('name', tagName)
          .maybeSingle()

        if (tagRow?.id) {
          await supabaseAdmin
            .from('contact_tags')
            .delete()
            .eq('contact_id', context.contact.id)
            .eq('tag_id', tagRow.id)
        }
      }

      if (context.contact?.tags) {
        context.contact.tags = context.contact.tags.filter((t) => t.toLowerCase() !== tagName.toLowerCase())
      }

      return { removedTag: tagName }
    }

    case 'assign_agent': {
      const userId = payload.assignedUserId || data.assignedUserId
      if (userId && context.contact?.phone) {
        await supabaseAdmin
          .from('conversations')
          .update({ assigned_user_id: userId, updated_at: new Date().toISOString() })
          .eq('organization_id', context.organizationId)
          .eq('contact_phone', context.contact.phone)
      }
      return { assignedUserId: userId }
    }

    case 'http_request': {
      const method = payload.method || data.method || 'POST'
      const rawUrl = payload.url || data.url
      if (!rawUrl) {
        throw new Error(`URL HTTP manquante pour le nœud ${node.id}`)
      }

      let url = interpolateVariables(rawUrl, context)

      // Query parameters
      const queryParams = new URLSearchParams()
      if (Array.isArray(payload.queryParams)) {
        for (const q of payload.queryParams) {
          if (q.key) {
            queryParams.append(
              interpolateVariables(q.key, context),
              interpolateVariables(q.value, context)
            )
          }
        }
      }

      // Authentication
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*',
        ...(payload.headers || {}),
      }

      const authType = payload.authType || 'none'
      if (authType === 'bearer') {
        const token = interpolateVariables(payload.authToken || '', context)
        if (token) headers['Authorization'] = `Bearer ${token}`
      } else if (authType === 'basic') {
        const u = interpolateVariables(payload.authUsername || '', context)
        const p = interpolateVariables(payload.authPassword || '', context)
        const base64 = Buffer.from(`${u}:${p}`).toString('base64')
        headers['Authorization'] = `Basic ${base64}`
      } else if (authType === 'header') {
        const hName = interpolateVariables(payload.authHeaderName || '', context)
        const hVal = interpolateVariables(payload.authHeaderValue || '', context)
        if (hName) headers[hName] = hVal
      } else if (authType === 'query') {
        const qName = interpolateVariables(payload.authQueryName || '', context)
        const qVal = interpolateVariables(payload.authQueryValue || '', context)
        if (qName) queryParams.append(qName, qVal)
      }

      // Additional custom headers from list
      if (Array.isArray(payload.headersList)) {
        for (const h of payload.headersList) {
          if (h.key) {
            headers[interpolateVariables(h.key, context)] = interpolateVariables(h.value, context)
          }
        }
      }

      // Append query params to URL if any
      const queryString = queryParams.toString()
      if (queryString) {
        url = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`
      }

      // Request body
      let body: any = undefined
      const contentType = payload.contentType || 'json'

      if (method !== 'GET' && method !== 'HEAD') {
        const rawBody = payload.body || data.body
        if (rawBody) {
          const interpolatedBody = interpolateVariables(rawBody, context)
          if (contentType === 'json') {
            headers['Content-Type'] = 'application/json'
            try {
              body = JSON.stringify(JSON.parse(interpolatedBody))
            } catch {
              body = interpolatedBody
            }
          } else if (contentType === 'form') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            body = interpolatedBody
          } else {
            body = interpolatedBody
          }
        }
      }

      const timeoutMs = payload.timeoutMs || 15000
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const res = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        const responseText = await res.text()
        let responseData: any = responseText
        try {
          responseData = JSON.parse(responseText)
        } catch {
          // Keep string
        }

        const resHeaders: Record<string, string> = {}
        res.headers.forEach((v, k) => {
          resHeaders[k] = v
        })

        return {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          headers: resHeaders,
          data: responseData,
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          throw new Error(`Délai d'attente dépassé (timeout ${timeoutMs}ms) pour la requête HTTP vers ${url}`)
        }
        throw err
      }
    }

    case 'telegram_message': {
      const botToken = interpolateVariables(payload.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '', context).trim()
      const rawChatId = interpolateVariables(payload.telegramChatId || '', context).trim()
      const operation = payload.telegramOperation || 'send_message'

      if (!botToken) {
        throw new Error(
          `Token Telegram Bot manquant pour le nœud ${node.id}. Renseignez votre token de bot obtenu via @BotFather sur Telegram.`
        )
      }
      if (!rawChatId) {
        throw new Error(
          `ID de chat Telegram manquant pour le nœud ${node.id}. Renseignez l'identifiant du chat, groupe ou canal destinataire (ex: -100123456789 ou votre ID personnel via @userinfobot).`
        )
      }

      // Sanitize chatId (support t.me links and whitespace)
      let cleanChatId = rawChatId.trim()
      if (cleanChatId.startsWith('https://t.me/')) {
        cleanChatId = '@' + cleanChatId.replace('https://t.me/', '').replace('/', '')
      } else if (cleanChatId.startsWith('t.me/')) {
        cleanChatId = '@' + cleanChatId.replace('t.me/', '').replace('/', '')
      }

      const baseUrl = `https://api.telegram.org/bot${botToken}`

      if (operation === 'send_message') {
        const defaultText = `🚨 <b>Notification Whatooz</b>\n👤 Client : ${context.contact.name || 'Inconnu'}\n📱 Téléphone : ${context.contact.phone || 'N/A'}\n💬 Message : ${context.message?.text || 'Déclenchement du workflow'}`
        const rawText = payload.telegramText || data.text || defaultText
        const text = interpolateVariables(rawText, context)
        const parseMode = payload.telegramParseMode && payload.telegramParseMode !== 'None' ? payload.telegramParseMode : 'HTML'

        // First try with parse_mode
        let res = await fetch(`${baseUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text,
            ...(parseMode ? { parse_mode: parseMode } : {}),
          }),
        })

        let dataRes = await res.json().catch(() => ({}))

        // If entity parsing failed (e.g. unclosed HTML tags or special characters like < > &), retry in plain text
        if (!dataRes.ok && parseMode && dataRes.description?.toLowerCase().includes('parse')) {
          console.warn('[Workflow Engine] Telegram entity parsing failed, retrying without parse_mode...')
          res = await fetch(`${baseUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              text,
            }),
          })
          dataRes = await res.json().catch(() => ({}))
        }

        if (!dataRes.ok) {
          let extraTip = ''
          if (dataRes.error_code === 400 && dataRes.description?.includes('chat not found')) {
            extraTip = ' Astuce: Assurez-vous d\'avoir cliqué sur /start dans le bot depuis ce compte Telegram, ou d\'avoir ajouté le bot comme administrateur du canal/groupe.'
          } else if (dataRes.error_code === 403) {
            extraTip = ' Astuce: Le bot a été bloqué par ce compte ou n\'a pas l\'autorisation d\'envoyer des messages dans ce canal.'
          } else if (dataRes.error_code === 401) {
            extraTip = ' Astuce: Le token du bot est invalide. Vérifiez le token fourni par @BotFather.'
          }
          throw new Error(`Erreur Telegram (${dataRes.error_code || res.status}): ${dataRes.description || res.statusText}.${extraTip}`)
        }
        return dataRes
      } else if (operation === 'send_photo') {
        const photoUrl = interpolateVariables(payload.telegramMediaUrl || '', context).trim()
        const caption = interpolateVariables(payload.telegramCaption || '', context)
        const parseMode = payload.telegramParseMode && payload.telegramParseMode !== 'None' ? payload.telegramParseMode : undefined

        if (!photoUrl) {
          throw new Error(`URL de la photo manquante pour le nœud Telegram ${node.id}`)
        }

        let res = await fetch(`${baseUrl}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            photo: photoUrl,
            caption: caption || undefined,
            ...(parseMode ? { parse_mode: parseMode } : {}),
          }),
        })

        let dataRes = await res.json().catch(() => ({}))

        // Retry without parse_mode if entity error
        if (!dataRes.ok && parseMode && dataRes.description?.toLowerCase().includes('parse')) {
          res = await fetch(`${baseUrl}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              photo: photoUrl,
              caption: caption || undefined,
            }),
          })
          dataRes = await res.json().catch(() => ({}))
        }

        if (!dataRes.ok) {
          throw new Error(`Erreur Telegram (Photo): ${dataRes.description || res.statusText}`)
        }
        return dataRes
      } else if (operation === 'send_document') {
        const docUrl = interpolateVariables(payload.telegramMediaUrl || '', context).trim()
        const caption = interpolateVariables(payload.telegramCaption || '', context)

        if (!docUrl) {
          throw new Error(`URL du document manquante pour le nœud Telegram ${node.id}`)
        }

        const res = await fetch(`${baseUrl}/sendDocument`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            document: docUrl,
            caption: caption || undefined,
          }),
        })

        const dataRes = await res.json().catch(() => ({}))
        if (!dataRes.ok) {
          throw new Error(`Erreur Telegram (Document): ${dataRes.description || res.statusText}`)
        }
        return dataRes
      }

      throw new Error(`Opération Telegram inconnue: ${operation}`)
    }

    case 'google_sheets': {
      const operation = payload.sheetsOperation || 'append_row'
      const authMode = payload.sheetsAuthMode || 'webhook_url'
      const spreadsheetId = interpolateVariables(payload.sheetsSpreadsheetId || '', context).trim()
      const sheetName = interpolateVariables(payload.sheetsSheetName || 'Feuille 1', context).trim()

      if (authMode === 'webhook_url') {
        const webhookUrl = interpolateVariables(payload.sheetsWebhookUrl || '', context).trim()
        if (!webhookUrl) {
          throw new Error(`URL Webhook Google Apps Script manquante pour le nœud ${node.id}`)
        }

        const rawData = payload.sheetsRowData || '{}'
        const interpolatedData = interpolateVariables(rawData, context)
        let parsedData: any
        try {
          parsedData = JSON.parse(interpolatedData)
        } catch {
          parsedData = { value: interpolatedData }
        }

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: operation,
            spreadsheetId,
            sheetName,
            data: parsedData,
            contact: context.contact,
            timestamp: new Date().toISOString(),
          }),
        })

        const responseText = await res.text()
        let responseData: any = responseText
        try {
          responseData = JSON.parse(responseText)
        } catch {}

        return {
          success: res.ok,
          status: res.status,
          data: responseData,
        }
      } else {
        // Direct Google Sheets API v4
        const token = interpolateVariables(payload.sheetsApiKeyOrToken || process.env.GOOGLE_SHEETS_TOKEN || '', context).trim()
        if (!token) {
          throw new Error(`Token d'accès Google Sheets manquant pour le nœud ${node.id}`)
        }
        if (!spreadsheetId) {
          throw new Error(`ID du tableur Google Spreadsheet manquant pour le nœud ${node.id}`)
        }

        const range = sheetName || 'A1'

        if (operation === 'append_row') {
          const rawData = payload.sheetsRowData || '[]'
          const interpolated = interpolateVariables(rawData, context)
          let rowValues: any[] = []
          try {
            const parsed = JSON.parse(interpolated)
            rowValues = Array.isArray(parsed) ? parsed : Object.values(parsed)
          } catch {
            rowValues = interpolated.split(',').map((s) => s.trim())
          }

          const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [rowValues],
            }),
          })

          const dataRes = await res.json()
          if (!res.ok) {
            throw new Error(`Google Sheets API Error (${res.status}): ${dataRes.error?.message || res.statusText}`)
          }
          return dataRes
        } else if (operation === 'read_rows') {
          const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
          const res = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          const dataRes = await res.json()
          if (!res.ok) {
            throw new Error(`Google Sheets API Error (${res.status}): ${dataRes.error?.message || res.statusText}`)
          }
          return dataRes
        } else if (operation === 'clear') {
          const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          const dataRes = await res.json()
          return dataRes
        }
      }

      return { success: true }
    }

    case 'google_calendar': {
      const token = interpolateVariables(payload.calendarAuthToken || process.env.GOOGLE_CALENDAR_TOKEN || '', context).trim()
      if (!token) {
        throw new Error(`Token d'accès Google Calendar manquant pour le nœud ${node.id}`)
      }

      const calendarId = interpolateVariables(payload.calendarId || 'primary', context).trim()
      const operation = payload.calendarOperation || 'create_event'
      const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

      if (operation === 'create_event') {
        const summary = interpolateVariables(payload.calendarSummary || 'Rendez-vous Whatooz', context)
        const description = interpolateVariables(payload.calendarDescription || '', context)
        const startTimeRaw = interpolateVariables(payload.calendarStartTime || '', context).trim()
        const endTimeRaw = interpolateVariables(payload.calendarEndTime || '', context).trim()
        const attendeeEmail = interpolateVariables(payload.calendarAttendeeEmail || '', context).trim()

        const startDateTime = startTimeRaw ? new Date(startTimeRaw).toISOString() : new Date(Date.now() + 3600000).toISOString()
        const endDateTime = endTimeRaw ? new Date(endTimeRaw).toISOString() : new Date(Date.now() + 7200000).toISOString()

        const eventPayload: any = {
          summary,
          description,
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime },
        }

        if (attendeeEmail) {
          eventPayload.attendees = [{ email: attendeeEmail }]
        }

        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        })

        const dataRes = await res.json()
        if (!res.ok) {
          throw new Error(`Google Calendar API Error (${res.status}): ${dataRes.error?.message || res.statusText}`)
        }
        return dataRes
      } else if (operation === 'list_events') {
        const res = await fetch(`${baseUrl}?maxResults=10&singleEvents=true&orderBy=startTime`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const dataRes = await res.json()
        if (!res.ok) {
          throw new Error(`Google Calendar API Error: ${dataRes.error?.message || res.statusText}`)
        }
        return dataRes
      }

      throw new Error(`Opération Google Calendar inconnue: ${operation}`)
    }

    case 'notion': {
      const apiKey = interpolateVariables(payload.notionApiKey || process.env.NOTION_API_KEY || '', context).trim()
      if (!apiKey) {
        throw new Error(`Clé API Notion manquante pour le nœud ${node.id}`)
      }

      const operation = payload.notionOperation || 'create_page'
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      }

      if (operation === 'create_page') {
        const databaseId = interpolateVariables(payload.notionDatabaseId || '', context).trim()
        const pageTitle = interpolateVariables(payload.notionPageTitle || `Lead: ${context.contact.name || context.contact.phone}`, context)
        const rawProps = payload.notionPropertiesJson || '{}'
        const interpolatedProps = interpolateVariables(rawProps, context)

        let customProperties: Record<string, any> = {}
        try {
          customProperties = JSON.parse(interpolatedProps)
        } catch {}

        const pagePayload: any = {
          parent: databaseId ? { database_id: databaseId } : undefined,
          properties: {
            Name: {
              title: [{ text: { content: pageTitle } }],
            },
            ...customProperties,
          },
        }

        if (!databaseId) {
          throw new Error(`Database ID Notion manquant pour créer une page`)
        }

        const res = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify(pagePayload),
        })

        const dataRes = await res.json()
        if (!res.ok) {
          throw new Error(`Notion API Error (${res.status}): ${dataRes.message || res.statusText}`)
        }
        return dataRes
      } else if (operation === 'append_block') {
        const pageOrBlockId = interpolateVariables(payload.notionPageId || '', context).trim()
        const content = interpolateVariables(payload.notionContent || '', context)

        if (!pageOrBlockId) {
          throw new Error(`ID de page ou bloc Notion manquant`)
        }

        const blockPayload = {
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content } }],
              },
            },
          ],
        }

        const res = await fetch(`https://api.notion.com/v1/blocks/${pageOrBlockId}/children`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(blockPayload),
        })

        const dataRes = await res.json()
        if (!res.ok) {
          throw new Error(`Notion API Error: ${dataRes.message || res.statusText}`)
        }
        return dataRes
      } else if (operation === 'query_database') {
        const databaseId = interpolateVariables(payload.notionDatabaseId || '', context).trim()
        if (!databaseId) {
          throw new Error(`Database ID Notion manquant`)
        }

        const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ page_size: 10 }),
        })

        const dataRes = await res.json()
        if (!res.ok) {
          throw new Error(`Notion API Error: ${dataRes.message || res.statusText}`)
        }
        return dataRes
      }

      throw new Error(`Opération Notion non supportée: ${operation}`)
    }

    default:
      console.warn(`[Workflow Engine] Unhandled action type: ${actionType}`)
      return { warning: `Type d'action non géré: ${actionType}` }
  }
}

/**
 * Helper to log an outbound message in conversations/messages table.
 */
async function logOutboundMessage(
  context: WorkflowExecutionContext,
  text: string,
  type: string,
  wamid: string
) {
  // Find conversation
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('organization_id', context.organizationId)
    .eq('contact_phone', context.contact.phone)
    .maybeSingle()

  if (conv?.id) {
    await supabaseAdmin.from('messages').insert({
      conversation_id: conv.id,
      direction: 'outbound',
      message_type: type,
      content_text: text,
      wamid,
      status: 'sent',
      created_at: new Date().toISOString(),
    })

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: text.slice(0, 200),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conv.id)
  }
}

/**
 * Execute an entire automation workflow (Graph DAG traversal, n8n-style).
 */
export async function executeAutomationWorkflow(
  automation: {
    id: string
    name: string
    nodes?: BuilderNode[]
    edges?: BuilderEdge[]
    action_type?: string
    action_payload?: any
  },
  context: WorkflowExecutionContext,
  config: WorkflowEngineConfig
): Promise<WorkflowExecutionContext> {
  const nodes = automation.nodes || []
  const edges = automation.edges || []
  if (!context.variables) context.variables = {}

  console.log(`[Workflow Engine] Starting execution of automation "${automation.name}" (${automation.id}) with ${nodes.length} nodes and ${edges.length} edges`)

  // If no canvas nodes exist, fallback to legacy single action execution
  if (nodes.length === 0) {
    if (automation.action_type) {
      const mockNode: BuilderNode = {
        id: 'legacy-root',
        type: 'actionNode',
        position: { x: 0, y: 0 },
        data: {
          label: automation.name,
          actionType: (automation.action_type === 'send_text' ? 'send_message' : automation.action_type) as any,
          actionPayload: automation.action_payload,
        },
      }
      try {
        const out = await executeActionNode(mockNode, context, config)
        context.logs.push({
          nodeId: mockNode.id,
          nodeType: 'actionNode',
          action: automation.action_type,
          status: 'success',
          output: out,
          timestamp: new Date().toISOString(),
        })
      } catch (err: any) {
        context.logs.push({
          nodeId: mockNode.id,
          nodeType: 'actionNode',
          action: automation.action_type,
          status: 'failed',
          error: err.message,
          timestamp: new Date().toISOString(),
        })
      }
    }
    return context
  }

  // 1. Find trigger node
  const triggerNode = nodes.find((n) => n.type === 'triggerNode')
  if (!triggerNode) {
    console.warn(`[Workflow Engine] No trigger node found in automation ${automation.id}`)
    return context
  }

  // 2. Traversal queue starting with outgoing nodes from trigger
  const queue: Array<{ nodeId: string; parentOutputHandle?: string }> = []
  const initialEdges = edges.filter((e) => e.source === triggerNode.id)

  for (const edge of initialEdges) {
    queue.push({ nodeId: edge.target, parentOutputHandle: edge.sourceHandle || undefined })
  }

  const visitedCount = new Map<string, number>()
  const MAX_STEP_LIMIT = 50 // prevent infinite loops
  let totalSteps = 0

  while (queue.length > 0 && totalSteps < MAX_STEP_LIMIT) {
    totalSteps++
    const { nodeId } = queue.shift()!
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) continue

    const count = visitedCount.get(nodeId) || 0
    if (count > 5) {
      console.warn(`[Workflow Engine] Node ${nodeId} loop threshold reached, stopping branch`)
      continue
    }
    visitedCount.set(nodeId, count + 1)

    // Execute according to node type
    if (node.type === 'actionNode') {
      try {
        const output = await executeActionNode(node, context, config)
        context.steps[node.id] = output
        context.logs.push({
          nodeId: node.id,
          nodeType: 'actionNode',
          action: (node.data as any).actionType || 'action',
          status: 'success',
          output,
          timestamp: new Date().toISOString(),
        })

        // Queue all downstream nodes
        const outgoing = edges.filter((e) => e.source === node.id)
        for (const edge of outgoing) {
          queue.push({ nodeId: edge.target })
        }
      } catch (err: any) {
        console.error(`[Workflow Engine] Error executing action node ${node.id}:`, err)
        context.logs.push({
          nodeId: node.id,
          nodeType: 'actionNode',
          action: (node.data as any).actionType || 'action',
          status: 'failed',
          error: err.message,
          timestamp: new Date().toISOString(),
        })
        // Break this branch on failure
        continue
      }
    } else if (node.type === 'conditionNode') {
      const isTrue = evaluateCondition(node, context)
      context.steps[node.id] = { result: isTrue }
      context.logs.push({
        nodeId: node.id,
        nodeType: 'conditionNode',
        action: 'condition',
        status: 'success',
        output: { result: isTrue },
        timestamp: new Date().toISOString(),
      })

      // Downstream edges: filter by handle 'true' vs 'false'
      const outgoing = edges.filter((e) => e.source === node.id)
      for (const edge of outgoing) {
        if (isTrue && (edge.sourceHandle === 'true' || !edge.sourceHandle)) {
          queue.push({ nodeId: edge.target, parentOutputHandle: 'true' })
        } else if (!isTrue && edge.sourceHandle === 'false') {
          queue.push({ nodeId: edge.target, parentOutputHandle: 'false' })
        }
      }
    } else if (node.type === 'delayNode') {
      const delayMinutes = (node.data as any).delayMinutes || 0
      const delaySeconds = (node.data as any).delaySeconds || delayMinutes * 60

      context.logs.push({
        nodeId: node.id,
        nodeType: 'delayNode',
        action: 'delay',
        status: 'success',
        output: { delaySeconds },
        timestamp: new Date().toISOString(),
      })

      // For reasonable delays (<= 20 seconds), sleep synchronously
      if (delaySeconds > 0 && delaySeconds <= 20) {
        console.log(`[Workflow Engine] Waiting ${delaySeconds} seconds before continuing workflow...`)
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
      }

      // Queue all downstream nodes
      const outgoing = edges.filter((e) => e.source === node.id)
      for (const edge of outgoing) {
        queue.push({ nodeId: edge.target })
      }
    }
  }

  // Update automation execution counter
  try {
    const { error: rpcErr } = await supabaseAdmin.rpc('increment_automation_executions', {
      automation_id: automation.id,
    })
    if (rpcErr) {
      // Fallback manual increment
      const { data: current } = await supabaseAdmin
        .from('automations')
        .select('executions_count')
        .eq('id', automation.id)
        .single()
      await supabaseAdmin
        .from('automations')
        .update({
          executions_count: (current?.executions_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', automation.id)
    }
  } catch (err) {
    console.error('[Workflow Engine] Failed to increment execution count:', err)
  }

  console.log(`[Workflow Engine] Finished execution of "${automation.name}". Steps executed: ${context.logs.length}`)
  return context
}
