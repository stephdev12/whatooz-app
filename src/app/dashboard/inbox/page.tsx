'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'
import { ConversationList } from '@/components/inbox/conversation-list'
import { ChatThread } from '@/components/inbox/chat-thread'
import { MessageSquare, Inbox, User as UserIcon, HelpCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Conversation {
  id: string
  contact_phone: string
  contact_name: string
  last_message_text: string
  last_message_at: string
  status: string
  unread_count: number
  assigned_user_id?: string | null
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
  const { activeOrganization } = useOrganization()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned' | 'closed'>('all')
  const supabase = useMemo(() => createClient(), [])

  const loadConversations = useCallback(async () => {
    if (!activeOrganization) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('organization_id', activeOrganization.id)
      .order('last_message_at', { ascending: false })

    setConversations(data ?? [])
    setLoading(false)
  }, [activeOrganization, supabase])

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
    if (!activeOrganization) return

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
  }, [activeOrganization, selectedConvoId, supabase, loadConversations])

  // Polling fallback every 3 seconds to guarantee instant delivery even if Realtime drops
  useEffect(() => {
    if (!activeOrganization) return

    const interval = setInterval(() => {
      loadConversations()
      if (selectedConvoId) {
        loadMessages(selectedConvoId)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [activeOrganization, selectedConvoId, loadConversations, loadMessages])

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

  const filteredConversations = conversations.filter(c => {
    if (filter === 'all') return c.status !== 'closed'
    if (filter === 'mine') return c.status !== 'closed' && c.assigned_user_id === user?.id
    if (filter === 'unassigned') return c.status !== 'closed' && !c.assigned_user_id
    if (filter === 'closed') return c.status === 'closed'
    return true
  })

  return (
    <div className="-m-4 flex flex-col md:flex-row h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] sm:-m-6 overflow-hidden">
      
      {/* Mobile Filters (Top) */}
      <div className={cn(
        "md:hidden flex w-full overflow-x-auto border-b border-border bg-muted/20 p-2 gap-2 shrink-0 items-center justify-around",
        selectedConvoId ? 'hidden' : 'flex'
      )}>
        <button 
          onClick={() => setFilter('all')}
          className={cn("p-2 rounded-xl transition-all flex items-center gap-1 text-xs", filter === 'all' ? "bg-black text-white dark:bg-card dark:text-black font-medium" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Toutes"
        >
          <Inbox className="w-4 h-4" />
          Toutes
        </button>
        <button 
          onClick={() => setFilter('mine')}
          className={cn("p-2 rounded-xl transition-all flex items-center gap-1 text-xs", filter === 'mine' ? "bg-black text-white dark:bg-card dark:text-black font-medium" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Mes assignations"
        >
          <UserIcon className="w-4 h-4" />
          Moi
        </button>
        <button 
          onClick={() => setFilter('unassigned')}
          className={cn("p-2 rounded-xl transition-all flex items-center gap-1 text-xs", filter === 'unassigned' ? "bg-black text-white dark:bg-card dark:text-black font-medium" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Non assignées"
        >
          <HelpCircle className="w-4 h-4" />
          Non assignées
        </button>
        <button 
          onClick={() => setFilter('closed')}
          className={cn("p-2 rounded-xl transition-all flex items-center gap-1 text-xs", filter === 'closed' ? "bg-black text-white dark:bg-card dark:text-black font-medium" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Fermées"
        >
          <CheckCircle2 className="w-4 h-4" />
          Fermées
        </button>
      </div>

      {/* Desktop Filters Sidebar (Thin) */}
      <div className="hidden md:flex w-16 md:w-20 shrink-0 border-r border-border bg-muted/20 flex-col items-center py-4 gap-4">
        <button 
          onClick={() => setFilter('all')}
          className={cn("p-3 rounded-xl transition-all", filter === 'all' ? "bg-black text-white dark:bg-card dark:text-black" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Toutes"
        >
          <Inbox className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setFilter('mine')}
          className={cn("p-3 rounded-xl transition-all", filter === 'mine' ? "bg-black text-white dark:bg-card dark:text-black" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Mes assignations"
        >
          <UserIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setFilter('unassigned')}
          className={cn("p-3 rounded-xl transition-all", filter === 'unassigned' ? "bg-black text-white dark:bg-card dark:text-black" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Non assignées"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setFilter('closed')}
          className={cn("p-3 rounded-xl transition-all", filter === 'closed' ? "bg-black text-white dark:bg-card dark:text-black" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-card/5")}
          title="Fermées"
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
      </div>

      {/* Conversation list */}
      <div
        className={cn(
          'w-full md:w-80 shrink-0 md:border-r border-border bg-background flex flex-col',
          selectedConvoId ? 'hidden md:flex' : 'flex'
        )}
      >
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConvoId}
          loading={loading}
          onSelect={handleSelectConversation}
          onConversationCreated={loadConversations}
        />
      </div>

      {/* Chat area */}
      <div
        className={cn(
          'flex-1 flex-col overflow-hidden',
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
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Sélectionnez une discussion à gauche pour répondre à vos clients ou attendez l&apos;arrivée d&apos;un nouveau message.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
