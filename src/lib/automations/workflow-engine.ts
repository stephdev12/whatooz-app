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
  const recipientPhone = context.contact.phone

  if (!recipientPhone) {
    throw new Error(`Aucun numéro de téléphone destinataire fourni pour le nœud ${node.id}`)
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
      const amount = payload.amount || data.paymentAmount || 1000
      const message = interpolateVariables(payload.message || data.paymentMessage || `Veuillez régler votre paiement de {{ amount }} FCFA via ce lien :`, context)
      
      // Generate SasPay checkout link via internal payment API or direct payload
      const checkoutUrl = `https://saspay.me/pay?org=${context.organizationId}&amount=${amount}&ref=${encodeURIComponent(recipientPhone)}`
      const fullText = `${message}\n\n👉 Lien de paiement : ${checkoutUrl}`

      const res = await sendTextMessage({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        to: recipientPhone,
        text: fullText,
      })

      if (!context.variables) context.variables = {}
      context.variables.payment_url = checkoutUrl
      context.variables.payment_amount = amount

      try {
        await logOutboundMessage(context, fullText, 'text', res.messageId)
      } catch (err) {
        console.error('[Workflow Engine] Failed to log outbound payment in DB:', err)
      }

      return { ...res, checkoutUrl, amount }
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

      const url = interpolateVariables(rawUrl, context)
      const rawBody = payload.body || data.body
      let body: string | undefined

      if (rawBody && method !== 'GET') {
        body = interpolateVariables(rawBody, context)
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(payload.headers || {}),
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      })

      const responseText = await res.text()
      let responseData: any = responseText
      try {
        responseData = JSON.parse(responseText)
      } catch {
        // Non-JSON response
      }

      return {
        status: res.status,
        ok: res.ok,
        data: responseData,
      }
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
