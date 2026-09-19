'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { ConversationList } from '@/components/inbox/conversation-list'
import { ChatThread } from '@/components/inbox/chat-thread'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Conversation {
  id: string
  contact_phone: string
  contact_name: string
  last_message_text: string
  last_message_at: string
  status: string
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  content_text: string
  media_url: string | null
  wamid: string | null
  status: string
  created_at: string
}

export default function InboxPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadConversations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })

    setConversations(data ?? [])
    setLoading(false)
  }, [user, supabase])

  const loadMessages = useCallback(
    async (convoId: string) => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true })

      setMessages(data ?? [])
    },
    [supabase]
  )

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message
          // If viewing this conversation, add message
          if (newMsg.conversation_id === selectedConvoId) {
            setMessages((prev) => [...prev, newMsg])
          }
          // Refresh conversation list
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, selectedConvoId, supabase, loadConversations])

  // Polling fallback every 3 seconds to guarantee instant delivery even if Realtime drops
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      loadConversations()
      if (selectedConvoId) {
        loadMessages(selectedConvoId)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [user, selectedConvoId, loadConversations, loadMessages])

  function handleSelectConversation(convoId: string) {
    setSelectedConvoId(convoId)
    loadMessages(convoId)
  }

  function handleMessageSent() {
    if (selectedConvoId) {
      loadMessages(selectedConvoId)
    }
    loadConversations()
  }

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId)

  return (
    <div className="-m-4 flex h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] sm:-m-6">
      {/* Conversation list */}
      <div
        className={cn(
          'w-full md:w-80 shrink-0 border-r border-border bg-background',
          selectedConvoId ? 'hidden md:block' : 'block'
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConvoId}
          loading={loading}
          onSelect={handleSelectConversation}
          onConversationCreated={loadConversations}
        />
      </div>

      {/* Chat area */}
      <div
        className={cn(
          'flex-1 flex-col',
          selectedConvoId ? 'flex' : 'hidden md:flex'
        )}
      >
        {selectedConvo ? (
          <ChatThread
            conversation={selectedConvo}
            messages={messages}
            onMessageSent={handleMessageSent}
            onBack={() => setSelectedConvoId(null)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fe5105]/10 text-[#fe5105]">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Votre boîte de réception WhatsApp</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Sélectionnez une discussion à gauche pour répondre à vos clients ou attendez l&apos;arrivée d&apos;un nouveau message.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
