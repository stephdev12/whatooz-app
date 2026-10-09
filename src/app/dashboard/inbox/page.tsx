'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'
import { ConversationList } from '@/components/inbox/conversation-list'
import { ChatThread } from '@/components/inbox/chat-thread'
import { MessageSquare, Inbox, User as UserIcon, HelpCircle, CheckCircle2, PanelRightOpen, PanelRightClose, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContactSidebar } from '@/components/inbox/contact-sidebar'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Contact {
  id: string
  name: string | null
  phone: string
  tags?: Tag[]
}

export interface Conversation {
  id: string
  contact_phone: string
  contact_name: string
  last_message_text: string
  last_message_at: string
  status: string
  unread_count: number
  assigned_user_id?: string | null
  contact_id?: string | null
  contact?: Contact | null
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
  const [showSidebar, setShowSidebar] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const loadConversations = useCallback(async () => {
    if (!activeOrganization) return
    const { data } = await supabase
      .from('conversations')
      .select('*, contact:contacts(id, name, phone, contact_tags(tags(*)))')
      .eq('organization_id', activeOrganization.id)
      .order('last_message_at', { ascending: false })

    const normalized = (data ?? []).map((raw: any) => {
      const contactRaw = Array.isArray(raw.contact) ? raw.contact[0] : raw.contact;
      if (!contactRaw) return raw;
      
      const { contact_tags, ...restContact } = contactRaw;
      return {
        ...raw,
        contact: {
          ...restContact,
          tags: (contact_tags ?? [])
            .map((ct: any) => ct.tags)
            .filter(Boolean)
        }
      }
    })

    setConversations(normalized)
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

    const channelName = `inbox-messages-${activeOrganization.id}-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelName)
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
            
            // Wait to ensure webhook finishes incrementing before resetting
            setTimeout(() => {
              fetch('/api/whatsapp/conversations/assign', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'x-organization-id': activeOrganization.id,
                },
                body: JSON.stringify({
                  conversationId: newMsg.conversation_id,
                  unreadCount: 0,
                }),
              }).catch(console.error)
            }, 1000)
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

    // Add event listener for tags updates from the sidebar
    const handleTagsUpdated = () => {
      loadConversations()
    }
    window.addEventListener('contact-tags-updated', handleTagsUpdated)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('contact-tags-updated', handleTagsUpdated)
    }
  }, [activeOrganization, selectedConvoId, supabase, loadConversations])

  // Real-time subscription for conversations
  useEffect(() => {
    if (!activeOrganization) return

    const channelName = `inbox-conversations-${activeOrganization.id}-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `organization_id=eq.${activeOrganization.id}`
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeOrganization, supabase, loadConversations])

  function handleSelectConversation(convoId: string) {
    setSelectedConvoId(convoId)
    loadMessages(convoId)

    // Reset unread count immediately and optimistically
    if (activeOrganization) {
      const convo = conversations.find((c) => c.id === convoId)
      if (convo && convo.unread_count > 0) {
        fetch('/api/whatsapp/conversations/assign', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': activeOrganization.id,
          },
          body: JSON.stringify({
            conversationId: convoId,
            unreadCount: 0,
          }),
        }).catch(console.error)

        // Optimistic update
        setConversations((prev) =>
          prev.map((c) => (c.id === convoId ? { ...c, unread_count: 0 } : c))
        )
      }
    }
  }

  function handleMessageSent(newMsg?: Message) {
    if (newMsg && newMsg.conversation_id === selectedConvoId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id || (newMsg.wamid && m.wamid === newMsg.wamid))) {
          return prev
        }
        return [...prev, newMsg]
      })
    }
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
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      {selectedConvoId && (
        <style jsx global>{`
          @media (max-width: 1024px) {
            .mobile-bottom-nav { display: none !important; }
            .inbox-main-content { padding-bottom: 0 !important; }
          }
        `}</style>
      )}
      
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
          <div className="flex h-full w-full relative">
            <div className="flex-1 min-w-0 flex flex-col">
              <ChatThread
                conversation={selectedConvo}
                messages={messages}
                onMessageSent={handleMessageSent}
                onBack={() => { setSelectedConvoId(null); setShowSidebar(false) }}
                showSidebar={showSidebar}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
                onDeleteContact={() => {
                  setSelectedConvoId(null)
                  setShowSidebar(false)
                  loadConversations()
                }}
              />
            </div>
            
            {/* Contact sidebar - slides in */}
            {showSidebar && selectedConvo.contact && (
              <>
                {/* Mobile backdrop */}
                <div 
                  className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                  onClick={() => setShowSidebar(false)}
                />
                <div className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm lg:static lg:w-72 lg:z-auto shrink-0 border-l border-border bg-card lg:bg-transparent shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
                  <div className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
                    <span className="font-semibold text-sm">Profil du contact</span>
                    <button onClick={() => setShowSidebar(false)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="h-[calc(100vh-3.5rem)] lg:h-full overflow-y-auto">
                    <ContactSidebar contact={selectedConvo.contact} />
                  </div>
                </div>
              </>
            )}
          </div>
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
