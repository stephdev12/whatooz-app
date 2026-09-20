'use client'

import React, { useEffect, useState } from 'react'
import {
  Zap,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  X,
  FileText,
  Layers,
  MessageSquare,
  CheckCircle2,
  Edit3,
  Copy,
  ArrowRight,
  GitBranch,
  Bot,
  Play,
  CreditCard,
  Filter,
  MoreVertical,
  Clock,
  Send,
  StopCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Automation {
  id: string
  name: string
  trigger_type: 'keyword' | 'first_message'
  trigger_value: string | null
  action_type: 'send_template' | 'send_flow' | 'send_text'
  action_payload: {
    template_name?: string
    language_code?: string
    header_image_url?: string
    body_variables?: string[]
    flow_id?: string
    flow_cta?: string
    body_text?: string
    text?: string
  }
  is_active: boolean
  executions_count: number
  created_at: string
}

interface Template {
  id: string
  name: string
  language: string
  status: string
  category: string
  components?: Array<{
    type: string
    format?: string
    text?: string
  }>
}

interface FlowItem {
  id: string
  meta_flow_id?: string
  name: string
  status: string
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [flows, setFlows] = useState<FlowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // View Mode: 'canvas' (n8n node graph) | 'linear' (Zapier / Relay vertical) | 'cards' (Olivia Rhye)
  const [viewMode, setViewMode] = useState<'canvas' | 'linear' | 'cards'>('canvas')

  // Modal create / edit
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState<'keyword' | 'first_message'>('keyword')
  const [triggerValue, setTriggerValue] = useState('')
  const [actionType, setActionType] = useState<'send_template' | 'send_flow' | 'send_text'>('send_flow')

  // Action Config
  const [selectedTemplateName, setSelectedTemplateName] = useState('')
  const [selectedFlowId, setSelectedFlowId] = useState('')
  const [flowCta, setFlowCta] = useState('Ouvrir le formulaire')
  const [flowBodyText, setFlowBodyText] = useState('Bonjour ! Complétez ce formulaire pour commander :')
  const [replyText, setReplyText] = useState('')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [autoRes, tplRes, flowRes] = await Promise.all([
        fetch('/api/whatsapp/automations'),
        fetch('/api/whatsapp/templates'),
        fetch('/api/whatsapp/flows'),
      ])

      const autoData = await autoRes.json()
      const tplData = await tplRes.json()
      const flowData = await flowRes.json()

      if (autoRes.ok) setAutomations(autoData.automations ?? [])
      if (tplRes.ok) setTemplates(tplData.templates ?? [])
      if (flowRes.ok) setFlows(flowData.flows ?? [])
    } catch {
      setError('Impossible de charger les flux')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingId(null)
    setName('')
    setTriggerType('keyword')
    setTriggerValue('COMMANDE')
    setActionType('send_flow')
    setSelectedTemplateName(templates[0]?.name || '')
    setSelectedFlowId(flows[0]?.id || '')
    setFlowCta('Ouvrir le formulaire')
    setFlowBodyText('Bonjour ! Voici notre catalogue interactif :')
    setReplyText('Bonjour ! Comment pouvons-nous vous aider ?')
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(auto: Automation) {
    setEditingId(auto.id)
    setName(auto.name)
    setTriggerType(auto.trigger_type)
    setTriggerValue(auto.trigger_value || '')
    setActionType(auto.action_type)

    const payload = auto.action_payload || {}
    setSelectedTemplateName(payload.template_name || templates[0]?.name || '')
    setSelectedFlowId(payload.flow_id || flows[0]?.id || '')
    setFlowCta(payload.flow_cta || 'Ouvrir')
    setFlowBodyText(payload.body_text || 'Bonjour ! Veuillez compléter :')
    setReplyText(payload.text || '')

    setFormError('')
    setShowModal(true)
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentActive }),
      })
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a))
        )
      }
    } catch {
      alert('Erreur lors de la mise à jour')
    }
  }

  async function handleDelete(id: string, autoName: string) {
    if (!confirm(`Supprimer le scénario "${autoName}" ?`)) return
    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id))
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Donnez un titre à ce scénario.')
      return
    }

    if (triggerType === 'keyword' && !triggerValue.trim()) {
      setFormError('Indiquez le mot-clé (ex: COMMANDE, TARIFS).')
      return
    }

    let payload: Record<string, unknown> = {}
    if (actionType === 'send_flow') {
      if (!selectedFlowId) {
        setFormError('Veuillez sélectionner un WhatsApp Flow.')
        return
      }
      payload = {
        flow_id: selectedFlowId,
        flow_cta: flowCta.trim() || 'Ouvrir',
        body_text: flowBodyText.trim(),
      }
    } else if (actionType === 'send_template') {
      if (!selectedTemplateName) {
        setFormError('Veuillez sélectionner un modèle.')
        return
      }
      payload = {
        template_name: selectedTemplateName,
        language_code: 'fr',
      }
    } else if (actionType === 'send_text') {
      if (!replyText.trim()) {
        setFormError('Veuillez rédiger le message.')
        return
      }
      payload = { text: replyText.trim() }
    }

    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const bodyPayload = editingId
        ? {
            id: editingId,
            name: name.trim(),
            trigger_type: triggerType,
            trigger_value: triggerType === 'keyword' ? triggerValue.trim().toUpperCase() : null,
            action_type: actionType,
            action_payload: payload,
          }
        : {
            name: name.trim(),
            trigger_type: triggerType,
            trigger_value: triggerType === 'keyword' ? triggerValue.trim().toUpperCase() : null,
            action_type: actionType,
            action_payload: payload,
            is_active: true,
          }

      const res = await fetch('/api/whatsapp/automations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      setShowModal(false)
      await loadData()
    } catch {
      setFormError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 font-heading">
            <GitBranch className="h-6 w-6 text-[#fe5105]" />
            Scénarios & Workflows WhatsApp
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Automatisez la vente : un mot-clé déclenche immédiatement un Flow natif et son encaissement Mobile Money
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Switcher 3 Modes: Canvas n8n / Linéaire Relay / Cards */}
          <div className="flex items-center rounded-full bg-secondary p-1 border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'canvas'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Nœuds n8n
            </button>
            <button
              type="button"
              onClick={() => setViewMode('linear')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'linear'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mode Linéaire (Relay)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'cards'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mes Scénarios ({automations.length})
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau Scénario</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-destructive/10 p-4 text-xs font-semibold text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── 2. MODE 1: VISUAL NODE CANVAS (Inspired by Reference Image 2 - n8n) ─── */}
      {viewMode === 'canvas' && (
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-[#0c0d0e] p-6 shadow-2xl dot-grid-canvas">
          <div className="flex items-center justify-between mb-4 z-10 relative">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Graph d&apos;Exécution Visuelle • Moteur n8n
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[11px] font-mono text-neutral-400">
                WhatsApp Cloud v7.3 ➔ Instant Payment
              </span>
              <button
                onClick={openCreateModal}
                className="rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-3 py-1 border border-white/10"
              >
                + Ajouter un nœud
              </button>
            </div>
          </div>

          {/* Interactive Flow Nodes with SVG Curved Connectors */}
          <div className="relative min-h-[360px] flex items-center justify-center overflow-x-auto py-6">
            {/* SVG Connecting Bezier Paths */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none stroke-neutral-600/70"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Webhook -> AI Agent */}
              <path
                d="M 230 150 C 270 150, 270 150, 310 150"
                fill="none"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                className="animate-pulse stroke-[#fe5105]"
              />
              {/* AI Agent -> Model & Tools (Dotted curves downwards) */}
              <path
                d="M 390 190 C 390 230, 330 240, 330 270"
                fill="none"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="stroke-neutral-500"
              />
              <path
                d="M 430 190 C 430 230, 480 240, 480 270"
                fill="none"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="stroke-neutral-500"
              />
              {/* AI Agent -> Switch Router */}
              <path
                d="M 510 150 C 550 150, 550 150, 590 150"
                fill="none"
                strokeWidth="2.5"
                className="stroke-neutral-400"
              />
              {/* Switch -> Flow Form (Top Branch) */}
              <path
                d="M 720 150 C 760 150, 760 90, 800 90"
                fill="none"
                strokeWidth="2.5"
                className="stroke-[#00a884]"
              />
              {/* Switch -> Payment Link (Bottom Branch) */}
              <path
                d="M 720 150 C 760 150, 760 210, 800 210"
                fill="none"
                strokeWidth="2.5"
                className="stroke-[#fe5105]"
              />
              {/* Flow & Payment -> Output */}
              <path
                d="M 980 90 C 1020 90, 1020 150, 1060 150"
                fill="none"
                strokeWidth="2"
                className="stroke-neutral-500"
              />
              <path
                d="M 980 210 C 1020 210, 1020 150, 1060 150"
                fill="none"
                strokeWidth="2"
                className="stroke-neutral-500"
              />
            </svg>

            {/* Nodes Container */}
            <div className="relative z-10 flex items-center gap-10 min-w-[1200px] px-6">
              {/* NODE 1: Webhook Trigger Node */}
              <div className="w-52 rounded-2xl border border-purple-500/40 bg-[#16181b] p-4 text-white shadow-xl transition-transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-purple-400">Webhook GET</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-100">WhatsApp Inbound</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">Écoute les messages entrants</p>
                {/* Port right */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-purple-500" />
              </div>

              {/* NODE 2: AI Agent (Tools Agent) with Tools sub-nodes */}
              <div className="relative flex flex-col items-center">
                <div className="w-52 rounded-2xl border border-sky-500/40 bg-[#16181b] p-4 text-white shadow-xl transition-transform hover:scale-105">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-neutral-400" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                      <Bot className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-sky-400">Agent IA</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">Filtre & Intention</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Qualification mot-clé</p>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-sky-500" />
                </div>

                {/* Sub-tools circles (like Image 2: Gemini & Catalog) */}
                <div className="flex items-center gap-6 mt-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold shadow-md">
                      G
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-1">Gemini Pro</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-md">
                      📦
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-1">Catalogue API</span>
                  </div>
                </div>
              </div>

              {/* NODE 3: Switch Router Node */}
              <div className="w-48 rounded-2xl border border-neutral-700 bg-[#16181b] p-4 text-white shadow-xl transition-transform hover:scale-105">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-neutral-400" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">Router</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-100">Switch Intent</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">Commande vs Devis</p>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-emerald-500" />
              </div>

              {/* ACTION NODES (Branch) */}
              <div className="flex flex-col gap-6">
                {/* NODE 4: Flow Form Node */}
                <div className="w-52 rounded-2xl border border-[#00a884]/40 bg-[#16181b] p-4 text-white shadow-xl transition-transform hover:scale-105">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a884]/20 text-[#00a884]">
                      <Layers className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#00a884]">Flow Natif</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">Envoyer WhatsApp Flow</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Formulaire interactif v7.3</p>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-[#00a884]" />
                </div>

                {/* NODE 5: Payment Link Node */}
                <div className="w-52 rounded-2xl border border-[#fe5105]/40 bg-[#16181b] p-4 text-white shadow-xl transition-transform hover:scale-105">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fe5105]/20 text-[#fe5105]">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#fe5105]">Paiement</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">Lien Wave / MoMo</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Encaissement automatique</p>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-[#fe5105]" />
                </div>
              </div>

              {/* NODE 6: Output / Confirmation */}
              <div className="w-48 rounded-2xl border border-emerald-500/40 bg-[#16181b] p-4 text-white shadow-xl transition-transform hover:scale-105">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#16181b] bg-emerald-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400">Succès</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-100">Notification Client</h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">Reçu & Alerte Marchand</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. MODE 2: LINEAR WORKFLOW (Inspired by Reference Image 3 - Zapier / Relay) ─── */}
      {viewMode === 'linear' && (
        <div className="relative rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-card/60 p-6 sm:p-10 dot-grid-canvas">
          <div className="max-w-md mx-auto relative flex flex-col items-center">
            {/* Vertical connector line */}
            <div className="absolute top-10 bottom-10 w-0.5 bg-border pointer-events-none" />

            {/* Step 1: Web form submitted / WhatsApp Trigger */}
            <div className="relative z-10 w-full rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 font-bold shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Déclencheur WhatsApp</p>
                  <h4 className="text-xs font-bold text-foreground">Message ou Mot-clé reçu</h4>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* (+) Button */}
            <div className="relative z-10 my-3 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground shadow-xs">
                <Plus className="h-3 w-3" />
              </div>
            </div>

            {/* Step 2: Qualification & Lead Routing */}
            <div className="relative z-10 w-full rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 font-bold shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Analyse & Routage</p>
                  <h4 className="text-xs font-bold text-foreground">Qualification de l&apos;intention</h4>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* (+) Button */}
            <div className="relative z-10 my-3 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground shadow-xs">
                <Plus className="h-3 w-3" />
              </div>
            </div>

            {/* Step 3: Send WhatsApp Flow */}
            <div className="relative z-10 w-full rounded-2xl border border-[#00a884]/40 bg-card p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/15 text-[#00a884] font-bold shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#00a884] font-semibold">Action Interactive</p>
                  <h4 className="text-xs font-bold text-foreground">Envoyer le WhatsApp Flow</h4>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* (+) Button */}
            <div className="relative z-10 my-3 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground shadow-xs">
                <Plus className="h-3 w-3" />
              </div>
            </div>

            {/* Step 4: Mobile Money Payment */}
            <div className="relative z-10 w-full rounded-2xl border border-[#fe5105]/40 bg-card p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fe5105]/15 text-[#fe5105] font-bold shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#fe5105] font-semibold">Paiement Mobile Money</p>
                  <h4 className="text-xs font-bold text-foreground">Lien Wave / Orange Money</h4>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* (+) Button */}
            <div className="relative z-10 my-3 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground shadow-xs">
                <Plus className="h-3 w-3" />
              </div>
            </div>

            {/* Step 5: End Workflow */}
            <div className="relative z-10 w-full rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 font-bold shrink-0">
                  <StopCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Clôture du workflow</p>
                  <h4 className="text-xs font-bold text-foreground">Confirmation envoyée</h4>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. SCENARIOS CARDS GRID (Always visible or in 'cards' mode, styled like Olivia Rhye Image 1) ─── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">
            Scénarios Actifs ({automations.length})
          </h2>
          <button
            onClick={openCreateModal}
            className="text-xs font-semibold text-[#fe5105] hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Créer un scénario</span>
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#fe5105]" />
            </div>
          ) : automations.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center bg-card/50">
              <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">Aucun scénario configuré</p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez votre première réponse automatique WhatsApp en 2 clics
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 rounded-full bg-[#fe5105] text-white px-4 py-1.5 text-xs font-bold shadow-xs hover:bg-[#e04602]"
              >
                + Créer un scénario
              </button>
            </div>
          ) : (
            automations.map((auto) => (
              <div
                key={auto.id}
                className="group relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 backdrop-blur-md shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Noisy Gradient Header Banner (Olivia Rhye style Image 1) */}
                <div className="relative h-24 w-full bg-gradient-to-r from-emerald-600/30 via-[#fe5105]/20 to-teal-600/30 overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {/* Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(auto.id, auto.is_active)}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        auto.is_active ? 'bg-emerald-500' : 'bg-black/30'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                          auto.is_active ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Floating Avatar & Actions */}
                <div className="relative px-5 pt-0 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="-mt-10 mb-3 flex items-center justify-between">
                      <div className="h-16 w-16 rounded-2xl border-4 border-card bg-foreground text-background flex items-center justify-center shadow-md">
                        <Zap className="h-7 w-7 text-[#fe5105]" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(auto)}
                          title="Modifier"
                          className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(auto.id, auto.name)}
                          title="Supprimer"
                          className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Trigger */}
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-tight">{auto.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {auto.trigger_type === 'keyword' ? `Mot-clé : ${auto.trigger_value}` : 'Nouveau contact'}
                      </p>
                    </div>

                    {/* 3 Metrics Row (Olivia Rhye style) */}
                    <div className="grid grid-cols-3 divide-x divide-black/[0.04] dark:divide-white/[0.06] my-4 py-2 border-y border-black/[0.04] dark:border-white/[0.06] text-center">
                      <div>
                        <p className="text-xs font-bold text-foreground">{auto.executions_count}</p>
                        <p className="text-[10px] text-muted-foreground">Exécutions</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-500">100%</p>
                        <p className="text-[10px] text-muted-foreground">Délivré</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {auto.action_type === 'send_flow' ? 'Flow' : 'Texte'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Type</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Full-Width Pill Button (Olivia Rhye Get in Touch style) */}
                  <div className="pb-5 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(auto)}
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground text-background hover:opacity-90 py-2.5 text-xs font-bold shadow-xs transition-transform active:scale-95"
                    >
                      <div className="h-5 w-5 rounded-full bg-background text-foreground flex items-center justify-center">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <span>Paramétrer ce flux</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── 5. MINIMALIST CREATE / EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {editingId ? 'Modifier le Scénario' : 'Nouveau Scénario WhatsApp'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Nom du scénario</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Devis Express TW14"
                  className="mt-1 w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">Déclencheur</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  >
                    <option value="keyword">Mot-clé reçu</option>
                    <option value="first_message">Nouveau contact (1er message)</option>
                  </select>
                </div>

                {triggerType === 'keyword' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground">Mot-clé exact</label>
                    <input
                      type="text"
                      required
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      placeholder="Ex: COMMANDE, TARIFS, INFO"
                      className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Action automatique</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                >
                  <option value="send_flow">Envoyer un WhatsApp Flow (Formulaire interactif natif)</option>
                  <option value="send_template">Envoyer un Modèle WhatsApp validé</option>
                  <option value="send_text">Envoyer un message texte simple</option>
                </select>
              </div>

              {actionType === 'send_flow' && (
                <div className="space-y-3 rounded-2xl bg-secondary/30 p-3.5 border border-border">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Choisir le Flow</label>
                    <select
                      value={selectedFlowId}
                      onChange={(e) => setSelectedFlowId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                    >
                      {flows.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Message d&apos;invitation</label>
                    <textarea
                      rows={2}
                      value={flowBodyText}
                      onChange={(e) => setFlowBodyText(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                    />
                  </div>
                </div>
              )}

              {actionType === 'send_text' && (
                <div>
                  <label className="text-xs font-semibold text-foreground">Texte de la réponse</label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez le message de réponse automatique..."
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>
              )}

              {formError && (
                <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Enregistrer le scénario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
