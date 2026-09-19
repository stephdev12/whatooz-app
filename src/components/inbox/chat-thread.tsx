'use client'

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Send,
  Loader2,
  Check,
  CheckCheck,
  Phone,
} from 'lucide-react'
import type { Conversation, Message } from '@/app/dashboard/inbox/page'

interface ChatThreadProps {
  conversation: Conversation
  messages: Message[]
  onMessageSent: () => void
}

export function ChatThread({
  conversation,
  messages,
  onMessageSent,
}: ChatThreadProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          to: conversation.contact_phone,
          type: 'text',
          text: text.trim(),
        }),
      })

      if (res.ok) {
        setText('')
        onMessageSent()
      }
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fe5105]/10 text-sm font-semibold text-[#fe5105]">
          {(conversation.contact_name || conversation.contact_phone || '?')
            .charAt(0)
            .toUpperCase()}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {conversation.contact_name || conversation.contact_phone}
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {conversation.contact_phone}
          </p>
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
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                    isOutbound
                      ? 'wa-bubble-sent text-foreground'
                      : 'wa-bubble-received border border-border text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content_text}
                  </p>
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
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-2xl items-center gap-3"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
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
