'use client'

import React, { useEffect, useState } from 'react'
import { BuilderNode } from './types'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { VariableTextarea } from '@/components/ui/variable-textarea'
import {
  Copy,
  Check,
  X,
  Trash2,
  Tag,
  UserCheck,
  Bot,
  Layers,
  Sparkles,
  ArrowRight,
  GitBranch,
  Plus,
  Trash,
  Globe,
  Send,
  Table,
  Calendar,
  FileText,
  Key,
  Play,
  Loader2,
  AlertCircle,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'

interface PropertiesPanelProps {
  selectedNode: BuilderNode
  onUpdateNode: (nodeId: string, data: any) => void
  onDeleteNode?: (nodeId: string) => void
  onClose?: () => void
}

export function PropertiesPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onClose,
}: PropertiesPanelProps) {
  const { activeOrganization } = useOrganization()
  const [flows, setFlows] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [aiAgents, setAiAgents] = useState<any[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [testingNode, setTestingNode] = useState(false)

  const handleTestSingleNode = async () => {
    if (!activeOrganization) return
    setTestingNode(true)
    try {
      const res = await fetch('/api/whatsapp/automations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({
          singleNode: selectedNode,
          testContact: { name: 'Client Test', phone: '22501020304' },
          testMessage: { text: 'Test Whatooz' },
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (selectedNode.data.actionType === 'create_saspay_payment') {
          toast.success(`Lien SasPay généré avec succès !`, {
            description: `Lien: ${data.output?.checkoutUrl} (${data.output?.amount} FCFA)`,
            duration: 8000,
          })
        } else if (selectedNode.data.actionType === 'telegram_message') {
          toast.success(`Message Telegram envoyé avec succès !`, {
            description: `Message ID: ${data.output?.result?.message_id || 'OK'}`,
            duration: 6000,
          })
        } else {
          toast.success(`Nœud exécuté avec succès !`)
        }
      } else {
        toast.error(`Erreur d'exécution`, {
          description: data.error || 'Une erreur est survenue lors du test',
          duration: 9000,
        })
      }
    } catch (e: any) {
      toast.error(`Erreur réseau: ${e.message}`)
    } finally {
      setTestingNode(false)
    }
  }

  useEffect(() => {
    if (!activeOrganization) return
    const loadData = async () => {
      try {
        const resTemplates = await fetch('/api/whatsapp/templates', {
          headers: { 'x-organization-id': activeOrganization.id },
        })
        if (resTemplates.ok) {
          const { templates } = await resTemplates.json()
          if (templates) setTemplates(templates)
        }

        const resFlows = await fetch('/api/whatsapp/flows', {
          headers: { 'x-organization-id': activeOrganization.id },
        })
        if (resFlows.ok) {
          const { flows } = await resFlows.json()
          if (flows) setFlows(flows.filter((f: any) => f.status === 'PUBLISHED'))
        }

        const supabase = createClient()
        const { data: catData } = await supabase
          .from('meta_catalogs')
          .select('*')
          .eq('organization_id', activeOrganization.id)
        if (catData) setCatalogs(catData)

        const { data: prodData } = await supabase
          .from('meta_catalog_products')
          .select('*')
          .eq('organization_id', activeOrganization.id)
        if (prodData) setProducts(prodData)

        const { data: agentData } = await supabase
          .from('ai_agents')
          .select('id, name, model')
          .eq('organization_id', activeOrganization.id)
        if (agentData) setAiAgents(agentData)
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
  }, [activeOrganization])

  const handleChange = (key: string, value: any) => {
    onUpdateNode(selectedNode.id, { [key]: value })
  }

  const handleCopyVar = (variable: string) => {
    navigator.clipboard.writeText(variable)
    setCopiedKey(variable)
    setTimeout(() => setCopiedKey(null), 1800)
  }

  const appendVariableToPayloadField = (field: string, variableText: string) => {
    const currentPayload = (selectedNode.data.actionPayload as any) || {}
    const currentVal = currentPayload[field] || ''
    const newVal = currentVal ? `${currentVal} ${variableText}` : variableText
    handleChange('actionPayload', { ...currentPayload, [field]: newVal })
  }

  return (
    <div className="w-full md:w-88 bg-card border-l border-border shadow-sm p-4 h-full overflow-y-auto relative flex flex-col justify-between">
      <div className="space-y-5">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm text-foreground">Configuration du Bloc</h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              ID: {selectedNode.id.slice(0, 8)}...
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Block Label */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Titre du bloc</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            value={(selectedNode.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        {/* ============================================================== */}
        {/* TRIGGER PROPERTIES                                             */}
        {/* ============================================================== */}
        {selectedNode.type === 'triggerNode' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Événement déclencheur</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                value={(selectedNode.data.triggerType as string) || 'keyword'}
                onChange={(e) => handleChange('triggerType', e.target.value)}
              >
                <option value="keyword">Mot-clé ou texte dans le message</option>
                <option value="first_message">Premier message (Nouveau contact)</option>
                <option value="flow_completed">Formulaire Flow WhatsApp soumis</option>
                <option value="order_created">Commande créée (Panier catalogue Meta)</option>
                <option value="api_request">Webhook API entrant (POST)</option>
              </select>
            </div>

            {selectedNode.data.triggerType === 'keyword' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mot-clé attendu</label>
                <input
                  type="text"
                  placeholder="Ex: INFO, PRIX, BONJOUR (ou laisser vide pour tout message)"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                  value={(selectedNode.data.triggerValue as string) || ''}
                  onChange={(e) => handleChange('triggerValue', e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Insensible à la casse. Si vide, le workflow se déclenche sur n'importe quel message texte.
                </p>
              </div>
            )}

            {selectedNode.data.triggerType === 'flow_completed' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Restreindre à un Flow précis</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={(selectedNode.data.triggerValue as string) || ''}
                    onChange={(e) => handleChange('triggerValue', e.target.value)}
                  >
                    <option value="">Tous les formulaires Flow</option>
                    {flows.map((f) => (
                      <option key={f.id} value={f.meta_flow_id || f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inspect Flow variables */}
                {Boolean(selectedNode.data.triggerValue) && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Variables disponibles dans les étapes suivantes
                    </label>
                    <div className="bg-muted/40 p-2.5 rounded-lg border border-border space-y-1.5 max-h-40 overflow-y-auto">
                      {(() => {
                        const flowId = selectedNode.data.triggerValue as string
                        const flow = flows.find(
                          (f) => f.meta_flow_id === flowId || f.id === flowId
                        )
                        if (!flow?.flow_json?.screens) {
                          return (
                            <p className="text-[11px] text-muted-foreground">
                              Sélectionnez un Flow avec des champs valides.
                            </p>
                          )
                        }
                        const vars: string[] = []
                        const extract = (obj: any) => {
                          if (!obj || typeof obj !== 'object') return
                          if (obj.name && typeof obj.name === 'string' && obj.type !== 'Screen') {
                            vars.push(obj.name)
                          }
                          Object.values(obj).forEach((val) => extract(val))
                        }
                        extract(flow.flow_json.screens)
                        const uniqueVars = Array.from(new Set(vars))

                        return uniqueVars.map((v) => (
                          <div
                            key={v}
                            onClick={() => handleCopyVar(`{{ flow.response.${v} }}`)}
                            className="flex items-center justify-between p-1.5 bg-background rounded border border-border text-[11px] font-mono cursor-pointer hover:border-primary/50"
                          >
                            <span>{'{{ flow.response.' + v + ' }}'}</span>
                            {copiedKey === `{{ flow.response.${v} }}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedNode.data.triggerType === 'api_request' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">URL Webhook</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      className="w-full px-2.5 py-1.5 border border-border bg-muted/60 text-muted-foreground rounded-lg text-[10px] font-mono"
                      value={`https://api.whatooz.com/v1/webhooks/automation/${typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'ID'}`}
                    />
                    <button
                      onClick={() => {
                        const id =
                          typeof window !== 'undefined'
                            ? window.location.pathname.split('/').pop()
                            : 'ID'
                        handleCopyVar(`https://api.whatooz.com/v1/webhooks/automation/${id}`)
                      }}
                      className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ACTION PROPERTIES                                              */}
        {/* ============================================================== */}
        {selectedNode.type === 'actionNode' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Action à exécuter</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                value={(selectedNode.data.actionType as string) || 'send_message'}
                onChange={(e) => handleChange('actionType', e.target.value)}
              >
                <optgroup label="WhatsApp">
                  <option value="send_message">Envoyer un Message Texte</option>
                  <option value="send_template">Envoyer un Modèle (Template)</option>
                  <option value="send_flow">Envoyer un Flow WhatsApp</option>
                </optgroup>
                <optgroup label="Commerce & SasPay">
                  <option value="create_saspay_payment">Demande de Paiement SasPay</option>
                  <option value="send_catalog">Envoyer le Catalogue</option>
                  <option value="send_product">Envoyer un Produit</option>
                  <option value="send_product_list">Envoyer une Liste de Produits</option>
                  <option value="send_product_carousel">Envoyer un Carousel de Produits</option>
                </optgroup>
                <optgroup label="CRM & Équipe">
                  <option value="add_tag">Ajouter un Tag CRM</option>
                  <option value="remove_tag">Retirer un Tag CRM</option>
                  <option value="assign_agent">Assigner à un Conseiller</option>
                </optgroup>
                <optgroup label="Intégrations & Outils">
                  <option value="ai_agent">Agent IA Whatooz</option>
                  <option value="http_request">Requête HTTP (Webhook / API)</option>
                  <option value="telegram_message">Telegram Bot</option>
                  <option value="google_sheets">Google Sheets</option>
                  <option value="google_calendar">Google Calendar</option>
                  <option value="notion">Notion</option>
                </optgroup>
              </select>
            </div>

            {/* SEND MESSAGE */}
            {selectedNode.data.actionType === 'send_message' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Texte du message</label>
                </div>
                <VariableTextarea
                  rows={4}
                  placeholder="Bonjour {{contact.name}} ! Comment pouvons-nous vous aider ?"
                  value={((selectedNode.data.actionPayload as any)?.text as string) || ''}
                  onChange={(e) =>
                    handleChange('actionPayload', {
                      ...((selectedNode.data.actionPayload as any) || {}),
                      text: e.target.value,
                    })
                  }
                />
                {/* Variable injection chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Insérer une variable :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['{{ contact.name }}', '{{ contact.phone }}', '{{ message.text }}'].map(
                      (pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => appendVariableToPayloadField('text', pill)}
                          className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border transition-colors"
                        >
                          {pill}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEND TEMPLATE */}
            {selectedNode.data.actionType === 'send_template' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Modèle (Template Meta)</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={(selectedNode.data.templateId as string) || ''}
                    onChange={(e) => handleChange('templateId', e.target.value)}
                  >
                    <option value="">Sélectionner un modèle...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.language || 'fr'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Image d'en-tête (Optionnel)
                  </label>
                  <input
                    type="url"
                    placeholder="https://mon-site.com/image.png"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.headerImageUrl as string) || ''
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        headerImageUrl: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* SEND FLOW */}
            {selectedNode.data.actionType === 'send_flow' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Flow WhatsApp</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={(selectedNode.data.flowId as string) || ''}
                    onChange={(e) => handleChange('flowId', e.target.value)}
                  >
                    <option value="">Sélectionner un flow publié...</option>
                    {flows.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Texte du bouton CTA</label>
                  <input
                    type="text"
                    placeholder="Ouvrir le formulaire"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={(selectedNode.data.buttonText as string) || 'Ouvrir'}
                    onChange={(e) => handleChange('buttonText', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Message d'accroche</label>
                  <textarea
                    rows={2}
                    placeholder="Veuillez remplir vos informations ci-dessous :"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={(selectedNode.data.ctaMessage as string) || ''}
                    onChange={(e) => handleChange('ctaMessage', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* SASPAY PAYMENT */}
            {selectedNode.data.actionType === 'create_saspay_payment' && (
              <div className="space-y-3.5">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Passerelle SasPay Sécurisée</span>
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    Ce bloc génère une session de paiement officielle SasPay (Wave, Orange Money, MoMo, Carte) et transmet le lien sécurisé au client.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Message d'invitation</label>
                  <VariableTextarea
                    rows={2}
                    placeholder="Voici votre lien sécurisé pour régler votre commande :"
                    value={
                      ((selectedNode.data.actionPayload as any)?.paymentMessage as string) || ''
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        paymentMessage: e.target.value,
                      })
                    }
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['{{ amount }}', '{{ contact.name }}', '{{ order.id }}'].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => appendVariableToPayloadField('paymentMessage', pill)}
                        className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Montant en FCFA
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5000 ou {{ order.total }}"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-semibold"
                    value={
                      ((selectedNode.data.actionPayload as any)?.paymentAmount as string) || ''
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        paymentAmount: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Montant fixe ou variable dynamique. Si vide, utilise le total du panier WhatsApp.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Description du paiement</label>
                  <input
                    type="text"
                    placeholder="Commande {{ contact.name }}"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.paymentDescription as string) || ''
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        paymentDescription: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Clé API Secrète SasPay (Optionnel)
                  </label>
                  <input
                    type="password"
                    placeholder="sk_live_... (laisser vide pour la clé globale)"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={
                      ((selectedNode.data.actionPayload as any)?.saspayApiKey as string) || ''
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        saspayApiKey: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestSingleNode}
                  disabled={testingNode}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {testingNode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Tester la génération de lien SasPay</span>
                </button>
              </div>
            )}

            {/* SEND CATALOG */}
            {selectedNode.data.actionType === 'send_catalog' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Catalogue</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={((selectedNode.data.actionPayload as any)?.catalogId as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        catalogId: e.target.value,
                      })
                    }
                  >
                    <option value="">Sélectionner un catalogue...</option>
                    {catalogs.map((c) => (
                      <option key={c.meta_catalog_id} value={c.meta_catalog_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ADD / REMOVE TAG */}
            {(selectedNode.data.actionType === 'add_tag' ||
              selectedNode.data.actionType === 'remove_tag') && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Nom du Tag CRM</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="VIP, Lead Chaud, Client..."
                    className="w-full pl-9 pr-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-semibold"
                    value={((selectedNode.data.actionPayload as any)?.tagName as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        tagName: e.target.value,
                      })
                    }
                  />
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Client VIP', 'Prospect Chaud', 'Relance', 'SAV', 'Paiement En Attente'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            tagName: tag,
                          })
                        }
                        className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"
                      >
                        +{tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* AI AGENT */}
            {selectedNode.data.actionType === 'ai_agent' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Instructions pour l'Agent IA
                </label>
                <VariableTextarea
                  rows={4}
                  placeholder="Tu es l'assistant commercial Whatooz. Réponds aux questions sur les tarifs et propose de passer commande..."
                  value={((selectedNode.data.actionPayload as any)?.prompt as string) || ''}
                  onChange={(e) =>
                    handleChange('actionPayload', {
                      ...((selectedNode.data.actionPayload as any) || {}),
                      prompt: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* HTTP REQUEST (n8n-style) */}
            {selectedNode.data.actionType === 'http_request' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-1/3 space-y-1">
                    <label className="text-xs font-semibold text-foreground">Méthode</label>
                    <select
                      className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-semibold"
                      value={
                        ((selectedNode.data.actionPayload as any)?.method as string) || 'POST'
                      }
                      onChange={(e) =>
                        handleChange('actionPayload', {
                          ...((selectedNode.data.actionPayload as any) || {}),
                          method: e.target.value,
                        })
                      }
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-foreground">URL Endpoint</label>
                    <input
                      type="url"
                      placeholder="https://api.monsite.com/v1/resource"
                      className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                      value={((selectedNode.data.actionPayload as any)?.url as string) || ''}
                      onChange={(e) =>
                        handleChange('actionPayload', {
                          ...((selectedNode.data.actionPayload as any) || {}),
                          url: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Authentication mode */}
                <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-muted-foreground" />
                    <label className="text-xs font-semibold text-foreground">Authentification</label>
                  </div>
                  <select
                    className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.authType as string) || 'none'
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        authType: e.target.value,
                      })
                    }
                  >
                    <option value="none">Aucune authentification</option>
                    <option value="bearer">Bearer Token (Authorization: Bearer ...)</option>
                    <option value="basic">Basic Auth (Utilisateur & Mot de passe)</option>
                    <option value="header">Header Personnalisé (ex: X-API-Key)</option>
                    <option value="query">Paramètre Query (ex: ?api_key=...)</option>
                  </select>

                  {((selectedNode.data.actionPayload as any)?.authType === 'bearer') && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] text-muted-foreground">Bearer Token</label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOi..."
                        className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                        value={((selectedNode.data.actionPayload as any)?.authToken as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            authToken: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {((selectedNode.data.actionPayload as any)?.authType === 'basic') && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Nom d'utilisateur</label>
                        <input
                          type="text"
                          placeholder="admin"
                          className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs"
                          value={((selectedNode.data.actionPayload as any)?.authUsername as string) || ''}
                          onChange={(e) =>
                            handleChange('actionPayload', {
                              ...((selectedNode.data.actionPayload as any) || {}),
                              authUsername: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Mot de passe</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs"
                          value={((selectedNode.data.actionPayload as any)?.authPassword as string) || ''}
                          onChange={(e) =>
                            handleChange('actionPayload', {
                              ...((selectedNode.data.actionPayload as any) || {}),
                              authPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {((selectedNode.data.actionPayload as any)?.authType === 'header') && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Nom du Header</label>
                        <input
                          type="text"
                          placeholder="X-API-KEY"
                          className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                          value={((selectedNode.data.actionPayload as any)?.authHeaderName as string) || ''}
                          onChange={(e) =>
                            handleChange('actionPayload', {
                              ...((selectedNode.data.actionPayload as any) || {}),
                              authHeaderName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Valeur secrète</label>
                        <input
                          type="password"
                          placeholder="secret_token..."
                          className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                          value={((selectedNode.data.actionPayload as any)?.authHeaderValue as string) || ''}
                          onChange={(e) =>
                            handleChange('actionPayload', {
                              ...((selectedNode.data.actionPayload as any) || {}),
                              authHeaderValue: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {((selectedNode.data.actionPayload as any)?.authType === 'query') && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Nom Paramètre</label>
                        <input
                          type="text"
                          placeholder="api_key"
                          className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                          value={((selectedNode.data.actionPayload as any)?.authQueryName as string) || ''}
                          onChange={(e) =>
                            handleChange('actionPayload', {
                              ...((selectedNode.data.actionPayload as any) || {}),
                              authQueryName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Valeur</label>
                        <input
                          type="password"
                          placeholder="token123"
                          className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                          value={((selectedNode.data.actionPayload as any)?.authQueryValue as string) || ''}
                          onChange={(e) =>
                            handleChange('actionPayload', {
                              ...((selectedNode.data.actionPayload as any) || {}),
                              authQueryValue: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Body configuration (if not GET) */}
                {((selectedNode.data.actionPayload as any)?.method !== 'GET') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Type de Corps</label>
                      <select
                        className="px-2 py-1 border border-border bg-background text-foreground rounded-md text-[11px]"
                        value={((selectedNode.data.actionPayload as any)?.contentType as string) || 'json'}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            contentType: e.target.value,
                          })
                        }
                      >
                        <option value="json">JSON (application/json)</option>
                        <option value="form">Form Data / URL Encoded</option>
                        <option value="raw">Texte brut</option>
                      </select>
                    </div>

                    <VariableTextarea
                      rows={4}
                      placeholder={`{\n  "phone": "{{ contact.phone }}",\n  "name": "{{ contact.name }}",\n  "timestamp": "{{ now }}"\n}`}
                      className="font-mono text-[11px]"
                      value={((selectedNode.data.actionPayload as any)?.body as string) || ''}
                      onChange={(e) =>
                        handleChange('actionPayload', {
                          ...((selectedNode.data.actionPayload as any) || {}),
                          body: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* Timeout */}
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Délai d'expiration (Timeout ms)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    className="w-full px-2.5 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={((selectedNode.data.actionPayload as any)?.timeoutMs as number) || 15000}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        timeoutMs: parseInt(e.target.value, 10) || 15000,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* TELEGRAM BOT */}
            {selectedNode.data.actionType === 'telegram_message' && (
              <div className="space-y-3.5">
                <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-[11px] text-sky-900 dark:text-sky-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                    <Send className="w-3.5 h-3.5" />
                    <span>Configuration Telegram</span>
                  </div>
                  <ul className="text-[10px] space-y-0.5 list-disc list-inside text-muted-foreground">
                    <li>1. Créez un bot avec <b>@BotFather</b> et collez son Token.</li>
                    <li>2. <b>Important :</b> Envoyez <b>/start</b> à votre bot sur Telegram pour autoriser les messages.</li>
                    <li>3. Obtenez votre Chat ID personnel avec <b>@userinfobot</b> (ou l'ID du groupe).</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Opération Telegram</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.telegramOperation as string) || 'send_message'
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        telegramOperation: e.target.value,
                      })
                    }
                  >
                    <option value="send_message">Envoyer un Message Texte</option>
                    <option value="send_photo">Envoyer une Photo / Image</option>
                    <option value="send_document">Envoyer un Document / Fichier</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Token du Bot Telegram</label>
                  <input
                    type="password"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={((selectedNode.data.actionPayload as any)?.telegramBotToken as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        telegramBotToken: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Format : <code>123456789:AAF_abcdefghij...</code> fourni par @BotFather.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">ID du Chat / Canal</label>
                  <input
                    type="text"
                    placeholder="Ex: 123456789 ou -100123456789"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={((selectedNode.data.actionPayload as any)?.telegramChatId as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        telegramChatId: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Écrivez à <b>@userinfobot</b> sur Telegram pour obtenir instantanément votre Id numérique.
                  </p>
                </div>

                {((selectedNode.data.actionPayload as any)?.telegramOperation === 'send_message' ||
                  !(selectedNode.data.actionPayload as any)?.telegramOperation) && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Texte du message</label>
                    <VariableTextarea
                      rows={4}
                      placeholder="🚨 <b>Nouvelle notification Whatooz</b>&#10;Client: {{ contact.name }}&#10;Numéro: {{ contact.phone }}&#10;Message: {{ message.text }}"
                      className="text-xs"
                      value={((selectedNode.data.actionPayload as any)?.telegramText as string) || ''}
                      onChange={(e) =>
                        handleChange('actionPayload', {
                          ...((selectedNode.data.actionPayload as any) || {}),
                          telegramText: e.target.value,
                        })
                      }
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['{{ contact.name }}', '{{ contact.phone }}', '{{ message.text }}', '{{ now }}'].map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => appendVariableToPayloadField('telegramText', pill)}
                          className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {((selectedNode.data.actionPayload as any)?.telegramOperation === 'send_photo' ||
                  (selectedNode.data.actionPayload as any)?.telegramOperation === 'send_document') && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">URL du média</label>
                      <input
                        type="url"
                        placeholder="https://monsite.com/image.jpg"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                        value={((selectedNode.data.actionPayload as any)?.telegramMediaUrl as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            telegramMediaUrl: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Légende (Caption)</label>
                      <input
                        type="text"
                        placeholder="Document pour {{ contact.name }}"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                        value={((selectedNode.data.actionPayload as any)?.telegramCaption as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            telegramCaption: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTestSingleNode}
                  disabled={testingNode}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {testingNode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Tester l'envoi sur Telegram</span>
                </button>
              </div>
            )}

            {/* GOOGLE SHEETS */}
            {selectedNode.data.actionType === 'google_sheets' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Opération</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.sheetsOperation as string) || 'append_row'
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        sheetsOperation: e.target.value,
                      })
                    }
                  >
                    <option value="append_row">Ajouter une nouvelle ligne (Append)</option>
                    <option value="read_rows">Lire des lignes / plage (Read)</option>
                    <option value="clear">Vider une plage (Clear)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Mode de Connexion</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.sheetsAuthMode as string) || 'webhook_url'
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        sheetsAuthMode: e.target.value,
                      })
                    }
                  >
                    <option value="webhook_url">Webhook Google Apps Script (Simple & Gratuit)</option>
                    <option value="api_key_or_token">API Google Sheets v4 (Bearer Token)</option>
                  </select>
                </div>

                {((selectedNode.data.actionPayload as any)?.sheetsAuthMode === 'webhook_url' ||
                  !(selectedNode.data.actionPayload as any)?.sheetsAuthMode) && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">URL Webhook Apps Script</label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                      value={((selectedNode.data.actionPayload as any)?.sheetsWebhookUrl as string) || ''}
                      onChange={(e) =>
                        handleChange('actionPayload', {
                          ...((selectedNode.data.actionPayload as any) || {}),
                          sheetsWebhookUrl: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Déployez une application Web Google Apps Script et collez son URL ici.
                    </p>
                  </div>
                )}

                {((selectedNode.data.actionPayload as any)?.sheetsAuthMode === 'api_key_or_token') && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Token OAuth / Bearer</label>
                      <input
                        type="password"
                        placeholder="ya29.a0AfH6SM..."
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                        value={((selectedNode.data.actionPayload as any)?.sheetsApiKeyOrToken as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            sheetsApiKeyOrToken: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">ID du Tableur (Spreadsheet ID)</label>
                      <input
                        type="text"
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                        value={((selectedNode.data.actionPayload as any)?.sheetsSpreadsheetId as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            sheetsSpreadsheetId: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nom de la feuille / Onglet</label>
                  <input
                    type="text"
                    placeholder="Feuille 1"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={((selectedNode.data.actionPayload as any)?.sheetsSheetName as string) || 'Feuille 1'}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        sheetsSheetName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Colonnes & Données (JSON)</label>
                  <VariableTextarea
                    rows={4}
                    placeholder={`{\n  "Date": "{{ now }}",\n  "Nom": "{{ contact.name }}",\n  "Téléphone": "{{ contact.phone }}"\n}`}
                    className="font-mono text-[11px]"
                    value={((selectedNode.data.actionPayload as any)?.sheetsRowData as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        sheetsRowData: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* GOOGLE CALENDAR */}
            {selectedNode.data.actionType === 'google_calendar' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Opération</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.calendarOperation as string) || 'create_event'
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        calendarOperation: e.target.value,
                      })
                    }
                  >
                    <option value="create_event">Créer un événement / rendez-vous</option>
                    <option value="list_events">Consulter les prochains événements</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Token OAuth Google Calendar</label>
                  <input
                    type="password"
                    placeholder="ya29.a0AfH6SM..."
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={((selectedNode.data.actionPayload as any)?.calendarAuthToken as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        calendarAuthToken: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">ID du Calendrier</label>
                  <input
                    type="text"
                    placeholder="primary (ou adresse email de l'agenda)"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={((selectedNode.data.actionPayload as any)?.calendarId as string) || 'primary'}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        calendarId: e.target.value,
                      })
                    }
                  />
                </div>

                {((selectedNode.data.actionPayload as any)?.calendarOperation === 'create_event' ||
                  !(selectedNode.data.actionPayload as any)?.calendarOperation) && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Titre de l'événement</label>
                      <input
                        type="text"
                        placeholder="Rendez-vous Whatooz : {{ contact.name }}"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                        value={((selectedNode.data.actionPayload as any)?.calendarSummary as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            calendarSummary: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Date & Heure de début</label>
                      <input
                        type="text"
                        placeholder="2026-10-24T14:00:00Z ou {{ flow.response.date }}"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                        value={((selectedNode.data.actionPayload as any)?.calendarStartTime as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            calendarStartTime: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Email du participant</label>
                      <input
                        type="email"
                        placeholder="client@email.com ou {{ flow.response.email }}"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                        value={((selectedNode.data.actionPayload as any)?.calendarAttendeeEmail as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            calendarAttendeeEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTION */}
            {selectedNode.data.actionType === 'notion' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Opération Notion</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={
                      ((selectedNode.data.actionPayload as any)?.notionOperation as string) || 'create_page'
                    }
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        notionOperation: e.target.value,
                      })
                    }
                  >
                    <option value="create_page">Créer une page dans une base (Database Item)</option>
                    <option value="append_block">Ajouter un bloc à une page (Append Block)</option>
                    <option value="query_database">Consulter une base de données (Query)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Clé API d'Intégration Notion</label>
                  <input
                    type="password"
                    placeholder="secret_ABC123xyz..."
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={((selectedNode.data.actionPayload as any)?.notionApiKey as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        notionApiKey: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Créée sur notion.so/my-integrations. N'oubliez pas d'inviter l'intégration dans votre base !
                  </p>
                </div>

                {((selectedNode.data.actionPayload as any)?.notionOperation === 'create_page' ||
                  !(selectedNode.data.actionPayload as any)?.notionOperation) && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">ID de la Base Notion</label>
                      <input
                        type="text"
                        placeholder="32 caractères alphanumériques"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                        value={((selectedNode.data.actionPayload as any)?.notionDatabaseId as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            notionDatabaseId: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Titre de la page</label>
                      <input
                        type="text"
                        placeholder="Nouveau contact : {{ contact.name }}"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                        value={((selectedNode.data.actionPayload as any)?.notionPageTitle as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            notionPageTitle: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Propriétés additionnelles (JSON)</label>
                      <VariableTextarea
                        rows={3}
                        placeholder={`{\n  "Téléphone": { "phone_number": "{{ contact.phone }}" }\n}`}
                        className="font-mono text-[11px]"
                        value={((selectedNode.data.actionPayload as any)?.notionPropertiesJson as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            notionPropertiesJson: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {((selectedNode.data.actionPayload as any)?.notionOperation === 'append_block') && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">ID de la Page Notion</label>
                      <input
                        type="text"
                        placeholder="Page ID"
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                        value={((selectedNode.data.actionPayload as any)?.notionPageId as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            notionPageId: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Contenu à ajouter</label>
                      <VariableTextarea
                        rows={3}
                        placeholder="Note ajoutée pour {{ contact.name }} : {{ message.text }}"
                        value={((selectedNode.data.actionPayload as any)?.notionContent as string) || ''}
                        onChange={(e) =>
                          handleChange('actionPayload', {
                            ...((selectedNode.data.actionPayload as any) || {}),
                            notionContent: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* CONDITION PROPERTIES                                           */}
        {/* ============================================================== */}
        {selectedNode.type === 'conditionNode' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Champ à évaluer</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                value={(selectedNode.data.conditionField as string) || 'message.text'}
                onChange={(e) => handleChange('conditionField', e.target.value)}
              >
                <option value="message.text">Texte du message reçu (message.text)</option>
                <option value="contact.name">Nom du client (contact.name)</option>
                <option value="contact.phone">Numéro de téléphone (contact.phone)</option>
                <option value="order.total">Montant total de commande (order.total)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Opérateur</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                value={(selectedNode.data.conditionType as string) || 'equals'}
                onChange={(e) => handleChange('conditionType', e.target.value)}
              >
                <option value="equals">Est égal à (=)</option>
                <option value="not_equals">Est différent de (≠)</option>
                <option value="contains">Contient le texte</option>
                <option value="not_contains">Ne contient pas</option>
                <option value="starts_with">Commence par</option>
                <option value="ends_with">Se termine par</option>
                <option value="greater_than">Supérieur à (&gt;)</option>
                <option value="less_than">Inférieur à (&lt;)</option>
                <option value="empty">Est vide</option>
                <option value="not_empty">N'est pas vide</option>
              </select>
            </div>

            {selectedNode.data.conditionType !== 'empty' &&
              selectedNode.data.conditionType !== 'not_empty' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Valeur attendue</label>
                  <input
                    type="text"
                    placeholder="Ex: OUI, VIP, 5000..."
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                    value={(selectedNode.data.conditionValue as string) || ''}
                    onChange={(e) => handleChange('conditionValue', e.target.value)}
                  />
                </div>
              )}

            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300">
              💡 <strong>n8n Branching :</strong> Connectez la sortie <strong>VRAI</strong> vers
              l'action si la condition est remplie, et <strong>FAUX</strong> pour l'alternative.
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DELAY PROPERTIES                                               */}
        {/* ============================================================== */}
        {selectedNode.type === 'delayNode' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Temps d'attente (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
                value={(selectedNode.data.delayMinutes as number) || 1}
                onChange={(e) => handleChange('delayMinutes', parseInt(e.target.value, 10))}
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[1, 5, 15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleChange('delayMinutes', mins)}
                  className="px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground hover:text-foreground border border-border"
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins} min`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Block Button at Bottom */}
      {onDeleteNode && (
        <div className="pt-6 border-t border-border mt-6">
          <button
            type="button"
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer ce bloc</span>
          </button>
        </div>
      )}
    </div>
  )
}
