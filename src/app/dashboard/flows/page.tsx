'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import {
  Layers,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Flow {
  id: string
  name: string
  status: string
  meta_flow_id: string | null
  created_at: string
}

export default function FlowsPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  const [flows, setFlows] = useState<Flow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!activeOrganization) return
    loadFlows()
  }, [activeOrganization])

  const loadFlows = async (isSync = false) => {
    if (isSync) setIsSyncing(true)
    else setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/flows', {
        headers: { 'x-organization-id': activeOrganization!.id }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement des flux.')
      setFlows(data.flows || [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erreur lors du chargement des flux.')
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }

  const createFlow = async () => {
    if (!activeOrganization) return
    try {
      const supabase = createClient()

      const newFlow = {
        organization_id: activeOrganization.id,
        name: 'Nouveau Flux ' + new Date().toLocaleTimeString(),
        status: 'DRAFT',
        flow_json: { version: '6.0', screens: [] },
      }

      const { data, error: insertError } = await supabase
        .from('whatsapp_flows')
        .insert([newFlow])
        .select()
        .single()

      if (insertError) throw insertError
      
      router.push(`/dashboard/flows/${data.id}`)
    } catch (err: any) {
      console.error(err)
      alert("Impossible de créer le flux.")
    }
  }

  const deleteFlow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Voulez-vous vraiment supprimer ce flux ?')) return

    try {
      const supabase = createClient()

      const { error: delError } = await supabase
        .from('whatsapp_flows')
        .delete()
        .eq('id', id)

      if (delError) throw delError
      setFlows(flows.filter((f) => f.id !== id))
    } catch (err: any) {
      console.error(err)
      alert("Erreur lors de la suppression.")
    }
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            Flux WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez des formulaires et des expériences interactives natives dans WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadFlows(true)}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            <Loader2 className={cn('h-3 w-3', isSyncing ? 'animate-spin' : 'hidden')} />
            Sync
          </button>
          <button
            onClick={createFlow}
            className="inline-flex items-center justify-center rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 bg-[#fe5105] text-white shadow hover:bg-[#e04602] h-9 px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Flux
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center text-destructive">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoading && !isSyncing ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#fe5105] animate-spin" />
        </div>
      ) : flows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun flux</h3>
          <p className="text-muted-foreground max-w-sm mb-6 text-sm">
            Vous n'avez pas encore créé de flux. Les flux permettent à vos clients de remplir des formulaires complexes sans quitter WhatsApp.
          </p>
          <button
            onClick={createFlow}
            className="inline-flex items-center justify-center rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 bg-[#fe5105] text-white shadow-sm hover:bg-[#e04602] h-9 px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer votre premier flux
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flows.map((flow) => (
            <div
              key={flow.id}
              onClick={() => router.push(`/dashboard/flows/${flow.id}`)}
              className="group cursor-pointer bg-card border border-border rounded-xl p-5 hover:border-[#fe5105]/50 hover:bg-secondary/30 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-[#fe5105]/10 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-[#fe5105]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-foreground font-semibold truncate group-hover:text-[#fe5105] transition-colors text-sm">
                      {flow.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium',
                          flow.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        )}
                      >
                        {flow.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-xs text-muted-foreground">
                  Modifié le {new Date(flow.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary border border-transparent hover:border-border">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => deleteFlow(flow.id, e)}
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 border border-transparent hover:border-border"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
