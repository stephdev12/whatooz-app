'use client'

import { formatRelativeTime, cn } from '@/lib/utils'
import { MessageSquare, Search, Loader2, Plus, X, Send } from 'lucide-react'
import { useState } from 'react'
import type { Conversation } from '@/app/dashboard/inbox/page'
import { useOrganization } from '@/hooks/use-organization'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onConversationCreated?: () => void
}

export function ConversationList({
  conversations,
  selectedId,
  loading,
  onSelect,
  onConversationCreated,
}: ConversationListProps) {
  const { activeOrganization } = useOrganization()
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [msgType, setMsgType] = useState<'template' | 'text'>('template')
  const [customText, setCustomText] = useState('')
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const filtered = conversations.filter(
    (c) =>
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_phone?.includes(search)
  )

  async function handleStartConversation(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    const cleanedPhone = phone.replace(/[\s+-]/g, '')
    if (!cleanedPhone) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone valide.')
      return
    }
    if (!activeOrganization) {
      setErrorMsg("Organisation introuvable.")
      return
    }

    setSending(true)
    try {
      const payload =
        msgType === 'template'
          ? {
              to: cleanedPhone,
              type: 'template',
              templateName: 'hello_world',
              languageCode: 'en_US',
            }
          : {
              to: cleanedPhone,
              type: 'text',
              text: customText.trim() || 'Bonjour !',
            }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      setShowNewModal(false)
      setPhone('')
      setCustomText('')
      if (data.conversationId) {
        onSelect(data.conversationId)
      }
      onConversationCreated?.()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Échec de l'envoi")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <MessageSquare className="h-5 w-5 text-[#fe5105]" />
            Inbox
          </h2>
          <button
            onClick={() => {
              setErrorMsg('')
              setShowNewModal(true)
            }}
            className="flex items-center gap-1 rounded-lg bg-[#fe5105] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#fe5105]/90"
            title="Démarrer une conversation"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {search ? 'Aucun résultat' : 'Aucune conversation'}
            <p className="mt-2 text-xs text-muted-foreground/70">
              Cliquez sur &quot;Nouveau&quot; pour envoyer un message.
            </p>
          </div>
        ) : (
          filtered.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              className={cn(
                'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                selectedId === convo.id && 'bg-accent'
              )}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fe5105]/10 text-sm font-semibold text-[#fe5105]">
                {(convo.contact_name || convo.contact_phone || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-foreground">
                    {convo.contact_name || convo.contact_phone}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {convo.last_message_at
                      ? formatRelativeTime(convo.last_message_at)
                      : ''}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {convo.last_message_text || 'Nouvelle conversation'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modal Nouveau Message */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">
                Démarrer une conversation WhatsApp
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStartConversation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Numéro de téléphone destinataire (avec indicatif pays)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2376XXXXXXXX ou 336XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-[#fe5105]"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sur compte de test Meta, le numéro doit être ajouté dans les destinataires autorisés.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Type de message initial
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMsgType('template')}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                      msgType === 'template'
                        ? 'border-[#fe5105] bg-[#fe5105]/10 font-medium text-[#fe5105]'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    Template &quot;hello_world&quot;
                    <span className="block text-[10px] text-muted-foreground">
                      Recommandé par Meta
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgType('text')}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                      msgType === 'text'
                        ? 'border-[#fe5105] bg-[#fe5105]/10 font-medium text-[#fe5105]'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    Texte libre
                    <span className="block text-[10px] text-muted-foreground">
                      Fenêtre active uniquement
                    </span>
                  </button>
                </div>
              </div>

              {msgType === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tapez votre message..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  disabled={sending}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#fe5105]/90 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
