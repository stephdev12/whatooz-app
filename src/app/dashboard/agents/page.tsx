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
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-6 space-y-6 sm:space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Agents IA</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              {agents.length} / {plan.limits.aiAgents} ({plan.name})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configurez des agents autonomes pour répondre à vos clients, vendre et assister.
          </p>
        </div>
        {isLimitReached ? (
          <button
            onClick={() => router.push('/dashboard/settings/billing')}
            className="w-full sm:w-auto bg-secondary text-foreground hover:bg-secondary/80 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-border transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Lock className="w-4 h-4 text-primary" />
            <span>Limite atteinte ({plan.limits.aiAgents}) • Mettre à niveau</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard/agents/new')}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un agent</span>
          </button>
        )}
      </div>

      {isLimitReached && (
        <div className="p-3.5 sm:p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start sm:items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Vous avez atteint la limite de <strong>{plan.limits.aiAgents} agent(s) IA</strong> incluse dans votre forfait <strong>{plan.name}</strong>.
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/billing')}
            className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-105 inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Débloquer plus d&apos;agents</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 sm:p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="text-center py-12 sm:py-20 bg-card border border-border rounded-2xl sm:rounded-3xl shadow-sm px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#fe5105]/10 text-[#fe5105] rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">Aucun Agent IA configuré</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            Créez votre premier agent pour automatiser le support et les ventes sur vos discussions WhatsApp.
          </p>
          <button
            onClick={() => router.push('/dashboard/agents/new')}
            className="mt-6 w-full sm:w-auto border border-border text-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Créer maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-[#fe5105]/10 text-[#fe5105] rounded-xl shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{agent.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      Modèle : {agent.agent_config?.model || 'FAST'}
                    </p>
                  </div>
                </div>
                {/* Active Toggle */}
                <div className="shrink-0 ml-2">
                  <Switch
                    checked={agent.status === 'ACTIVE'}
                    onCheckedChange={() => handleToggle(agent.id, agent.status)}
                    ariaLabel={`Activer ou désactiver l'agent ${agent.name}`}
                  />
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-4 bg-secondary/50 rounded-xl p-3 border border-border/60 text-xs sm:text-sm text-muted-foreground">
                <p className="line-clamp-3 leading-relaxed">{agent.description || 'Aucune description fournie.'}</p>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  className="flex-1 bg-secondary hover:bg-accent text-foreground py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configurer</span>
                </button>
                <button
                  onClick={() => handleDelete(agent.id, agent.name)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                  title="Supprimer l'agent"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
