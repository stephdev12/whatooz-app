import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeCampaign } from '@/lib/whatsapp/campaign-dispatcher'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
  }

  try {
    const result = await executeCampaign(id)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error(`[Manual Campaign Dispatch Error for ${id}]:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
