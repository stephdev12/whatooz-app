'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { activeOrganization } = useOrganization()
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission)
      }
    }
  }, [])

  useEffect(() => {
    if (!activeOrganization || permission !== 'granted') return

    const supabase = createClient()

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as any
          if (msg.direction === 'inbound') {
            const { data: convo } = await supabase
              .from('conversations')
              .select('contact_name, contact_phone, organization_id')
              .eq('id', msg.conversation_id)
              .single()
            
            if (convo && convo.organization_id === activeOrganization.id) {
              const sender = convo.contact_name || convo.contact_phone || 'Nouveau message'
              const text = msg.content_text || (msg.media_url ? 'Média reçu' : 'Message WhatsApp')
              new Notification(`WhatsApp: ${sender}`, {
                body: text,
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const order = payload.new as any
          if (order.organization_id === activeOrganization.id) {
            new Notification(`Nouvelle commande!`, {
              body: `Commande de ${order.total_amount} reçue.`,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeOrganization, permission])

  return <>{children}</>
}
