'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewAgentPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState('openai')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization?.id || ''
        },
        body: JSON.stringify({
          name,
          description,
          model: 'FAST', // Default
          provider
        })
      })

      const data = await res.json()
      if (res.ok && data.agent) {
        router.push(`/dashboard/agents/${data.agent.id}`)
      } else {
        alert(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      alert('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <button
        onClick={() => router.push('/dashboard/agents')}
        className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux agents
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouvel Agent IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Donnez un nom à votre assistant avant de configurer son comportement.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de l'agent</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Assistant Vente"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Gère les questions sur les produits et propose des paiements."
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fournisseur d'IA</label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
          >
            <option value="openai">OpenAI (Standard)</option>
            <option value="agentrouter">AgentRouter (Multi-modèles unifié : Claude, GPT, DeepSeek...)</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="google">Google Gemini</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {provider === 'agentrouter' 
              ? 'AgentRouter vous permet d\'accéder à Claude 3.5, GPT-4o, DeepSeek avec une clé unique.' 
              : 'Vous pourrez affiner les modèles et instructions à l\'étape suivante.'}
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !name}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer et configurer
          </button>
        </div>
      </form>
    </div>
  )
}
