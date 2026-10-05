'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import { ArrowLeft, Loader2, Save, Wrench, FileText, Settings, Key, Store, Zap, Bot } from 'lucide-react'

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.id as string
  const { activeOrganization } = useOrganization()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('FAST')
  const [provider, setProvider] = useState('openai')
  const [customModel, setCustomModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  const availableTools = [
    { id: 'search_products', name: 'Recherche de Produits', desc: 'Permet à l\'agent de chercher dans votre catalogue', icon: <Store className="w-4 h-4"/> },
    { id: 'get_product_details', name: 'Détails Produit', desc: 'Permet à l\'agent de lire les informations précises d\'un produit', icon: <Store className="w-4 h-4"/> },
    { id: 'negotiate_price', name: 'Négociation de Prix', desc: 'Autorise l\'agent à faire des réductions dans les limites fixées', icon: <Store className="w-4 h-4"/> },
    { id: 'create_order', name: 'Création de Commande', desc: 'Permet à l\'agent de préparer un panier pour le client', icon: <Store className="w-4 h-4"/> },
    { id: 'create_payment_link', name: 'Génération de Paiement SasPay', desc: 'Autorise l\'agent à générer et envoyer un lien de paiement', icon: <Store className="w-4 h-4"/> },
    { id: 'list_available_automations', name: 'Lister les Automatisations', desc: 'L\'agent peut voir quels scénarios sont disponibles', icon: <Zap className="w-4 h-4"/> },
    { id: 'run_automation', name: 'Lancer une Automatisation', desc: 'Autorise l\'agent à déclencher vos workflows', icon: <Zap className="w-4 h-4"/> },
    { id: 'handoff_to_human', name: 'Transfert à un Humain', desc: 'L\'agent peut passer le relais à un opérateur', icon: <Wrench className="w-4 h-4"/> },
  ]

  useEffect(() => {
    if (activeOrganization && agentId) {
      loadAgent()
    }
  }, [activeOrganization, agentId])

  async function loadAgent() {
    setLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/agents/${agentId}`, {
        headers: { 'x-organization-id': activeOrganization?.id || '' }
      })
      const data = await res.json()
      if (res.ok && data.agent) {
        setName(data.agent.name || '')
        setDescription(data.agent.description || '')
        setModel(data.agent.agent_config?.model || 'FAST')
        setProvider(data.agent.agent_config?.provider || 'openai')
        setCustomModel(data.agent.agent_config?.custom_model || '')
        setSystemPrompt(data.agent.agent_config?.system_prompt || '')
        setTemperature(data.agent.agent_config?.temperature || 0.7)
        setSelectedTools(data.tools || [])
      } else {
        setError(data.error || 'Agent introuvable')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/whatsapp/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization?.id || ''
        },
        body: JSON.stringify({
          name,
          description,
          agent_config: {
            model,
            provider,
            custom_model: customModel.trim() || undefined,
            system_prompt: systemPrompt,
            temperature,
            max_tokens: 1000
          },
          tools: selectedTools
        })
      })

      if (!res.ok) {
        alert('Erreur lors de la sauvegarde')
      } else {
        // Optionnel : Notification de succès
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  function toggleTool(toolId: string) {
    setSelectedTools(prev => 
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 mb-20">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/agents')}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux agents
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer les modifications
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuration de l'Agent : {name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustez le comportement, l'intelligence et les capacités de votre assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Identité & Modèle */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Général
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
              />
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              Intelligence
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fournisseur</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="openai">OpenAI (Standard)</option>
                <option value="agentrouter">AgentRouter (Multi-modèles unifié : Claude, GPT, DeepSeek...)</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="google">Google Gemini</option>
              </select>
            </div>

            {provider === 'agentrouter' && (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">🌐 Passerelle AgentRouter</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">Clé Unique</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Un seul endpoint compatible OpenAI (<code className="text-foreground">https://co.agentrouter.org/v1</code>) avec <strong>secours automatique (fallback)</strong> : si un modèle ne répond pas, Whatooz bascule instantanément sur le suivant.
                </p>
                <div>
                  <label className="block font-medium mb-1 text-foreground">Modèle Principal</label>
                  <select
                    value={['', 'claude-opus-4-8', 'claude-opus-5', 'gpt-6-astra', 'deepseek-v4-flash'].includes(customModel) ? customModel : (customModel ? 'custom' : '')}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setCustomModel('custom-model-id')
                      } else {
                        setCustomModel(e.target.value)
                      }
                    }}
                    className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary mb-1.5"
                  >
                    <option value="">Automatique selon le niveau (avec fallback)</option>
                    <option value="claude-opus-4-8">Claude Opus 4.8 (Recommandé - Équilibré & Précis)</option>
                    <option value="claude-opus-5">Claude Opus 5 (Avancé & Raisonnement)</option>
                    <option value="gpt-6-astra">OpenAI GPT-6 Astra (Haute performance)</option>
                    <option value="deepseek-v4-flash">DeepSeek V4 Flash (Ultra-rapide & Économique)</option>
                    <option value="custom">Autre modèle (ID manuel)...</option>
                  </select>
                  {((!['', 'claude-opus-4-8', 'claude-opus-5', 'gpt-6-astra', 'deepseek-v4-flash'].includes(customModel)) || customModel === 'custom-model-id') && (
                    <input
                      type="text"
                      value={customModel === 'custom-model-id' ? '' : customModel}
                      onChange={e => setCustomModel(e.target.value)}
                      placeholder="Ex: claude-opus-4-8, gpt-6-astra..."
                      className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Chaîne de fallback : {customModel || 'Par défaut'} ➔ claude-opus-4-8 ➔ claude-opus-5 ➔ gpt-6-astra ➔ deepseek-v4-flash
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Modèle (Niveau)</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="FAST">Rapide (Ex: DeepSeek V4 Flash, GPT-4o-mini)</option>
                <option value="BALANCED">Équilibré (Ex: Claude Opus 4.8, GPT-4o)</option>
                <option value="ADVANCED">Avancé (Ex: Claude Opus 5, GPT-6 Astra)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex justify-between">
                <span>Température (Créativité)</span>
                <span>{temperature}</span>
              </label>
              <input
                type="range"
                min="0" max="1" step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">0 = Précis/Strict, 1 = Créatif/Libre</p>
            </div>
          </div>
        </div>

        {/* Right Column: Prompt & Tools */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              Instructions Système (System Prompt)
            </h3>
            <p className="text-sm text-muted-foreground">
              Définissez la personnalité de l'agent, ses règles strictes, et la façon dont il doit s'adresser aux clients.
            </p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-mono resize-y min-h-[250px]"
              placeholder="Tu es un vendeur expert chez Whatooz..."
            />
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              Outils et Compétences (Tools)
            </h3>
            <p className="text-sm text-muted-foreground">
              Autorisez l'agent à effectuer des actions réelles ou à lire des données. L'agent n'aura accès qu'aux outils cochés.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {availableTools.map(tool => {
                const isActive = selectedTools.includes(tool.id)
                return (
                  <div 
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`cursor-pointer border rounded-xl p-3 flex items-start gap-3 transition-all ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-secondary hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{tool.name}</h4>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">{tool.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
