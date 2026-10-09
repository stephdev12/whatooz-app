'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NewCampaignPage from '../../campaigns/new/page'

export default function NewBroadcastRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/campaigns/new')
  }, [router])

  return <NewCampaignPage />
}
