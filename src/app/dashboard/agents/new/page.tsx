'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import { usePlanAccess } from '@/hooks/use-plan-access'
import { ArrowLeft, Loader2, Sparkles, Lock } from 'lucide-react'

export default function NewAgentPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  const { plan, canAccess } = usePlanAccess()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState('openai')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

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
        setFormError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setFormError('Erreur de connexion au serveur')
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

      {formError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings/billing')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 inline-flex items-center gap-1 shrink-0 ml-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mettre à niveau
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de l&apos;agent</label>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Fournisseur d&apos;IA</label>
            {!canAccess('multiModelRouting') && (
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3 text-primary" /> Routage multi-fournisseurs : Forfait Business
              </span>
            )}
          </div>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
          >
            <option value="openai">OpenAI / Modèle Rapide (Inclus)</option>
            {canAccess('multiModelRouting') ? (
              <>
                <option value="openrouter">OpenRouter (Multi-modèles : Claude, GPT-4o, DeepSeek)</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="google">Google Gemini</option>
              </>
            ) : (
              <option value="openrouter" disabled>
                OpenRouter, Claude, DeepSeek (Réservé au forfait Business)
              </option>
            )}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {canAccess('multiModelRouting')
              ? 'Routage dynamique actif entre plusieurs fournisseurs pour optimiser coûts et performances.'
              : 'Modèle IA économique et réactif préconfiguré pour vos conversations WhatsApp.'}
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
