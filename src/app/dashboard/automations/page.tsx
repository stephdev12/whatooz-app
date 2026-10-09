'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import {
  Zap,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  MessageSquare,
  Layers,
  Edit3,
  Lock,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { usePlanAccess } from '@/hooks/use-plan-access'

interface Automation {
  id: string
  name: string
  trigger_type: string
  trigger_value: string | null
  action_type: string
  is_active: boolean
  executions_count: number
  created_at: string
}

export default function AutomationsPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  const { plan } = usePlanAccess()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const activeCount = automations.filter((a) => a.is_active).length
  const isLimitReached = activeCount >= plan.limits.activeAutomations

  useEffect(() => {
    if (activeOrganization) {
      loadData()
    }
  }, [activeOrganization])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const autoRes = await fetch('/api/whatsapp/automations', { 
        headers: { 'x-organization-id': activeOrganization?.id || '' } 
      })

      const autoData = await autoRes.json()
      if (autoRes.ok) setAutomations(autoData.automations ?? [])
    } catch {
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': activeOrganization?.id || '' },
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
        headers: { 'Content-Type': 'application/json', 'x-organization-id': activeOrganization?.id || '' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id))
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
            <h1 className="text-2xl font-bold text-foreground">Scénarios & Automatisations</h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              Actives : {activeCount} / {plan.limits.activeAutomations > 100 ? 'Illimitées' : plan.limits.activeAutomations} ({plan.name})
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez le comportement de votre assistant WhatsApp via l&apos;éditeur visuel (Workflow Builder).
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/automations/builder/new')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer un scénario
        </button>
      </div>

      {isLimitReached && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Vous avez atteint la limite de <strong>{plan.limits.activeAutomations} automatisations actives</strong> sur votre forfait <strong>{plan.name}</strong>.
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/billing')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 inline-flex items-center gap-1 shrink-0 ml-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Débloquer plus d&apos;automatisations
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {automations.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aucun scénario</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            Créez votre premier workflow pour répondre automatiquement aux messages de vos clients.
          </p>
          <button
            onClick={() => router.push('/dashboard/automations/builder/new')}
            className="mt-6 border border-border text-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Créer maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{auto.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      {auto.executions_count} exécution(s)
                    </p>
                  </div>
                </div>
                {/* Active Toggle */}
                <Switch
                  checked={auto.is_active}
                  onCheckedChange={() => handleToggle(auto.id, auto.is_active)}
                  ariaLabel={`Activer ou désactiver le scénario ${auto.name}`}
                />
              </div>

              <div className="space-y-3 mb-6 bg-secondary rounded-xl p-3 border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground w-16">SI :</span>
                  <span className="truncate">
                    {auto.trigger_type === 'keyword' ? `Mot-clé "${auto.trigger_value}"` : 'Premier message'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground w-16">ALORS :</span>
                  <span className="truncate flex items-center gap-1">
                    {auto.action_type === 'send_flow' && <><Layers className="w-3.5 h-3.5" /> Flow</>}
                    {auto.action_type === 'send_template' && <><MessageSquare className="w-3.5 h-3.5" /> Template</>}
                    {auto.action_type === 'send_text' && <><MessageSquare className="w-3.5 h-3.5" /> Message</>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/dashboard/automations/builder/${auto.id}`)}
                  className="flex-1 bg-secondary hover:bg-slate-200 text-foreground py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Éditer
                </button>
                <button
                  onClick={() => handleDelete(auto.id, auto.name)}
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
