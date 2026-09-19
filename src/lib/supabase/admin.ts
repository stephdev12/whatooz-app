import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

  cachedAdmin = createClient(url, key)
  return cachedAdmin
}

/**
 * Admin Supabase client — bypasses RLS.
 * Used ONLY in server-side API routes (webhook, config encryption).
 * Uses Proxy for lazy evaluation during Next.js build.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const val = (client as any)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})

