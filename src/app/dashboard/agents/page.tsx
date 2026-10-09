'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import {
  Bot,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  Edit3,
  Lock,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { usePlanAccess } from '@/hooks/use-plan-access'

interface Agent {
  id: string
  name: string
  description: string
  status: string
  agent_config: any
  created_at: string
}

export default function AgentsPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  const { plan } = usePlanAccess()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isLimitReached = agents.length >= plan.limits.aiAgents

  useEffect(() => {
    if (activeOrganization) {
      loadData()
    }
  }, [activeOrganization])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/whatsapp/agents', { 
        headers: { 'x-organization-id': activeOrganization?.id || '' } 
      })

      const data = await res.json()
      if (res.ok) setAgents(data.agents ?? [])
    } catch {
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const res = await fetch('/api/whatsapp/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': activeOrganization?.id || '' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        )
      }
    } catch {
      alert('Erreur lors de la mise à jour')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer l'agent "${name}" ?`)) return
    try {
      const res = await fetch('/api/whatsapp/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': activeOrganization?.id || '' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== id))
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Agents IA</h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              {agents.length} / {plan.limits.aiAgents} ({plan.name})
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez des agents autonomes pour répondre à vos clients, vendre et assister.
          </p>
        </div>
        {isLimitReached ? (
          <button
            onClick={() => router.push('/dashboard/settings/billing')}
            className="bg-secondary text-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl text-sm font-semibold border border-border transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-primary" />
            <span>Limite atteinte ({plan.limits.aiAgents}) • Mettre à niveau</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard/agents/new')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Créer un agent
          </button>
        )}
      </div>

      {isLimitReached && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Vous avez atteint la limite de <strong>{plan.limits.aiAgents} agent(s) IA</strong> incluse dans votre forfait <strong>{plan.name}</strong>.
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/billing')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 inline-flex items-center gap-1 shrink-0 ml-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Débloquer plus d&apos;agents
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aucun Agent IA</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            Créez votre premier agent pour l'assigner à vos conversations.
          </p>
          <button
            onClick={() => router.push('/dashboard/agents/new')}
            className="mt-6 border border-border text-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Créer maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{agent.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      Modèle : {agent.agent_config?.model || 'FAST'}
                    </p>
                  </div>
                </div>
                {/* Active Toggle */}
                <Switch
                  checked={agent.status === 'ACTIVE'}
                  onCheckedChange={() => handleToggle(agent.id, agent.status)}
                  ariaLabel={`Activer ou désactiver l'agent ${agent.name}`}
                />
              </div>

              <div className="flex-1 space-y-3 mb-6 bg-secondary rounded-xl p-3 border border-border text-sm text-muted-foreground">
                <p className="line-clamp-3">{agent.description || 'Aucune description fournie.'}</p>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  className="flex-1 bg-secondary hover:bg-slate-200 text-foreground py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Configurer
                </button>
                <button
                  onClick={() => handleDelete(agent.id, agent.name)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
