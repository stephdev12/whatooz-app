'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'
import { RotateCcw, Sparkles } from 'lucide-react'
import LoadingState from '@/components/chat/LoadingState'
import ThinkingState from '@/components/chat/ThinkingState'
import StreamingText, { StreamingToken, StreamingSource } from '@/components/chat/StreamingText'
import TaskRows, { TaskRow } from '@/components/chat/TaskRows'
import ApprovalCard from '@/components/chat/ApprovalCard'
import RecommendationCard from '@/components/chat/RecommendationCard'
import PromptBar from '@/components/chat/PromptBar'

interface ToolExecution {
  tool: string
  args: Record<string, any>
  result: Record<string, any>
  timestamp: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tokens?: StreamingToken[]
  sources?: StreamingSource[]
  tools?: ToolExecution[]
  taskRows?: TaskRow[]
  suggestedActions?: string[]
  isApprovalRequired?: boolean
  isRecommendation?: boolean
  timestamp: string
  isStreaming?: boolean
}

const DEFAULT_SOURCES: StreamingSource[] = [
  { name: 'WhatsApp Business API', domain: 'whatsapp.com', href: '#', image: '' },
  { name: 'Catalogue Whatooz', domain: 'whatooz.com', href: '#', image: '' },
  { name: 'Passerelle Paiements', domain: 'wave.com', href: '#', image: '' },
]

function textToTokens(text: string): StreamingToken[] {
  if (!text) return []
  const words = text.split(/(\s+)/)
  return words.filter(Boolean).map((word) => ({
    text: word,
  }))
}

const INITIAL_WELCOME = "Bonjour ! Que souhaitez-vous faire aujourd'hui ?"

export default function DashboardPage() {
  const { user } = useAuth()
  const { activeOrganization } = useOrganization()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: INITIAL_WELCOME,
      tokens: textToTokens(INITIAL_WELCOME),
      sources: DEFAULT_SOURCES,
      suggestedActions: [
        'Combien ai-je vendu ce mois-ci ?',
        'Relancer les paniers abandonnés sur WhatsApp',
        'Quels sont mes produits les plus demandés ?',
        'Consulter le solde disponible',
      ],
      timestamp: new Date().toISOString(),
      isStreaming: false,
    },
  ])

  const [isAiExecuting, setIsAiExecuting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isAiExecuting])

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend?.trim()
    if (!text || isAiExecuting || !activeOrganization) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsAiExecuting(true)

    try {
      const res = await fetch('/api/ai/operational', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      if (res.ok) {
        const replyText = data.reply || ''
        const tokens = textToTokens(replyText)

        // Check if tools were executed
        let generatedTaskRows: TaskRow[] | undefined
        if (data.tools && data.tools.length > 0) {
          generatedTaskRows = data.tools.map((t: ToolExecution, idx: number) => ({
            key: `task-${idx}-${t.tool}`,
            label: `Exécution de ${t.tool}`,
            summary: 'Tâche opérationnelle exécutée avec succès',
            meta: 'Validé',
            status: 'done' as const,
            details: Object.entries(t.args || {}).map(([k, v]) => ({
              label: k,
              meta: typeof v === 'object' ? JSON.stringify(v) : String(v),
            })),
          }))
        }

        // Check if approval card or recommendation is relevant
        const requiresApproval = text.toLowerCase().includes('retrait') || text.toLowerCase().includes('supprimer') || text.toLowerCase().includes('virer')
        const isRecommendation = text.toLowerCase().includes('produit') || text.toLowerCase().includes('conseil') || text.toLowerCase().includes('campagne')

        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          tokens: tokens,
          sources: DEFAULT_SOURCES,
          tools: data.tools,
          taskRows: generatedTaskRows,
          suggestedActions: data.suggestedActions || [
            'Détailler cette analyse',
            'Envoyer une mise à jour sur WhatsApp',
            'Exporter les données',
          ],
          isApprovalRequired: requiresApproval,
          isRecommendation: isRecommendation,
          timestamp: data.timestamp || new Date().toISOString(),
          isStreaming: true,
        }

        setMessages((prev) => [...prev, assistantMsg])
      } else {
        const errorText = `Désolé, une anomalie est survenue : ${data.error || 'Erreur de connexion'}`
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: errorText,
            tokens: textToTokens(errorText),
            timestamp: new Date().toISOString(),
            isStreaming: false,
          },
        ])
      }
    } catch {
      const errorText = "Impossible de joindre l'agent opérationnel. Vérifiez la connexion au serveur."
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorText,
          tokens: textToTokens(errorText),
          timestamp: new Date().toISOString(),
          isStreaming: false,
        },
      ])
    } finally {
      setIsAiExecuting(false)
    }
  }

  const handleResetConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: INITIAL_WELCOME,
        tokens: textToTokens(INITIAL_WELCOME),
        sources: DEFAULT_SOURCES,
        suggestedActions: [
          'Combien ai-je vendu ce mois-ci ?',
          'Relancer les paniers abandonnés sur WhatsApp',
          'Quels sont mes produits les plus demandés ?',
          'Consulter le solde disponible',
        ],
        timestamp: new Date().toISOString(),
        isStreaming: false,
      },
    ])
  }

  const userName = user?.email?.split('@')[0] || 'Stéphane'
  const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1)

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 max-w-4xl w-full mx-auto px-1 sm:px-4 pb-2">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50 shrink-0">
        <h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground font-heading">
          Bonjour, {capitalizedUserName}
        </h1>

        <button
          onClick={handleResetConversation}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title="Nouveau chat"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Nouveau chat</span>
        </button>
      </header>

      {/* ─── Scrollable Message Thread ─── */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 sm:py-5 space-y-5 sm:space-y-6 pr-1">
        {messages.map((msg, index) => {
          const isLastAssistantMessage =
            msg.role === 'assistant' &&
            index === messages.findLastIndex((m) => m.role === 'assistant')

          return (
            <div key={msg.id} className="space-y-3">
              {msg.role === 'user' ? (
                /* User Message Bubble */
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-muted/70 px-4 py-2.5 text-xs sm:text-sm text-foreground border border-border/60">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ) : (
                /* Assistant Message Stack */
                <div className="space-y-4 max-w-full">
                  {/* Task progress rows if tools were executed */}
                  {msg.taskRows && msg.taskRows.length > 0 && (
                    <div className="pt-1">
                      <TaskRows
                        variant="Cards"
                        rows={msg.taskRows}
                        className="max-w-2xl"
                      />
                    </div>
                  )}

                  {/* Human-in-the-loop approval card if needed */}
                  {msg.isApprovalRequired && (
                    <div className="pt-1">
                      <ApprovalCard
                        labels={{
                          continue: 'Valider et exécuter',
                          skip: 'Annuler',
                          send: 'Envoyer',
                        }}
                        onSubmitted={() => {
                          handleSendMessage("Action confirmée par l'administrateur.")
                        }}
                      />
                    </div>
                  )}

                  {/* Proactive Recommendation card if needed */}
                  {msg.isRecommendation && (
                    <div className="pt-1">
                      <RecommendationCard
                        labels={{
                          title: 'Recommandation : Relance WhatsApp',
                          alternatives: 'Alternatives',
                          accepted: 'Confirmé',
                        }}
                      />
                    </div>
                  )}

                  {/* Streaming Text Output with followups */}
                  <div className="w-full">
                    <StreamingText
                      content={msg.tokens}
                      sources={msg.sources}
                      followUps={msg.suggestedActions}
                      immediate={!isLastAssistantMessage || !msg.isStreaming}
                      loop={false}
                      fill={true}
                      onFollowUp={(followUpText) => {
                        handleSendMessage(followUpText)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Live Loading & Thinking State while AI is computing */}
        {isAiExecuting && (
          <div className="space-y-3 pt-2">
            <LoadingState
              variant="Drive"
              label="Recherche en cours..."
            />
            <div className="max-w-xl">
              <ThinkingState
                variant="Steps"
                active="Recherche en cours..."
                done="Terminé"
                rows={[
                  {
                    primary: 'Consultation des données WhatsApp et catalogue',
                    secondary: '620ms',
                  },
                  {
                    primary: 'Vérification des commandes et des stocks',
                    secondary: '840ms',
                  },
                  {
                    primary: 'Génération de la réponse',
                    secondary: '450ms',
                  },
                ]}
              />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ─── Bottom Interactive Prompt Bar ─── */}
      <footer className="pt-2 shrink-0">
        <PromptBar
          demo={false}
          variant="Rounded"
          placeholder="Posez une question ou tapez / pour une action..."
          onSend={(draftText) => handleSendMessage(draftText)}
        />
      </footer>
    </div>
  )
}
