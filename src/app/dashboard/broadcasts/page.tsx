'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CampaignsPage from '../campaigns/page'

export default function BroadcastsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/campaigns')
  }, [router])

  return <CampaignsPage />
}
