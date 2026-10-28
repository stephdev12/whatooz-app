'use client'

import { formatRelativeTime, cn } from '@/lib/utils'
import { Loader2, Phone } from 'lucide-react'
import { CoolIcon } from '@/components/icons/coolicon'
import { useState, useMemo } from 'react'
import type { Conversation, ConnectedPhone } from '@/app/dashboard/inbox/page'
import { useOrganization } from '@/hooks/use-organization'
import { Badge } from '@/components/ui/badge'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onConversationCreated?: () => void
  connectedPhones?: ConnectedPhone[]
  selectedPhoneId?: string
  onSelectPhone?: (id: string) => void
  responseFilter?: 'all' | 'unanswered' | 'replied'
  onSelectResponseFilter?: (filter: 'all' | 'unanswered' | 'replied') => void
}

export function ConversationList({
  conversations,
  selectedId,
  loading,
  onSelect,
  onConversationCreated,
  connectedPhones,
  selectedPhoneId = 'all',
  onSelectPhone,
  responseFilter = 'all',
  onSelectResponseFilter,
}: ConversationListProps) {
  const { activeOrganization } = useOrganization()
  const [search, setSearch] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [modalPhoneNumberId, setModalPhoneNumberId] = useState<string>('')
  const [msgType, setMsgType] = useState<'template' | 'text'>('template')
  const [customText, setCustomText] = useState('')
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Derive all unique tags with count from conversation contacts
  const availableTags = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; count: number }>()
    for (const c of conversations) {
      if (c.contact?.tags && Array.isArray(c.contact.tags)) {
        for (const t of c.contact.tags) {
          if (t && t.id) {
            const existing = map.get(t.id)
            if (existing) {
              existing.count++
            } else {
              map.set(t.id, { id: t.id, name: t.name, color: t.color, count: 1 })
            }
          }
        }
      }
    }
    return Array.from(map.values())
  }, [conversations])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return conversations.filter((c) => {
      const matchesSearch =
        !s ||
        (c.contact_name?.toLowerCase().includes(s) ?? false) ||
        (c.contact_phone?.includes(s) ?? false) ||
        (c.last_message_text?.toLowerCase().includes(s) ?? false) ||
        Boolean(c.contact?.tags && c.contact.tags.some((t) => t.name.toLowerCase().includes(s)))

      const matchesTag =
        !selectedTagId ||
        Boolean(c.contact?.tags && c.contact.tags.some((t) => t.id === selectedTagId))

      return matchesSearch && matchesTag
    })
  }, [conversations, search, selectedTagId])

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
      const payload: any =
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

      if (modalPhoneNumberId) {
        payload.phoneNumberId = modalPhoneNumberId
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CoolIcon name="chat-dots" size={18} duotone={true} className="text-[#fe5105]" />
            Inbox
          </h2>
          <button
            onClick={() => {
              setErrorMsg('')
              setShowNewModal(true)
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#fe5105] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#fe5105]/90"
            title="Démarrer une conversation"
          >
            <CoolIcon name="add-plus" size={14} duotone={true} />
            Nouveau
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <CoolIcon name="search-magnifying-glass" size={15} duotone={true} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, numéro ou tag..."
            className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105]"
          />
        </div>

        {/* Multi-Number Filter (if more than 1 connected number) */}
        {connectedPhones && connectedPhones.length > 1 && (
          <div className="mt-2.5 flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedPhoneId}
              onChange={(e) => onSelectPhone?.(e.target.value)}
              className="w-full h-7 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#fe5105] truncate"
            >
              <option value="all">Toutes les lignes ({connectedPhones.length})</option>
              {connectedPhones.map((p) => (
                <option key={p.phone_number_id} value={p.phone_number_id}>
                  {p.phone_label || p.display_phone_number} {p.is_default ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Response Status Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-xl mt-2.5 select-none">
          <button
            type="button"
            onClick={() => onSelectResponseFilter?.('all')}
            className={cn(
              'py-1 rounded-lg text-center text-xs font-medium transition-all cursor-pointer',
              responseFilter === 'all'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Toutes
          </button>
          <button
            type="button"
            onClick={() => onSelectResponseFilter?.('unanswered')}
            className={cn(
              'py-1 rounded-lg text-center text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer',
              responseFilter === 'unanswered'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
            En attente
          </button>
          <button
            type="button"
            onClick={() => onSelectResponseFilter?.('replied')}
            className={cn(
              'py-1 rounded-lg text-center text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer',
              responseFilter === 'replied'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            Répondues
          </button>
        </div>

        {/* Tag Filters Strip */}
        {availableTags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedTagId(null)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0',
                !selectedTagId
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>Tous</span>
              <span className="text-[10px] opacity-70">({conversations.length})</span>
            </button>
            {availableTags.map((tag) => {
              const isSelected = selectedTagId === tag.id
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagId(isSelected ? null : tag.id)}
                  style={{
                    backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                    color: isSelected ? '#ffffff' : tag.color,
                    borderColor: `${tag.color}35`,
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 border',
                    isSelected && 'shadow-xs font-semibold'
                  )}
                  title={`Filtrer par ${tag.name}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? '#ffffff' : tag.color }}
                  />
                  <span>{tag.name}</span>
                  <span className="text-[10px] opacity-80">({tag.count})</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-20 md:pb-6">
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
          filtered.map((convo) => {
            const phoneObj = connectedPhones?.find(
              (p) => p.phone_number_id === convo.phone_number_id
            )
            const isPendingReply = convo.has_replied === false

            return (
              <button
                key={convo.id}
                onClick={() => onSelect(convo.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/50 shrink-0 group',
                  selectedId === convo.id && 'bg-accent'
                )}
              >
                {/* Avatar with Response indicator */}
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fe5105]/10 text-sm font-semibold text-[#fe5105]">
                    {(convo.contact_name || convo.contact_phone || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  {isPendingReply && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-amber-500 border-2 border-background animate-pulse"
                      title="En attente de réponse"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {convo.contact_name || convo.contact_phone}
                      </span>
                      {phoneObj && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-[9px] py-0 px-1 font-mono shrink-0 opacity-80"
                        >
                          {phoneObj.phone_label || phoneObj.display_phone_number}
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {convo.last_message_at
                        ? formatRelativeTime(convo.last_message_at)
                        : ''}
                    </span>
                  </div>

                  {convo.contact?.tags && convo.contact.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 overflow-x-auto no-scrollbar">
                      {convo.contact.tags.map((tag) => (
                        <span
                          key={tag.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTagId(selectedTagId === tag.id ? null : tag.id)
                          }}
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          title={`Filtrer par le tag ${tag.name}`}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p className="truncate text-xs text-muted-foreground flex-1">
                      {convo.last_message_text || 'Nouvelle conversation'}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPendingReply && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                          À répondre
                        </span>
                      )}
                      {convo.unread_count > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#fe5105] px-1 text-[10px] font-bold text-white">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
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
                <CoolIcon name="close-sm" size={16} duotone={true} />
              </button>
            </div>

            <form onSubmit={handleStartConversation} className="mt-4 space-y-4">
              {/* Phone Line Selector if multiple lines available */}
              {connectedPhones && connectedPhones.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Envoyer depuis le numéro :
                  </label>
                  <select
                    value={modalPhoneNumberId}
                    onChange={(e) => setModalPhoneNumberId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  >
                    <option value="">Numéro par défaut</option>
                    {connectedPhones.map((p) => (
                      <option key={p.phone_number_id} value={p.phone_number_id}>
                        {p.phone_label || p.display_phone_number} {p.is_default ? '(Principal)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    <CoolIcon name="arrow-right-sm" size={15} duotone={true} />
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
