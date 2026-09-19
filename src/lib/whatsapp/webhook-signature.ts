import crypto from 'crypto'

/**
 * Verify the HMAC-SHA256 signature Meta attaches to webhook POSTs.
 * Reference: WaCRM / Meta Webhooks documentation
 */
export function verifyWebhookSignature(args: {
  signature: string | null
  body: string
}): boolean {
  const { signature, body } = args
  const secret = process.env.META_APP_SECRET

  if (!secret) {
    console.error(
      '[Webhook] META_APP_SECRET is not set — rejecting webhook. Configure META_APP_SECRET in .env.local.'
    )
    return false
  }

  if (!signature) {
    console.warn('[Webhook] Missing x-hub-signature-256 header.')
    return false
  }

  if (!signature.startsWith('sha256=')) {
    console.warn('[Webhook] Signature does not start with sha256=')
    return false
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(body).digest('hex')

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)

  // timingSafeEqual throws if buffer lengths differ
  if (a.length !== b.length) {
    return false
  }

  return crypto.timingSafeEqual(a, b)
}
