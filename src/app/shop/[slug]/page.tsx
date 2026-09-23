import { createClient } from '@supabase/supabase-js'
import ShopClient from './shop-client'
import { notFound } from 'next/navigation'

export const revalidate = 60 // Revalidate cache every minute

export default async function ShopPage({ params }: { params: { slug: string } }) {
  // Use anon key for public fetching, or service role. Anon key is fine because we set up public policies.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!org) {
    notFound()
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <ShopClient organization={org} initialProducts={products || []} />
  )
}
