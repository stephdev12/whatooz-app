import { NextRequest } from 'next/server'
import { GET as getBroadcasts, POST as postBroadcasts } from '../broadcasts/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return getBroadcasts(request)
}

export async function POST(request: NextRequest) {
  return postBroadcasts(request)
}
