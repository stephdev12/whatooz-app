/**
 * Meta WhatsApp Cloud API client — simplified from WaCRM.
 *
 * All functions use named parameters to avoid the swapped-args bugs
 * that plagued positional signatures.
 */

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// ============================================================
// Error handling
// ============================================================

interface MetaErrorResponse {
  error?: {
    message?: string
    code?: number
    type?: string
    error_subcode?: number
    error_user_title?: string
    error_user_msg?: string
    error_data?: { details?: string; [key: string]: any }
    fbtrace_id?: string
  }
}

async function throwMetaError(
  response: Response,
  fallback: string
): Promise<never> {
  let message = fallback
  try {
    const data = (await response.json()) as MetaErrorResponse
    console.error(`[Meta API Error HTTP ${response.status}]`, JSON.stringify(data, null, 2))
    if (data.error) {
      const parts: string[] = []
      if (data.error.message) parts.push(data.error.message)
      if (data.error.error_user_title) parts.push(`(${data.error.error_user_title})`)
      if (data.error.error_user_msg) parts.push(data.error.error_user_msg)
      if (data.error.error_data?.details) parts.push(`Détails: ${data.error.error_data.details}`)
      if (parts.length > 0) message = parts.join(' — ')
    }
  } catch (err) {
    console.error('[Meta API Error could not be parsed as JSON]', err)
  }
  throw new Error(message)
}

// ============================================================
// Phone number verification
// ============================================================

export interface MetaPhoneInfo {
  id: string
  display_phone_number: string
  verified_name?: string
  quality_rating?: string
}

export async function verifyPhoneNumber(args: {
  phoneNumberId: string
  accessToken: string
}): Promise<MetaPhoneInfo> {
  const { phoneNumberId, accessToken } = args
  const url = `${META_API_BASE}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`)
  }
  return response.json()
}

// ============================================================
// Send text message
// ============================================================

export interface MetaSendResult {
  messageId: string
}

export async function sendTextMessage(args: {
  phoneNumberId: string
  accessToken: string
  to: string
  text: string
}): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, text } = args
  const url = `${META_API_BASE}/${phoneNumberId}/messages`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  })
  if (!response.ok) {
    await throwMetaError(response, 'Failed to send text message')
  }
  const data = await response.json()
  return { messageId: data.messages?.[0]?.id ?? '' }
}

// ============================================================
// Send template message
// ============================================================

export async function sendTemplateMessage(args: {
  phoneNumberId: string
  accessToken: string
  to: string
  templateName: string
  languageCode: string
  components?: Array<Record<string, unknown>>
}): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, templateName, languageCode, components } = args
  const url = `${META_API_BASE}/${phoneNumberId}/messages`

  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: languageCode },
  }
  if (components?.length) {
    template.components = components
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template,
    }),
  })
  if (!response.ok) {
    await throwMetaError(response, 'Failed to send template message')
  }
  const data = await response.json()
  return { messageId: data.messages?.[0]?.id ?? '' }
}

// ============================================================
// Send media message
// ============================================================

export type MediaKind = 'image' | 'video' | 'document' | 'audio'

export async function sendMediaMessage(args: {
  phoneNumberId: string
  accessToken: string
  to: string
  mediaKind: MediaKind
  mediaUrl: string
  caption?: string
  filename?: string
}): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, mediaKind, mediaUrl, caption, filename } = args
  const url = `${META_API_BASE}/${phoneNumberId}/messages`

  const mediaPayload: Record<string, string> = { link: mediaUrl }
  if (caption) mediaPayload.caption = caption
  if (filename && mediaKind === 'document') mediaPayload.filename = filename

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: mediaKind,
      [mediaKind]: mediaPayload,
    }),
  })
  if (!response.ok) {
    await throwMetaError(response, `Failed to send ${mediaKind} message`)
  }
  const data = await response.json()
  return { messageId: data.messages?.[0]?.id ?? '' }
}

// ============================================================
// Template management (CRUD via Graph API)
// ============================================================

export interface MetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  buttons?: Array<Record<string, unknown>>
  example?: {
    header_text?: string[]
    body_text?: string[][]
  }
  [key: string]: unknown
}

export interface MetaTemplate {
  id: string
  name: string
  language: string
  status: string
  category: string
  components?: MetaTemplateComponent[]
  quality_score?: { score: string }
}

/**
 * List all message templates for a WhatsApp Business Account.
 */
export async function listTemplates(args: {
  wabaId: string
  accessToken: string
}): Promise<MetaTemplate[]> {
  const { wabaId, accessToken } = args
  const url = `${META_API_BASE}/${wabaId}/message_templates?fields=id,name,language,status,category,components,quality_score&limit=100`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de récupération des templates depuis Meta')
  }
  const data = await response.json()
  return data.data ?? []
}

// ============================================================
// Resumable Upload (Media handles for template headers)
// ============================================================

export interface UploadResumableMediaArgs {
  appId: string
  accessToken: string
  fileName: string
  mimeType: string
  bytes: Uint8Array
}

/**
 * Upload a file via Meta Resumable Upload API and return the media handle
 * required for template media headers (example.header_handle).
 */
export async function uploadResumableMedia(
  args: UploadResumableMediaArgs
): Promise<{ handle: string }> {
  const { appId, accessToken, fileName, mimeType, bytes } = args

  // Step 1 — start upload session
  const startParams = new URLSearchParams({
    file_name: fileName,
    file_length: String(bytes.byteLength),
    file_type: mimeType,
    access_token: accessToken,
  })
  const startRes = await fetch(
    `${META_API_BASE}/${appId}/uploads?${startParams.toString()}`,
    { method: 'POST' }
  )
  if (!startRes.ok) {
    await throwMetaError(startRes, `Échec de l'initialisation de l'upload d'image sur Meta`)
  }
  const startData = (await startRes.json()) as { id?: string }
  if (!startData.id) {
    throw new Error('Resumable upload n’a pas retourné de session id.')
  }

  // Step 2 — upload file bytes
  const uploadRes = await fetch(`${META_API_BASE}/${startData.id}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${accessToken}`,
      file_offset: '0',
    },
    body: bytes as unknown as BodyInit,
  })
  if (!uploadRes.ok) {
    await throwMetaError(uploadRes, `Échec du téléversement du média sur Meta`)
  }
  const uploadData = (await uploadRes.json()) as { h?: string }
  if (!uploadData.h) {
    throw new Error('Resumable upload n’a pas retourné de handle de fichier.')
  }
  return { handle: uploadData.h }
}

/**
 * Download an image URL or process raw bytes and generate a Meta Resumable Upload handle.
 */
export async function getHeaderHandleForImage(args: {
  appId: string
  accessToken: string
  imageUrl?: string
  imageBytes?: Uint8Array
  mimeType?: string
}): Promise<string> {
  const { appId, accessToken, imageUrl, imageBytes, mimeType = 'image/jpeg' } = args

  let bytes = imageBytes
  let resolvedMime = mimeType

  if (!bytes && imageUrl) {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      throw new Error(`Impossible de télécharger l'image d'exemple depuis l'URL (${res.status})`)
    }
    const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase()
    if (contentType.includes('png')) resolvedMime = 'image/png'
    else resolvedMime = 'image/jpeg'
    bytes = new Uint8Array(await res.arrayBuffer())
  }

  if (!bytes || bytes.byteLength === 0) {
    throw new Error('Aucun contenu image fourni pour l’en-tête du template.')
  }

  const fileName = resolvedMime === 'image/png' ? 'header.png' : 'header.jpg'
  const { handle } = await uploadResumableMedia({
    appId,
    accessToken,
    fileName,
    mimeType: resolvedMime,
    bytes,
  })
  return handle
}

/**
 * Create a new message template.
 */
export async function createTemplate(args: {
  wabaId: string
  accessToken: string
  name: string
  language: string
  category: string
  components: Array<Record<string, unknown>>
}): Promise<{ id: string; status: string; category?: string }> {
  const { wabaId, accessToken, name, language, category, components } = args
  const url = `${META_API_BASE}/${wabaId}/message_templates`

  // Format components and inject auto-examples for variables if not provided
  const formattedComponents = components.map((comp) => {
    if (comp.type === 'BODY' && typeof comp.text === 'string') {
      const variableMatches = comp.text.match(/\{\{(\d+)\}\}/g)
      if (variableMatches && variableMatches.length > 0 && !comp.example) {
        const samples = variableMatches.map((_, i) => `Exemple${i + 1}`)
        return {
          ...comp,
          example: {
            body_text: [samples],
          },
        }
      }
    }
    return comp
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, language, category, components: formattedComponents }),
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de création du template sur Meta')
  }
  const data = await response.json()
  return {
    id: String(data.id),
    status: typeof data.status === 'string' ? data.status : 'PENDING',
    category: typeof data.category === 'string' ? data.category : category,
  }
}

/**
 * Update an existing message template on Meta.
 * Meta Graph API: POST /{template_id}
 */
export async function updateTemplate(args: {
  templateId: string
  accessToken: string
  components: Array<Record<string, unknown>>
}): Promise<{ success: boolean }> {
  const { templateId, accessToken, components } = args
  const url = `${META_API_BASE}/${templateId}`

  const formattedComponents = components.map((comp) => {
    if (comp.type === 'BODY' && typeof comp.text === 'string') {
      const variableMatches = comp.text.match(/\{\{(\d+)\}\}/g)
      if (variableMatches && variableMatches.length > 0 && !comp.example) {
        const samples = variableMatches.map((_, i) => `Exemple${i + 1}`)
        return {
          ...comp,
          example: {
            body_text: [samples],
          },
        }
      }
    }
    return comp
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ components: formattedComponents }),
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de la modification du template sur Meta')
  }
  return { success: true }
}

/**
 * Delete a message template by name.
 */
export async function deleteTemplate(args: {
  wabaId: string
  accessToken: string
  templateName: string
  hsmId?: string
}): Promise<void> {
  const { wabaId, accessToken, templateName, hsmId } = args
  const params = new URLSearchParams({ name: templateName })
  if (hsmId) params.set('hsm_id', hsmId)

  const url = `${META_API_BASE}/${wabaId}/message_templates?${params.toString()}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (response.status === 404) return
  if (!response.ok) {
    await throwMetaError(response, 'Échec de suppression du template sur Meta')
  }
}

// ============================================================
// Mark messages as read
// ============================================================

export async function markAsRead(args: {
  phoneNumberId: string
  accessToken: string
  messageId: string
}): Promise<void> {
  const { phoneNumberId, accessToken, messageId } = args
  const url = `${META_API_BASE}/${phoneNumberId}/messages`
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  })
}

// ============================================================
// WhatsApp Embedded Signup & OAuth Helpers
// ============================================================

export interface MetaTokenExchangeResult {
  access_token: string
  token_type?: string
  expires_in?: number
}

/**
 * Exchange the short-lived authorization code from Embedded Signup
 * for a business access token.
 */
export async function exchangeCodeForToken(args: {
  code: string
  redirectUri?: string
}): Promise<MetaTokenExchangeResult> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('META_APP_ID ou META_APP_SECRET manquant dans les variables d’environnement')
  }

  const url = new URL(`${META_API_BASE}/oauth/access_token`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('code', args.code)
  if (args.redirectUri) {
    url.searchParams.set('redirect_uri', args.redirectUri)
  }

  const response = await fetch(url.toString(), { method: 'GET' })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de l’échange du code OAuth Meta')
  }

  return response.json()
}

export interface GranularScope {
  scope: string
  target_ids?: string[]
}

export interface DebugTokenResult {
  app_id: string
  is_valid: boolean
  user_id?: string
  granular_scopes?: GranularScope[]
}

/**
 * Inspect an access token to discover associated WABA IDs.
 */
export async function debugTokenInfo(args: {
  inputToken: string
}): Promise<DebugTokenResult> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  const url = `${META_API_BASE}/debug_token?input_token=${encodeURIComponent(
    args.inputToken
  )}&access_token=${appId}|${appSecret}`

  const response = await fetch(url)
  if (!response.ok) {
    await throwMetaError(response, 'Échec de vérification du jeton Meta debug_token')
  }

  const json = await response.json()
  return json.data
}

/**
 * Fetch phone numbers associated with a WABA.
 */
export async function getWabaPhoneNumbers(args: {
  wabaId: string
  accessToken: string
}): Promise<MetaPhoneInfo[]> {
  const { wabaId, accessToken } = args
  const url = `${META_API_BASE}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de récupération des numéros de téléphone du WABA')
  }
  const json = await response.json()
  return json.data || []
}

/**
 * Fetch Meta user profile information (ID, name, email).
 */
export async function getMetaUserProfile(args: {
  accessToken: string
}): Promise<{ id: string; name?: string; email?: string }> {
  const url = `${META_API_BASE}/me?fields=id,name,email`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de récupération du profil Meta')
  }
  return response.json()
}

// ============================================================
// WhatsApp Flows (Meta Native Flows API)
// ============================================================

export interface MetaFlow {
  id: string
  name: string
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED'
  categories?: string[]
  validation_errors?: Array<{ error: string }>
}

/**
 * List WhatsApp Flows associated with a WABA.
 */
export async function listWabaFlows(args: {
  wabaId: string
  accessToken: string
}): Promise<MetaFlow[]> {
  const { wabaId, accessToken } = args
  const url = `${META_API_BASE}/${wabaId}/flows?fields=id,name,status,categories,validation_errors`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de récupération des Flows depuis Meta')
  }
  const json = await response.json()
  return json.data || []
}

/**
 * Get detailed information and flow_json for a specific Meta Flow.
 */
export async function getWabaFlowDetails(args: {
  flowId: string
  accessToken: string
}): Promise<MetaFlow & { flow_json?: string | Record<string, any> }> {
  const { flowId, accessToken } = args
  const url = `${META_API_BASE}/${flowId}?fields=id,name,status,categories,validation_errors,flow_json`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de récupération des détails du Flow Meta')
  }
  return response.json()
}

export const VALID_META_FLOW_CATEGORIES = [
  'SIGN_UP',
  'SIGN_IN',
  'APPOINTMENT_BOOKING',
  'LEAD_GENERATION',
  'CONTACT_US',
  'CUSTOMER_SUPPORT',
  'SURVEY',
  'OTHER',
] as const

/**
 * Recursively strip properties not permitted by Meta Flow JSON schema.
 * e.g., 'placeholder' is not allowed on TextInput/TextArea in Meta Flows schema;
 * convert it to 'helper-text' if helper-text is not already present, and delete 'placeholder'.
 */
export function sanitizeMetaFlowJson(jsonObj: any): any {
  if (!jsonObj || typeof jsonObj !== 'object') return jsonObj

  if (Array.isArray(jsonObj)) {
    return jsonObj.map(sanitizeMetaFlowJson)
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(jsonObj)) {
    if (key === '_ui_meta') continue

    if (key === 'placeholder') {
      // In Meta Flows, TextInput and TextArea do not accept 'placeholder'.
      // If 'helper-text' doesn't exist on this object, map it to 'helper-text'.
      if (!('helper-text' in jsonObj) && typeof value === 'string' && value.trim()) {
        result['helper-text'] = value.trim()
      }
      // Omit 'placeholder'
      continue
    }

    result[key] = sanitizeMetaFlowJson(value)
  }

  // Second pass on top-level Flow JSON: ensure navigate actions have matching fields in the target screen's data model
  if (result.screens && Array.isArray(result.screens)) {
    const screensList = result.screens as any[]
    screensList.forEach((screen) => {
      const findNavigateActions = (node: any) => {
        if (!node || typeof node !== 'object') return
        const action = node['on-click-action']
        if (action && action.name === 'navigate') {
          const targetScreenName = action.next?.name
          const payload = action.payload
          if (targetScreenName && payload && typeof payload === 'object') {
            const targetScreen = screensList.find((s) => s.id === targetScreenName)
            if (targetScreen) {
              if (!targetScreen.data || typeof targetScreen.data !== 'object' || Array.isArray(targetScreen.data)) {
                targetScreen.data = {}
              }
              for (const payloadKey of Object.keys(payload)) {
                if (!(payloadKey in targetScreen.data)) {
                  targetScreen.data[payloadKey] = {
                    type: 'string',
                    __example__: 'valeur',
                  }
                }
              }
            }
          }
        }
        if (Array.isArray(node.children)) {
          node.children.forEach(findNavigateActions)
        }
      }

      if (screen.layout) {
        findNavigateActions(screen.layout)
      }
    })
  }

  return result
}

/**
 * Create a new Flow on Meta.
 */
export async function createWabaFlow(args: {
  wabaId: string
  accessToken: string
  name: string
  categories?: string[]
  flowJson?: Record<string, unknown> | string
  publish?: boolean
}): Promise<{ id: string; validation_errors?: any[] }> {
  const { wabaId, accessToken, name, categories = ['OTHER'], flowJson, publish = false } = args
  const url = `${META_API_BASE}/${wabaId}/flows`

  // Ensure all categories are strictly recognized by Meta
  const sanitizedCategories = (categories && categories.length > 0 ? categories : ['OTHER'])
    .map((cat) => {
      const upper = String(cat).trim().toUpperCase()
      return VALID_META_FLOW_CATEGORIES.includes(upper as any) ? upper : 'OTHER'
    })
    // Deduplicate
    .filter((value, index, self) => self.indexOf(value) === index)

  const payload: Record<string, unknown> = {
    name,
    categories: sanitizedCategories.length > 0 ? sanitizedCategories : ['OTHER'],
  }
  if (flowJson) {
    let cleanJson: any
    try {
      cleanJson = typeof flowJson === 'string' ? JSON.parse(flowJson) : JSON.parse(JSON.stringify(flowJson))
      if (cleanJson && typeof cleanJson === 'object' && '_ui_meta' in cleanJson) {
        delete cleanJson._ui_meta
      }
    } catch {
      cleanJson = flowJson
    }
    cleanJson = sanitizeMetaFlowJson(cleanJson)
    payload.flow_json = typeof cleanJson === 'string' ? cleanJson : JSON.stringify(cleanJson)
    payload.publish = publish
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de la création du Flow sur Meta')
  }
  const data = await response.json()
  if (data.validation_errors && Array.isArray(data.validation_errors) && data.validation_errors.length > 0) {
    console.error('[Meta validation_errors]', JSON.stringify(data.validation_errors, null, 2))
    const errorDetails = data.validation_errors
      .map((e: any) => {
        const parts: string[] = []
        if (e.error) parts.push(e.error)
        if (e.message) parts.push(e.message)
        if (e.propertyName) parts.push(`propriété: "${e.propertyName}"`)
        if (e.errorPath) parts.push(`chemin: "${e.errorPath}"`)
        if (e.pointers && Array.isArray(e.pointers)) {
          const paths = e.pointers.map((p: any) => p.path || JSON.stringify(p)).filter(Boolean)
          if (paths.length > 0) parts.push(`chemin: ${paths.join(', ')}`)
        }
        return parts.length > 0 ? parts.join(' — ') : JSON.stringify(e)
      })
      .join('; ')
    throw new Error(`Erreur de validation du schéma Flow par Meta : ${errorDetails}`)
  }
  return data
}

/**
 * Upload flow.json assets specification to Meta.
 */
export async function updateWabaFlowJson(args: {
  flowId: string
  accessToken: string
  flowJson: Record<string, unknown>
}): Promise<{ success: boolean; validation_errors?: any[] }> {
  const { flowId, accessToken, flowJson } = args
  const url = `${META_API_BASE}/${flowId}/assets`

  let cleanJson: any
  try {
    cleanJson = typeof flowJson === 'string' ? JSON.parse(flowJson) : JSON.parse(JSON.stringify(flowJson))
    if (cleanJson && typeof cleanJson === 'object' && '_ui_meta' in cleanJson) {
      delete cleanJson._ui_meta
    }
  } catch {
    cleanJson = flowJson
  }
  cleanJson = sanitizeMetaFlowJson(cleanJson)

  const formData = new FormData()
  const jsonString = typeof cleanJson === 'string' ? cleanJson : JSON.stringify(cleanJson)
  const blob = new Blob([jsonString], { type: 'application/json' })
  formData.append('file', blob, 'flow.json')
  formData.append('name', 'flow.json')
  formData.append('asset_type', 'FLOW_JSON')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    await throwMetaError(response, 'Échec du téléversement du JSON du Flow sur Meta')
  }

  const data = await response.json()
  if (data.validation_errors && Array.isArray(data.validation_errors) && data.validation_errors.length > 0) {
    console.error('[Meta validation_errors in updateWabaFlowJson]', JSON.stringify(data.validation_errors, null, 2))
    const errorDetails = data.validation_errors
      .map((e: any) => {
        const parts: string[] = []
        if (e.error) parts.push(e.error)
        if (e.message) parts.push(e.message)
        if (e.propertyName) parts.push(`propriété: "${e.propertyName}"`)
        if (e.errorPath) parts.push(`chemin: "${e.errorPath}"`)
        if (e.pointers && Array.isArray(e.pointers)) {
          const paths = e.pointers.map((p: any) => p.path || JSON.stringify(p)).filter(Boolean)
          if (paths.length > 0) parts.push(`chemin: ${paths.join(', ')}`)
        }
        return parts.length > 0 ? parts.join(' — ') : JSON.stringify(e)
      })
      .join('; ')
    throw new Error(`Erreur de validation du schéma Flow par Meta : ${errorDetails}`)
  }

  return data
}

/**
 * Publish a Flow on Meta.
 */
export async function publishWabaFlow(args: {
  flowId: string
  accessToken: string
}): Promise<{ success: boolean }> {
  const { flowId, accessToken } = args
  const url = `${META_API_BASE}/${flowId}/publish`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de la publication du Flow sur Meta')
  }
  return response.json()
}

/**
 * Delete or deprecate a Flow on Meta.
 */
export async function deleteWabaFlow(args: {
  flowId: string
  accessToken: string
}): Promise<{ success: boolean }> {
  const { flowId, accessToken } = args
  const url = `${META_API_BASE}/${flowId}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    await throwMetaError(response, 'Échec de la suppression du Flow sur Meta')
  }
  return response.json()
}

export interface SendFlowMessageArgs {
  phoneNumberId: string
  accessToken: string
  to: string
  flowId: string
  flowCta: string
  bodyText: string
  headerText?: string
  headerImageUrl?: string
  footerText?: string
  screen?: string
  flowToken?: string
  flowActionPayload?: Record<string, unknown>
}

/**
 * Send an interactive WhatsApp Flow message.
 */
export async function sendFlowMessage(args: SendFlowMessageArgs): Promise<MetaSendResult> {
  const {
    phoneNumberId,
    accessToken,
    to,
    flowId,
    flowCta,
    bodyText,
    headerText,
    headerImageUrl,
    footerText,
    screen = 'INIT',
    flowToken = `flow_${Date.now()}`,
    flowActionPayload,
  } = args

  const createPayload = (targetScreen: string) => {
    const interactive: Record<string, unknown> = {
      type: 'flow',
      body: { text: bodyText },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: flowId,
          flow_cta: flowCta,
          flow_action: 'navigate',
          flow_action_payload: {
            screen: targetScreen,
            ...flowActionPayload,
          },
        },
      },
    }

    if (headerImageUrl) {
      interactive.header = {
        type: 'image',
        image: { link: headerImageUrl },
      }
    } else if (headerText) {
      interactive.header = { type: 'text', text: headerText }
    }
    if (footerText) {
      interactive.footer = { text: footerText }
    }

    return JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive,
    })
  }

  const url = `${META_API_BASE}/${phoneNumberId}/messages`
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: createPayload(screen),
  })

  if (!response.ok) {
    // Check if Meta specifies the exact allowed screen (e.g. "Allowed screen name is: QUESTION_ONE")
    try {
      const errorJson = await response.clone().json()
      const errorStr = JSON.stringify(errorJson)
      const match = errorStr.match(/Allowed screen name is:\s*([A-Za-z0-9_]+)/i)
      if (match && match[1] && match[1] !== screen) {
        console.log(`[sendFlowMessage] Auto-recovering: Meta requires screen "${match[1]}" (was "${screen}"). Retrying...`)
        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: createPayload(match[1]),
        })
      }
    } catch {
      // Proceed to throwMetaError
    }
  }

  if (!response.ok) {
    await throwMetaError(response, 'Échec de l’envoi du WhatsApp Flow')
  }

  const data = await response.json()
  return { messageId: data.messages?.[0]?.id ?? '' }
}




