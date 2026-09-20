'use client'

import React, { useEffect, useState } from 'react'
import {
  Zap,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  X,
  Layers,
  MessageSquare,
  Edit3,
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
  const [actionType, setActionType] = useState<'send_template' | 'send_flow' | 'send_text'>('send_flow')

  // Action Config
  const [selectedTemplateName, setSelectedTemplateName] = useState('')
  const [selectedFlowId, setSelectedFlowId] = useState('')
  const [flowCta, setFlowCta] = useState('Ouvrir le formulaire')
  const [flowBodyText, setFlowBodyText] = useState('Bonjour ! Complétez ce formulaire pour commander :')
  const [replyText, setReplyText] = useState('')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Linear builder step tracking
  const [builderStep, setBuilderStep] = useState(1)

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
      setError('Impossible de charger les données')
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
    setBuilderStep(1)
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
    setBuilderStep(2) // Jump to step 2 when editing (trigger already configured)
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

  async function handleSave() {
    setFormError('')

    if (!name.trim()) {
      setFormError('Donnez un titre à ce scénario.')
      return
    }

    if (triggerType === 'keyword' && !triggerValue.trim()) {
      setFormError('Indiquez le mot-clé.')
      return
    }

    let payload: Record<string, unknown> = {}
    if (actionType === 'send_flow') {
      if (!selectedFlowId) {
        setFormError('Sélectionnez un Flow.')
        return
      }
      payload = {
        flow_id: selectedFlowId,
        flow_cta: flowCta.trim() || 'Ouvrir',
        body_text: flowBodyText.trim(),
      }
    } else if (actionType === 'send_template') {
      if (!selectedTemplateName) {
        setFormError('Sélectionnez un modèle.')
        return
      }
      payload = {
        template_name: selectedTemplateName,
        language_code: 'fr',
      }
    } else if (actionType === 'send_text') {
      if (!replyText.trim()) {
        setFormError('Rédigez le message.')
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

  function actionLabel(type: string) {
    switch (type) {
      case 'send_flow': return 'Envoyer un Flow'
      case 'send_template': return 'Envoyer un Modèle'
      case 'send_text': return 'Réponse texte'
      default: return type
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
            Scénarios
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Automatisez vos réponses WhatsApp
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nouveau scénario</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── Scenario List ─── */}
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#fe5105]" />
        </div>
      ) : automations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Zap className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-foreground">Aucun scénario</p>
          <p className="text-xs text-muted-foreground mt-1">
            Créez votre première réponse automatique
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 rounded-full bg-[#fe5105] text-white px-4 py-1.5 text-xs font-bold shadow-xs hover:bg-[#e04602]"
          >
            + Créer un scénario
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-secondary/30 transition-colors"
            >
              {/* Left: Name + trigger */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                  auto.is_active ? 'bg-[#fe5105]/10 text-[#fe5105]' : 'bg-muted text-muted-foreground'
                )}>
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{auto.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {auto.trigger_type === 'keyword' ? `"${auto.trigger_value}"` : 'Nouveau contact'}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground">
                      {actionLabel(auto.action_type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: toggle + actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-[10px] text-muted-foreground">
                  {auto.executions_count} exéc.
                </span>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(auto.id, auto.is_active)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    auto.is_active ? 'bg-emerald-500' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition',
                      auto.is_active ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>

                <button
                  onClick={() => openEditModal(auto)}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Edit3 className="h-3 w-3" />
                </button>

                <button
                  onClick={() => handleDelete(auto.id, auto.name)}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── LINEAR BUILDER MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                {editingId ? 'Modifier le scénario' : 'Nouveau scénario'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-foreground">Nom du scénario</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Devis Express"
                  className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              {/* ─── Step 1: Trigger (Déclencheur) ─── */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fe5105] text-white text-[10px] font-bold">
                    1
                  </div>
                  <span className="text-xs font-semibold text-foreground">Déclencheur</span>
                </div>

                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                >
                  <option value="keyword">Mot-clé reçu</option>
                  <option value="first_message">Premier message (nouveau contact)</option>
                </select>

                {triggerType === 'keyword' && (
                  <input
                    type="text"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    placeholder="Ex: COMMANDE, TARIFS"
                    className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-[#fe5105]"
                  />
                )}
              </div>

              {/* Vertical connector */}
              <div className="flex justify-center">
                <div className="h-6 w-0.5 bg-border" />
              </div>

              {/* ─── Step 2: Action ─── */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    2
                  </div>
                  <span className="text-xs font-semibold text-foreground">Action</span>
                </div>

                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                >
                  <option value="send_flow">Envoyer un WhatsApp Flow</option>
                  <option value="send_template">Envoyer un Modèle WhatsApp</option>
                  <option value="send_text">Envoyer un message texte</option>
                </select>

                {actionType === 'send_flow' && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={selectedFlowId}
                      onChange={(e) => setSelectedFlowId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                    >
                      {flows.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      rows={2}
                      value={flowBodyText}
                      onChange={(e) => setFlowBodyText(e.target.value)}
                      placeholder="Message d'invitation..."
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                    />
                  </div>
                )}

                {actionType === 'send_template' && (
                  <select
                    value={selectedTemplateName}
                    onChange={(e) => setSelectedTemplateName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}

                {actionType === 'send_text' && (
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre message automatique..."
                    className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                  />
                )}
              </div>

              {formError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
