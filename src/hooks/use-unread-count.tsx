import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'

export function useUnreadCount() {
  const { activeOrganization } = useOrganization()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!activeOrganization) {
      setUnreadCount(0)
      return
    }

    const fetchCount = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('unread_count')
        .eq('organization_id', activeOrganization.id)
        .gt('unread_count', 0)

      if (!error && data) {
        const total = data.reduce((acc, curr) => acc + (curr.unread_count || 0), 0)
        setUnreadCount(total)
      } else if (error) {
        console.error("Error fetching unread count:", error)
      }
    }

    fetchCount()

    const channel = supabase
      .channel('unread-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `organization_id=eq.${activeOrganization.id}`
        },
        () => {
          fetchCount()
        }
      )
      .subscribe()

    const interval = setInterval(fetchCount, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [activeOrganization, supabase])

  return unreadCount
}
