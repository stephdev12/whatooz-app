'use client'

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Send,
  Loader2,
  Check,
  CheckCheck,
  Phone,
  ArrowLeft,
  User as UserIcon,
  Pencil,
  X,
  Paperclip,
  PanelRightOpen,
  PanelRightClose
} from 'lucide-react'
import type { Conversation, Message } from '@/app/dashboard/inbox/page'
import { useOrganization } from '@/hooks/use-organization'

interface ChatThreadProps {
  conversation: Conversation
  messages: Message[]
  onMessageSent: (newMsg?: Message) => void
  onBack?: () => void
  showSidebar?: boolean
  onToggleSidebar?: () => void
}

export function ChatThread({
  conversation,
  messages,
  onMessageSent,
  onBack,
  showSidebar,
  onToggleSidebar
}: ChatThreadProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { activeOrganization } = useOrganization()
  const [members, setMembers] = useState<any[]>([])
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(conversation.contact_name || '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsEditingName(false)
    setEditName(conversation.contact_name || '')
  }, [conversation.id, conversation.contact_name])

  useEffect(() => {
    if (activeOrganization) {
      fetch('/api/organization/members', {
        headers: { 'x-organization-id': activeOrganization.id }
      })
      .then(res => res.json())
      .then(data => {
        if (data.members) setMembers(data.members)
      })
      .catch(console.error)
    }
  }, [activeOrganization])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) return
    await handleUpdate({ contactName: editName.trim() })
    setIsEditingName(false)
  }

  async function handleUpdate(payload: { status?: string, assignedUserId?: string | null, contactName?: string }) {
    if (!activeOrganization) return
    try {
      const res = await fetch('/api/whatsapp/conversations/assign', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          ...payload
        })
      })
      if (res.ok) {
        onMessageSent()
      }
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  // Scroll removed as requested by user

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return

    if (!activeOrganization?.id) {
      setSendError("Aucune organisation active sélectionnée.")
      return
    }

    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          to: conversation.contact_phone,
          type: 'text',
          text: text.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSendError(data.error || "Erreur lors de l'envoi du message WhatsApp")
        return
      }

      setText('')
      onMessageSent(data.message)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      console.error('Send failed:', err)
      setSendError(err.message || "Erreur réseau lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeOrganization) return

    setUploading(true)
    setSendError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch('/api/whatsapp/upload-message-media', {
        method: 'POST',
        headers: {
          'x-organization-id': activeOrganization.id
        },
        body: formData
      })
      
      const uploadData = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Échec du téléchargement du média')
      }
      
      const { mediaId } = uploadData
      
      let type = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'audio'

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          to: conversation.contact_phone,
          type,
          mediaId,
          caption: text.trim() || undefined,
        }),
      })

      const sendData = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(sendData.error || "Échec de l'envoi du fichier via WhatsApp")
      }

      setText('')
      onMessageSent(sendData.message)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      console.error('Upload/Send failed:', err)
      setSendError(err.message || "Erreur lors de l'envoi du média")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function renderStatusIcon(status: string) {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-400" />
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground -ml-1 mr-1"
            title="Retour aux discussions"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fe5105]/10 text-sm font-semibold text-[#fe5105]">
          {(conversation.contact_name || conversation.contact_phone || '?')
            .charAt(0)
            .toUpperCase()}
        </div>
        <div>
          {isEditingName ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <input 
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-7 w-40 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
              <button type="submit" className="text-muted-foreground hover:text-foreground">
                <Check className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => { setIsEditingName(false); setEditName(conversation.contact_name || '') }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 group">
              <h3 className="text-sm font-semibold text-foreground">
                {conversation.contact_name || conversation.contact_phone}
              </h3>
              <button 
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                title="Renommer le contact"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Phone className="h-3 w-3" />
            {conversation.contact_phone}
          </div>
        </div>
        
        {/* Controls */}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={conversation.status || 'open'}
            onChange={(e) => handleUpdate({ status: e.target.value })}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="open">Ouvert</option>
            <option value="pending">En attente</option>
            <option value="closed">Fermé</option>
          </select>
          
          <select
            value={conversation.assigned_user_id || 'unassigned'}
            onChange={(e) => handleUpdate({ assignedUserId: e.target.value })}
            className="hidden md:block h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[120px] truncate"
          >
            <option value="unassigned">Non assigné</option>
            {members.map(m => (
              <option key={m.member_id} value={m.user_id}>{m.full_name}</option>
            ))}
          </select>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="ml-1 hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={showSidebar ? 'Masquer le panneau contact' : 'Afficher le panneau contact'}
            >
              {showSidebar ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
          )}
          {/* Mobile version of toggle button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={showSidebar ? 'Masquer le profil' : 'Afficher le profil'}
            >
              <UserIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-background p-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              Aucun message. Envoyez le premier !
            </p>
          )}

          {messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound'
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  isOutbound ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm flex flex-col',
                    isOutbound
                      ? 'wa-bubble-sent text-foreground'
                      : 'wa-bubble-received border border-border text-foreground'
                  )}
                >
                  {msg.media_url && (
                    <div className="mb-2">
                      {(() => {
                        const isId = !msg.media_url.startsWith('http') && !msg.media_url.startsWith('/');
                        const displayUrl = isId && activeOrganization?.id
                          ? `/api/whatsapp/media/${msg.media_url}?orgId=${activeOrganization.id}`
                          : msg.media_url;

                        return (
                          <>
                            {msg.message_type === 'image' && (
                              <img src={displayUrl} alt="Image jointe" className="max-w-full rounded-lg max-h-64 object-contain" />
                            )}
                            {msg.message_type === 'video' && (
                              <video src={displayUrl} controls className="max-w-full rounded-lg max-h-64" />
                            )}
                            {msg.message_type === 'document' && (
                              <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline bg-background/50 p-2 rounded-lg text-xs">
                                <Paperclip className="h-4 w-4" /> Document joint
                              </a>
                            )}
                            {msg.message_type !== 'image' && msg.message_type !== 'video' && msg.message_type !== 'document' && (
                              <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline text-xs">
                                Fichier joint ({msg.message_type})
                              </a>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                  {msg.content_text && !msg.content_text.startsWith('[IMAGE]') && !msg.content_text.startsWith('[DOCUMENT]') && !msg.content_text.startsWith('[VIDEO]') && (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content_text}
                    </p>
                  )}
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1',
                      isOutbound ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOutbound && renderStatusIcon(msg.status)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Message composer */}
      <div className="border-t border-border bg-background p-4">
        {sendError && (
          <div className="mx-auto max-w-2xl mb-2 flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span>{sendError}</span>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="ml-2 hover:opacity-75"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-2xl items-center gap-3"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="Joindre un fichier"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </button>
          
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (sendError) setSendError(null)
            }}
            placeholder="Écrire un message..."
            className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending || uploading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fe5105] text-white transition-all hover:bg-[#e04602] disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
