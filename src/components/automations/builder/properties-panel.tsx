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
} from 'lucide-react'

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
                <optgroup label="IA & Intégrations">
                  <option value="ai_agent">Agent IA Whatooz</option>
                  <option value="http_request">Requête HTTP (Webhook / API)</option>
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
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Message d'invitation</label>
                  <textarea
                    rows={2}
                    placeholder="Voici votre lien sécurisé pour régler votre commande :"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
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
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Montant fixe en FCFA (Optionnel)
                  </label>
                  <input
                    type="number"
                    placeholder="Laisser vide pour montant dynamique du panier"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
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
                </div>
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

            {/* HTTP REQUEST */}
            {selectedNode.data.actionType === 'http_request' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Méthode HTTP</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs"
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
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">URL de destination</label>
                  <input
                    type="url"
                    placeholder="https://api.monsite.com/webhook"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs font-mono"
                    value={((selectedNode.data.actionPayload as any)?.url as string) || ''}
                    onChange={(e) =>
                      handleChange('actionPayload', {
                        ...((selectedNode.data.actionPayload as any) || {}),
                        url: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Corps JSON</label>
                  <VariableTextarea
                    rows={3}
                    placeholder={`{\n  "phone": "{{ contact.phone }}",\n  "nom": "{{ contact.name }}"\n}`}
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
