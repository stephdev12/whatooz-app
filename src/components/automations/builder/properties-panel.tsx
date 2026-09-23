import React, { useEffect, useState } from 'react'
import { Node } from '@xyflow/react'
import { BuilderNode } from './types'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { VariableTextarea } from '@/components/ui/variable-textarea'
import { Copy, Check } from 'lucide-react'

interface PropertiesPanelProps {
  selectedNode: BuilderNode
  onUpdateNode: (nodeId: string, data: any) => void
}

export function PropertiesPanel({ selectedNode, onUpdateNode }: PropertiesPanelProps) {
  const { activeOrganization } = useOrganization()
  const [flows, setFlows] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => {
    if (!activeOrganization) return;
    const loadData = async () => {
      try {
        const resTemplates = await fetch('/api/whatsapp/templates', {
          headers: { 'x-organization-id': activeOrganization.id }
        })
        if (resTemplates.ok) {
          const { templates } = await resTemplates.json()
          if (templates) setTemplates(templates)
        }

        const resFlows = await fetch('/api/whatsapp/flows', {
          headers: { 'x-organization-id': activeOrganization.id }
        })
        if (resFlows.ok) {
          const { flows } = await resFlows.json()
          if (flows) setFlows(flows.filter((f: any) => f.status === 'PUBLISHED'))
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
  }, [activeOrganization])

  const handleChange = (key: string, value: any) => {
    onUpdateNode(selectedNode.id, { [key]: value })
  }

  return (
    <div className="w-80 bg-card border-l border-border shadow-sm p-4 h-full overflow-y-auto">
      <h2 className="font-semibold text-foreground mb-4">Configuration</h2>
      
      <div className="space-y-4">
        {/* GLOBAL LABEL */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Nom du bloc</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
            value={selectedNode.data.label as string}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>

        {/* TRIGGER PROPERTIES */}
        {selectedNode.type === 'triggerNode' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Type de déclencheur</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={selectedNode.data.triggerType as string}
                onChange={(e) => handleChange('triggerType', e.target.value)}
              >
                <option value="keyword">Mot-clé</option>
                <option value="new_contact">Nouveau contact</option>
                <option value="menu_click">Clic sur menu</option>
                <option value="flow_completed">Formulaire Flow soumis</option>
                <option value="order_created">Commande créée (Panier Meta)</option>
                <option value="payment_confirmed">Paiement SasPay confirmé</option>
                <option value="payment_failed">Paiement SasPay échoué</option>
                <option value="api_request">Requête API (Webhook)</option>
              </select>
            </div>
            
            {selectedNode.data.triggerType === 'keyword' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Mot-clé exact</label>
                <input
                  type="text"
                  placeholder="Ex: DEVIS"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                  value={(selectedNode.data.triggerValue as string) || ''}
                  onChange={(e) => handleChange('triggerValue', e.target.value)}
                />
              </div>
            )}
            
            {selectedNode.data.triggerType === 'api_request' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">URL Webhook</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      className="w-full px-3 py-2 border border-border bg-muted/50 text-muted-foreground rounded-md text-xs font-mono"
                      value={`https://api.whatooz.com/v1/webhooks/automation/${typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'ID'}`}
                    />
                    <button
                      onClick={() => {
                        const id = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'ID'
                        navigator.clipboard.writeText(`https://api.whatooz.com/v1/webhooks/automation/${id}`)
                      }}
                      className="p-2 border border-border rounded-md hover:bg-muted"
                      title="Copier l'URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Faites une requête POST vers cette URL avec un corps JSON.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Variables attendues (JSON)</label>
                  <input
                    type="text"
                    placeholder="Ex: phone, code_2fa"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                    value={(selectedNode.data.webhookConfig as any)?.expectedFields?.join(', ') || ''}
                    onChange={(e) => {
                      const fields = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      handleChange('webhookConfig', { ...selectedNode.data.webhookConfig as any, expectedFields: fields })
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">Séparez les clés par des virgules. Elles seront utilisables avec <code>{"{{webhook.cle}}"}</code>.</p>
                </div>
              </div>
            )}
            
            {selectedNode.data.triggerType === 'flow_completed' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Restreindre à un Flow (Optionnel)</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                    value={(selectedNode.data.triggerValue as string) || ''}
                    onChange={(e) => handleChange('triggerValue', e.target.value)}
                  >
                    <option value="">Tous les Flows</option>
                    {flows.map(f => (
                      <option key={f.id} value={f.meta_flow_id || f.id}>{f.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">Laissez vide pour déclencher pour n'importe quel formulaire.</p>
                </div>

                {Boolean(selectedNode.data.triggerValue) && (
                  <div className="space-y-1 mt-2">
                    <label className="text-xs font-medium text-foreground">Variables disponibles</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-border max-h-40 overflow-y-auto">
                      {(() => {
                        const flowId = selectedNode.data.triggerValue as string;
                        const flow = flows.find(f => f.meta_flow_id === flowId || f.id === flowId);
                        if (!flow || !flow.flow_json || !flow.flow_json.screens) {
                          return <p className="text-xs text-muted-foreground">Aucune donnée trouvée.</p>;
                        }

                        const vars: string[] = [];
                        const extract = (obj: any) => {
                          if (!obj || typeof obj !== 'object') return;
                          if (obj.name && typeof obj.name === 'string' && obj.type && obj.type !== 'Screen') {
                            vars.push(obj.name);
                          }
                          Object.values(obj).forEach(val => extract(val));
                        };
                        extract(flow.flow_json.screens);
                        const uniqueVars = Array.from(new Set(vars));

                        if (uniqueVars.length === 0) {
                          return <p className="text-xs text-muted-foreground">Aucune variable détectée.</p>;
                        }

                        return (
                          <ul className="space-y-1.5">
                            {uniqueVars.map(v => {
                              const CopyButton = () => {
                                const [copied, setCopied] = React.useState(false);
                                return (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`{{flow.response.${v}}}`);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                    title="Copier la variable"
                                  >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )
                              };
                              return (
                                <li key={v} className="flex items-center justify-between text-xs group bg-white dark:bg-slate-800 p-1.5 rounded-md border border-border shadow-sm">
                                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate mr-2">
                                    {v}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <code className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-blue-100 dark:border-blue-800">
                                      {`{{flow.response.${v}}}`}
                                    </code>
                                    <CopyButton />
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ACTION PROPERTIES */}
        {selectedNode.type === 'actionNode' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Action à effectuer</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={selectedNode.data.actionType as string}
                onChange={(e) => handleChange('actionType', e.target.value)}
              >
                <option value="send_message">Envoyer un message</option>
                <option value="send_template">Envoyer un Template</option>
                <option value="send_flow">Envoyer un Flow</option>
                <option value="send_product">Envoyer un Produit</option>
                <option value="send_product_list">Envoyer une Liste de Produits</option>
                <option value="send_catalog">Envoyer le Catalogue</option>
                <option value="create_saspay_payment">Demande de Paiement SasPay</option>
                <option value="http_request">Requête HTTP (Webhook / API)</option>
              </select>
            </div>

            {selectedNode.data.actionType === 'send_message' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Contenu du message</label>
                <VariableTextarea
                  rows={4}
                  placeholder="Bonjour, comment puis-je vous aider ? (Utilisez {{flow.response.nom}} pour les variables)"
                  value={((selectedNode.data.actionPayload as any)?.text as string) || ''}
                  onChange={(e) => handleChange('actionPayload', { ...((selectedNode.data.actionPayload as any) || {}), text: e.target.value })}
                />
              </div>
            )}

            {selectedNode.data.actionType === 'send_product' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">ID du Catalogue</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                    value={((selectedNode.data.actionPayload as any)?.catalogId as string) || ''}
                    onChange={(e) => handleChange('actionPayload', { ...((selectedNode.data.actionPayload as any) || {}), catalogId: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">ID Retailer du Produit</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                    value={((selectedNode.data.actionPayload as any)?.productRetailerId as string) || ''}
                    onChange={(e) => handleChange('actionPayload', { ...((selectedNode.data.actionPayload as any) || {}), productRetailerId: e.target.value })}
                  />
                </div>
              </div>
            )}

            {selectedNode.data.actionType === 'http_request' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Méthode HTTP</label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                    value={((selectedNode.data.actionPayload as any)?.method as string) || 'POST'}
                    onChange={(e) => handleChange('actionPayload', { ...((selectedNode.data.actionPayload as any) || {}), method: e.target.value })}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">URL de destination</label>
                  <input
                    type="url"
                    placeholder="https://api.monserveur.com/webhook"
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                    value={((selectedNode.data.actionPayload as any)?.url as string) || ''}
                    onChange={(e) => handleChange('actionPayload', { ...((selectedNode.data.actionPayload as any) || {}), url: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Body JSON (optionnel)</label>
                  <VariableTextarea
                    rows={4}
                    placeholder={`{\n  "nom": "{{flow.response.nom}}"\n}`}
                    className="font-mono text-xs"
                    value={((selectedNode.data.actionPayload as any)?.body as string) || ''}
                    onChange={(e) => handleChange('actionPayload', { ...((selectedNode.data.actionPayload as any) || {}), body: e.target.value })}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* SEND TEMPLATE PROPERTIES */}
        {selectedNode.type === 'actionNode' && selectedNode.data.actionType === 'send_template' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Modèle (Template)</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.templateId as string) || ''}
                onChange={(e) => handleChange('templateId', e.target.value)}
              >
                <option value="">Sélectionner un modèle...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Mapping des Variables</label>
              <p className="text-[10px] text-muted-foreground">
                Associez les variables du modèle (ex: 1, 2) aux champs du webhook.
              </p>
              
              {(() => {
                const mapping = (selectedNode.data.actionPayload as any)?.templateVariablesMapping || {}
                const entries = Object.entries(mapping)
                return (
                  <div className="space-y-2">
                    {entries.map(([key, val], idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Ex: 1"
                          className="w-1/3 px-2 py-1.5 border border-border bg-background rounded-md text-xs font-mono"
                          value={key}
                          onChange={(e) => {
                            const newMapping = { ...mapping }
                            const oldVal = newMapping[key]
                            delete newMapping[key]
                            if (e.target.value) {
                              newMapping[e.target.value] = val
                            }
                            handleChange('actionPayload', { ...selectedNode.data.actionPayload as any, templateVariablesMapping: newMapping })
                          }}
                        />
                        <span className="text-xs text-muted-foreground">=</span>
                        <input
                          type="text"
                          placeholder="Champ webhook"
                          className="flex-1 px-2 py-1.5 border border-border bg-background rounded-md text-xs"
                          value={val as string}
                          onChange={(e) => {
                            const newMapping = { ...mapping, [key]: e.target.value }
                            handleChange('actionPayload', { ...selectedNode.data.actionPayload as any, templateVariablesMapping: newMapping })
                          }}
                        />
                        <button
                          onClick={() => {
                            const newMapping = { ...mapping }
                            delete newMapping[key]
                            handleChange('actionPayload', { ...selectedNode.data.actionPayload as any, templateVariablesMapping: newMapping })
                          }}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newMapping = { ...mapping, ['']: '' }
                        handleChange('actionPayload', { ...selectedNode.data.actionPayload as any, templateVariablesMapping: newMapping })
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Ajouter une variable
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* SEND FLOW PROPERTIES */}
        {selectedNode.type === 'actionNode' && selectedNode.data.actionType === 'send_flow' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Flux WhatsApp (Flow)</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.flowId as string) || ''}
                onChange={(e) => handleChange('flowId', e.target.value)}
              >
                <option value="">Sélectionner un flux publié...</option>
                {flows.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1 mt-4">
              <label className="text-xs font-medium text-foreground">Message d'accroche (Call to action)</label>
              <textarea
                rows={3}
                placeholder="Veuillez remplir ce formulaire :"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.ctaMessage as string) || ''}
                onChange={(e) => handleChange('ctaMessage', e.target.value)}
              />
            </div>
            <div className="space-y-1 mt-4">
              <label className="text-xs font-medium text-foreground">Texte du bouton</label>
              <input
                type="text"
                placeholder="Ouvrir le formulaire"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.buttonText as string) || ''}
                onChange={(e) => handleChange('buttonText', e.target.value)}
              />
            </div>
          </>
        )}

        {/* SEND CATALOG PROPERTIES */}
        {selectedNode.type === 'actionNode' && selectedNode.data.actionType === 'send_catalog' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Message d'accompagnement</label>
            <textarea
              rows={3}
              placeholder="Voici notre catalogue de produits :"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
              value={(selectedNode.data.catalogMessage as string) || ''}
              onChange={(e) => handleChange('catalogMessage', e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-1">Le catalogue complet ou le mini-site sera envoyé automatiquement au client.</p>
          </div>
        )}

        {/* REQUEST PAYMENT PROPERTIES */}
        {selectedNode.type === 'actionNode' && selectedNode.data.actionType === 'request_payment' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Message de demande de paiement</label>
              <textarea
                rows={3}
                placeholder="Veuillez régler votre commande via SasPay :"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.paymentMessage as string) || ''}
                onChange={(e) => handleChange('paymentMessage', e.target.value)}
              />
            </div>
            <div className="space-y-1 mt-4">
              <label className="text-xs font-medium text-foreground">Montant par défaut (Optionnel)</label>
              <input
                type="number"
                placeholder="Laisser vide pour montant dynamique"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.paymentAmount as string) || ''}
                onChange={(e) => handleChange('paymentAmount', e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Génère un lien de paiement SasPay dynamique basé sur le panier.</p>
          </>
        )}

        {/* CONDITION PROPERTIES */}
        {selectedNode.type === 'conditionNode' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Type de condition</label>
              <select
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={selectedNode.data.conditionType as string}
                onChange={(e) => handleChange('conditionType', e.target.value)}
              >
                <option value="equals">Est égal à</option>
                <option value="contains">Contient</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Valeur à tester</label>
              <input
                type="text"
                placeholder="Ex: OUI"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
                value={(selectedNode.data.conditionValue as string) || ''}
                onChange={(e) => handleChange('conditionValue', e.target.value)}
              />
            </div>
          </>
        )}

        {/* DELAY PROPERTIES */}
        {selectedNode.type === 'delayNode' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Temps d'attente (minutes)</label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm"
              value={(selectedNode.data.delayMinutes as number) || 1}
              onChange={(e) => handleChange('delayMinutes', parseInt(e.target.value, 10))}
            />
          </div>
        )}

      </div>
    </div>
  )
}
