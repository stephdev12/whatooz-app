/**
 * Route alias: /api/webhooks/whatsapp -> /api/whatsapp/webhook
 * Ensures both URL variants supported by Meta or user configs work identically
 * using the full-featured WhatsApp webhook engine.
 */
export { GET, POST } from '@/app/api/whatsapp/webhook/route'
export const dynamic = 'force-dynamic'
