import { NextResponse } from 'next/server'
import { checkAndDispatchDueCampaigns } from '@/lib/whatsapp/campaign-dispatcher'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const summary = await checkAndDispatchDueCampaigns()
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary
    })
  } catch (err: any) {
    console.error('[Campaign Cron Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
