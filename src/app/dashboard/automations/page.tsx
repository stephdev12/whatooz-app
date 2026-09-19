'use client'

import { useEffect, useState } from 'react'
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
  Power,
  Image as ImageIcon,
  CheckCircle2,
  Edit3,
  Copy,
  ArrowRight,
  GitBranch,
  Sparkles,
  Bot,
  SlidersHorizontal,
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

  // Modal create / edit
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState<'keyword' | 'first_message'>('keyword')
  const [triggerValue, setTriggerValue] = useState('')
  const [actionType, setActionType] = useState<'send_template' | 'send_flow' | 'send_text'>('send_template')

  // Template Action Config
  const [selectedTemplateName, setSelectedTemplateName] = useState('')
  const [selectedTemplateLang, setSelectedTemplateLang] = useState('fr')
  const [headerImageUrl, setHeaderImageUrl] = useState('')
  const [bodyVariables, setBodyVariables] = useState<string[]>([])

  // Flow Action Config
  const [selectedFlowId, setSelectedFlowId] = useState('')
  const [flowCta, setFlowCta] = useState('Remplir le formulaire')
  const [flowBodyText, setFlowBodyText] = useState('Bonjour ! Veuillez compléter ce formulaire :')

  // Text Action Config
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
      setError('Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingId(null)
    setName('')
    setTriggerType('keyword')
    setTriggerValue('')
    setActionType('send_template')
    setSelectedTemplateName('')
    setSelectedTemplateLang('fr')
    setHeaderImageUrl('')
    setBodyVariables([])
    setSelectedFlowId('')
    setFlowCta('Remplir le formulaire')
    setFlowBodyText('Bonjour ! Veuillez compléter ce formulaire :')
    setReplyText('')
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
    if (auto.action_type === 'send_template') {
      setSelectedTemplateName(payload.template_name || '')
      setSelectedTemplateLang(payload.language_code || 'fr')
      setHeaderImageUrl(payload.header_image_url || '')
      setBodyVariables(payload.body_variables || [])
    } else if (auto.action_type === 'send_flow') {
      setSelectedFlowId(payload.flow_id || '')
      setFlowCta(payload.flow_cta || 'Remplir le formulaire')
      setFlowBodyText(payload.body_text || 'Bonjour ! Veuillez compléter ce formulaire :')
    } else if (auto.action_type === 'send_text') {
      setReplyText(payload.text || '')
    }

    setFormError('')
    setShowModal(true)
  }

  function handleDuplicate(auto: Automation) {
    openEditModal(auto)
    setEditingId(null)
    setName(`${auto.name} (Copie)`)
    if (auto.trigger_type === 'keyword' && auto.trigger_value) {
      setTriggerValue(`${auto.trigger_value}_2`)
    }
  }

  // When a template is selected, detect if it requires an image header or body variables
  function handleSelectTemplate(tplName: string) {
    setSelectedTemplateName(tplName)
    const tpl = templates.find((t) => t.name === tplName)
    if (!tpl) return

    setSelectedTemplateLang(tpl.language || 'fr')

    // Check image header
    const hasImage = tpl.components?.some((c) => c.type === 'HEADER' && c.format === 'IMAGE')
    if (hasImage && !headerImageUrl) {
      setHeaderImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80')
    }

    // Check body variables
    const bodyComp = tpl.components?.find((c) => c.type === 'BODY')
    const matches = bodyComp?.text?.match(/\{\{(\d+)\}\}/g) || []
    setBodyVariables(new Array(matches.length).fill(''))
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
      alert('Erreur lors du basculement')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer définitivement l'automatisation "${name}" ?`)) return
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
      setFormError('Le nom du flux est obligatoire.')
      return
    }

    if (triggerType === 'keyword' && !triggerValue.trim()) {
      setFormError('Veuillez indiquer le mot-clé déclencheur (ex: DEVIS, INFO).')
      return
    }

    let payload: Record<string, unknown> = {}
    if (actionType === 'send_template') {
      if (!selectedTemplateName) {
        setFormError('Veuillez choisir un template WhatsApp.')
        return
      }
      payload = {
        template_name: selectedTemplateName,
        language_code: selectedTemplateLang,
        header_image_url: headerImageUrl.trim() || undefined,
        body_variables: bodyVariables.filter((v) => v.trim().length > 0),
      }
    } else if (actionType === 'send_flow') {
      if (!selectedFlowId) {
        setFormError('Veuillez sélectionner un WhatsApp Flow.')
        return
      }
      payload = {
        flow_id: selectedFlowId,
        flow_cta: flowCta.trim() || 'Ouvrir',
        body_text: flowBodyText.trim() || 'Veuillez remplir ce formulaire',
      }
    } else if (actionType === 'send_text') {
      if (!replyText.trim()) {
        setFormError('Veuillez rédiger le message de réponse texte.')
        return
      }
      payload = {
        text: replyText.trim(),
      }
    }

    setSaving(true)
    try {
      if (editingId) {
        // UPDATE existing
        const res = await fetch('/api/whatsapp/automations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: name.trim(),
            trigger_type: triggerType,
            trigger_value: triggerType === 'keyword' ? triggerValue.trim().toUpperCase() : null,
            action_type: actionType,
            action_payload: payload,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setFormError(data.error || 'Échec de la mise à jour')
          return
        }
      } else {
        // CREATE new
        const res = await fetch('/api/whatsapp/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            trigger_type: triggerType,
            trigger_value: triggerType === 'keyword' ? triggerValue.trim().toUpperCase() : null,
            action_type: actionType,
            action_payload: payload,
            is_active: true,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setFormError(data.error || 'Échec de la création')
          return
        }
      }

      setShowModal(false)
      setEditingId(null)
      await loadData()
    } catch {
      setFormError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const selectedTemplateObj = templates.find((t) => t.name === selectedTemplateName)
  const isImageTemplate = selectedTemplateObj?.components?.some(
    (c) => c.type === 'HEADER' && c.format === 'IMAGE'
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <GitBranch className="h-6 w-6 text-[#fe5105]" />
            Automatisations & Flux Visuels (Style n8n / WACRM)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez vos déclencheurs (Mots-clés, Nouveaux contacts) à vos actions WhatsApp (Flows natifs, Templates multimédias, Réponses IA)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#fe5105]/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau Flux d&apos;Automatisation
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Automations Node-Based Canvas / List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{automations.length} flux connecté{automations.length !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Architecture Node ➔ Trigger ➔ Action
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 rounded-2xl border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-[#fe5105]" />
          </div>
        ) : automations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fe5105]/10 text-[#fe5105] mb-3">
              <GitBranch className="h-7 w-7" />
            </div>
            <p className="text-base font-semibold text-foreground">Aucun flux d&apos;automatisation configuré</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Créez votre premier workflow visuel (style n8n / WACRM) pour répondre instantanément à vos clients lorsqu&apos;ils écrivent un mot-clé ou prennent contact pour la première fois.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white hover:bg-[#fe5105]/90 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Créer mon premier flux
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((auto) => {
              const payload = auto.action_payload || {}
              return (
                <div
                  key={auto.id}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-[#fe5105]/40 hover:shadow-md',
                    auto.is_active ? 'border-border' : 'border-border/60 opacity-75 bg-card/60'
                  )}
                >
                  {/* Top bar of the Workflow Node Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fe5105]/10 text-[#fe5105]">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-foreground">{auto.name}</span>
                      </div>
                    </div>

                    {/* Stats & Status Badges */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Zap className="h-3 w-3 text-[#fe5105]" />
                        {auto.executions_count} exécution{auto.executions_count !== 1 ? 's' : ''}
                      </span>
                      {auto.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>

                  {/* VISUAL NODE CONNECTORS (n8n / WACRM style) */}
                  <div className="mt-4 flex flex-col md:flex-row items-center gap-3">
                    {/* NODE 1: TRIGGER */}
                    <div className="w-full md:w-5/12 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Node Déclencheur (Trigger)
                        </span>
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-500">
                          ENTRÉE
                        </span>
                      </div>

                      <div className="mt-2 flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">
                          {auto.trigger_type === 'keyword' ? '#' : '👋'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {auto.trigger_type === 'keyword'
                              ? 'Mot-clé détecté dans le message'
                              : 'Premier message d’un nouveau contact'}
                          </p>
                          {auto.trigger_type === 'keyword' && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Si le texte contient :{' '}
                              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono font-bold text-blue-500">
                                {auto.trigger_value}
                              </span>
                            </p>
                          )}
                          {auto.trigger_type === 'first_message' && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Dès qu&apos;une personne vous écrit pour la première fois
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CONNECTING ARROW & WIRE */}
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-1 md:py-0">
                      <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-mono font-medium text-foreground shadow-xs">
                        <span>Passe à</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#fe5105]" />
                      </div>
                    </div>

                    {/* NODE 2: ACTION */}
                    <div className="w-full md:w-5/12 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          Node Action (WhatsApp)
                        </span>
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-500">
                          SORTIE
                        </span>
                      </div>

                      <div className="mt-2 flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                          {auto.action_type === 'send_template' && <FileText className="h-4 w-4" />}
                          {auto.action_type === 'send_flow' && <Layers className="h-4 w-4" />}
                          {auto.action_type === 'send_text' && <MessageSquare className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {auto.action_type === 'send_template' && (
                              <span>Template : {payload.template_name}</span>
                            )}
                            {auto.action_type === 'send_flow' && (
                              <span>Formulaire WhatsApp Flow</span>
                            )}
                            {auto.action_type === 'send_text' && <span>Message Texte Automatique</span>}
                          </p>

                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {auto.action_type === 'send_template' && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span>Langue: {payload.language_code || 'fr'}</span>
                                {payload.header_image_url && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1 py-0.2 text-[10px] font-semibold text-emerald-500">
                                    <ImageIcon className="h-2.5 w-2.5" /> + Image d&apos;en-tête
                                  </span>
                                )}
                              </div>
                            )}

                            {auto.action_type === 'send_flow' && (
                              <p className="truncate">
                                Bouton : <span className="font-semibold text-foreground">&quot;{payload.flow_cta || 'Remplir'}&quot;</span>
                              </p>
                            )}

                            {auto.action_type === 'send_text' && (
                              <p className="line-clamp-1 italic">
                                &quot;{payload.text}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD CONTROLS & ACTIONS */}
                    <div className="w-full md:w-2/12 flex md:flex-col items-center justify-end gap-1.5 pt-2 md:pt-0">
                      <button
                        onClick={() => openEditModal(auto)}
                        className="flex-1 md:flex-none flex w-full items-center justify-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        title="Modifier les nœuds et réglages de ce flux"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-foreground" />
                        Modifier
                      </button>

                      <button
                        onClick={() => handleDuplicate(auto)}
                        className="flex-1 md:flex-none flex w-full items-center justify-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        title="Dupliquer ce flux"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        Dupliquer
                      </button>

                      <button
                        onClick={() => handleToggle(auto.id, auto.is_active)}
                        className={cn(
                          'flex-1 md:flex-none flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                          auto.is_active
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                        title={auto.is_active ? 'Désactiver le flux' : 'Activer le flux'}
                      >
                        <Power className="h-3.5 w-3.5" />
                        {auto.is_active ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        onClick={() => handleDelete(auto.id, auto.name)}
                        className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CREATE & EDIT VISUAL NODE WORKFLOW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <GitBranch className="h-5 w-5 text-[#fe5105]" />
                  {editingId ? 'Modifier le Flux d’Automatisation' : 'Nouveau Flux d’Automatisation'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Architecture en 2 Nœuds connectés : Déclencheur (Trigger) ➔ Action WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* LIVE NODE VISUAL PREVIEW AT TOP OF MODAL */}
            <div className="mt-4 rounded-xl border border-border bg-secondary/15 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Aperçu du Flux en cours de conception :
              </span>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-blue-500 font-semibold flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {triggerType === 'keyword' ? `Mot-clé: "${triggerValue || '...'}"` : 'Premier Message'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#fe5105]" />
                <span className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-purple-500 font-semibold flex items-center gap-1">
                  {actionType === 'send_template' && <FileText className="h-3 w-3" />}
                  {actionType === 'send_flow' && <Layers className="h-3 w-3" />}
                  {actionType === 'send_text' && <MessageSquare className="h-3 w-3" />}
                  {actionType === 'send_template' && (selectedTemplateName ? `Template "${selectedTemplateName}"` : 'Template WhatsApp')}
                  {actionType === 'send_flow' && 'WhatsApp Flow'}
                  {actionType === 'send_text' && 'Message Texte'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Nom du flux d&apos;automatisation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réponse automatique Devis & Tarifs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              {/* NODE 1: TRIGGER */}
              <div className="space-y-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">1</span>
                    Nœud Déclencheur (Trigger)
                  </label>
                  <span className="text-[10px] text-blue-500 font-semibold">Quand activer ce flux ?</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTriggerType('keyword')}
                    className={cn(
                      'rounded-lg border p-2.5 text-left text-xs transition-colors',
                      triggerType === 'keyword'
                        ? 'border-blue-500 bg-blue-500/15 text-foreground font-semibold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Mot-clé spécifique
                    <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                      Le client tape un mot (ex: DEVIS, COMMANDE)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriggerType('first_message')}
                    className={cn(
                      'rounded-lg border p-2.5 text-left text-xs transition-colors',
                      triggerType === 'first_message'
                        ? 'border-blue-500 bg-blue-500/15 text-foreground font-semibold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Premier message
                    <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                      Dès qu’un nouveau contact vous écrit
                    </p>
                  </button>
                </div>

                {triggerType === 'keyword' && (
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-foreground">
                      Mot-clé déclencheur (insensible à la casse) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: DEVIS (ou TARIFS, CATALOGUE)"
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs font-mono uppercase text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>
                )}
              </div>

              {/* NODE 2: ACTION */}
              <div className="space-y-2 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">2</span>
                    Nœud Action (WhatsApp)
                  </label>
                  <span className="text-[10px] text-purple-500 font-semibold">Que faire en réponse ?</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActionType('send_template')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center text-xs transition-colors',
                      actionType === 'send_template'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-500 font-semibold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    Template WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('send_flow')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center text-xs transition-colors',
                      actionType === 'send_flow'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-500 font-semibold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Layers className="h-4 w-4" />
                    WhatsApp Flow
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('send_text')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center text-xs transition-colors',
                      actionType === 'send_text'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-500 font-semibold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Texte
                  </button>
                </div>

                {/* Template Action Details */}
                {actionType === 'send_template' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] font-medium text-foreground">
                        Sélectionner le Template WhatsApp approuvé *
                      </label>
                      <select
                        required
                        value={selectedTemplateName}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                      >
                        <option value="">-- Choisir un template --</option>
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.name}>
                            {tpl.name} ({tpl.language}) — {tpl.status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Image Header Support for Template */}
                    {isImageTemplate && (
                      <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <ImageIcon className="h-3.5 w-3.5 text-[#fe5105]" />
                          URL de l’image d’en-tête (Obligatoire pour ce template)
                        </label>
                        <input
                          type="url"
                          required
                          value={headerImageUrl}
                          onChange={(e) => setHeaderImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Cette image sera envoyée dans l’en-tête multimédia du template lors de l’exécution de l’automatisation.
                        </p>
                        {headerImageUrl && (
                          <div className="mt-2 h-24 w-full overflow-hidden rounded-lg border border-border">
                            <img
                              src={headerImageUrl}
                              alt="Aperçu de l'en-tête"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dynamic Variables */}
                    {bodyVariables.length > 0 && (
                      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                        <p className="text-xs font-semibold text-foreground">
                          Variables dynamiques du template :
                        </p>
                        {bodyVariables.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-12 text-xs font-mono text-[#fe5105]">{`{{${idx + 1}}}`}</span>
                            <input
                              type="text"
                              required
                              value={val}
                              onChange={(e) => {
                                const next = [...bodyVariables]
                                next[idx] = e.target.value
                                setBodyVariables(next)
                              }}
                              placeholder={`Valeur pour {{${idx + 1}}}`}
                              className="flex-1 rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Flow Action Details */}
                {actionType === 'send_flow' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] font-medium text-foreground">
                        Sélectionner le WhatsApp Flow *
                      </label>
                      <select
                        required
                        value={selectedFlowId}
                        onChange={(e) => setSelectedFlowId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                      >
                        <option value="">-- Choisir un Flow --</option>
                        {flows.map((f) => (
                          <option key={f.id} value={f.meta_flow_id || f.id}>
                            {f.name} — Statut: {f.status}
                          </option>
                        ))}
                      </select>
                      {flows.length === 0 && (
                        <p className="mt-1 text-[11px] text-amber-500">
                          Aucun Flow trouvé. Rendez-vous dans la section &quot;Flows&quot; pour créer un formulaire.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-foreground">
                        Texte du bouton CTA du Flow
                      </label>
                      <input
                        type="text"
                        value={flowCta}
                        onChange={(e) => setFlowCta(e.target.value)}
                        placeholder="Ex: Remplir la demande"
                        maxLength={20}
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-foreground">
                        Message accompagnant le formulaire
                      </label>
                      <textarea
                        rows={2}
                        value={flowBodyText}
                        onChange={(e) => setFlowBodyText(e.target.value)}
                        placeholder="Ex: Bonjour ! Pour votre devis, veuillez remplir ces quelques questions :"
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                      />
                    </div>
                  </div>
                )}

                {/* Text Action Details */}
                {actionType === 'send_text' && (
                  <div className="space-y-1 pt-2">
                    <label className="text-[11px] font-medium text-foreground">
                      Message de réponse automatique *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Ex: Bonjour ! Nous avons bien reçu votre message. Notre équipe commerciale vous répond sous 15 minutes."
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>
                )}
              </div>

              {formError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#fe5105]/90 disabled:opacity-50 shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {saving
                    ? 'Enregistrement...'
                    : editingId
                    ? 'Mettre à jour le flux'
                    : 'Activer le flux connecté'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
