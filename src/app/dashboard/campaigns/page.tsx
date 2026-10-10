'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Calendar, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Lock, 
  Sparkles,
  Repeat,
  Users,
  Tag as TagIcon,
  Send,
  MoreVertical,
  Trash2,
  RefreshCw,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { usePlanAccess } from '@/hooks/use-plan-access'
import { cn } from '@/lib/utils'

export interface Campaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused'
  scheduled_at: string | null
  target_type: 'all' | 'tags' | 'contacts'
  target_tags: string[] | null
  target_contacts: string[] | null
  message_type: string
  message_payload: any
  recurrence: string
  stats?: {
    sent?: number
    delivered?: number
    read?: number
    failed?: number
  }
  created_at: string
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Jeu',
  friday: 'Ven',
  saturday: 'Sam',
  sunday: 'Dim',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'scheduled' | 'draft' | 'completed'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)
  
  const supabase = createClient()
  const { activeOrganization } = useOrganization()
  const { canAccess, plan } = usePlanAccess()

  useEffect(() => {
    if (activeOrganization) {
      fetchCampaigns()
    }
  }, [activeOrganization])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      // Trigger background check for any scheduled campaigns whose time has arrived
      fetch('/api/whatsapp/campaigns/cron').catch(() => {})

      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .eq('organization_id', activeOrganization?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCampaigns(data || [])
    } catch (err) {
      console.error('Failed to load campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDispatchNow = async (id: string, name: string) => {
    if (!confirm(`Lancer immédiatement la diffusion de la campagne "${name}" ?`)) return
    setDispatchingId(id)
    try {
      const res = await fetch(`/api/whatsapp/campaigns/${id}/dispatch`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la campagne")
      }
      await fetchCampaigns()
    } catch (err: any) {
      console.error('Erreur lancement campagne:', err)
      alert(err.message || 'Impossible de lancer cette campagne')
    } finally {
      setDispatchingId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement la campagne "${name}" ?`)) return
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('broadcast_campaigns')
        .delete()
        .eq('id', id)
        .eq('organization_id', activeOrganization?.id)

      if (error) throw error
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Impossible de supprimer cette campagne')
    } finally {
      setDeletingId(null)
    }
  }

  // Analytics aggregations
  const statsSummary = useMemo(() => {
    let totalSent = 0
    let totalDelivered = 0
    let totalRead = 0
    let scheduledActive = 0

    campaigns.forEach(c => {
      totalSent += c.stats?.sent || 0
      totalDelivered += c.stats?.delivered || 0
      totalRead += c.stats?.read || 0
      if (c.status === 'scheduled' || (c.recurrence && c.recurrence !== 'once')) {
        scheduledActive++
      }
    })

    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100
    const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      deliveryRate,
      readRate,
      scheduledActive,
    }
  }, [campaigns])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      const isScheduled = Boolean(c.scheduled_at && c.status === 'scheduled') || (c.recurrence && c.recurrence !== 'once') || c.message_payload?.scheduling?.mode === 'recurring'

      if (filterTab === 'direct') return !isScheduled
      if (filterTab === 'scheduled') return isScheduled
      if (filterTab === 'draft') return c.status === 'draft'
      if (filterTab === 'completed') return c.status === 'completed'
      return true
    })
  }, [campaigns, search, filterTab])

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1"/> Brouillon</span>
      case 'scheduled': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"><Calendar className="w-3 h-3 mr-1"/> Programmé</span>
      case 'sending': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"><Play className="w-3 h-3 mr-1"/> En cours</span>
      case 'completed': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Terminé</span>
      case 'failed': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"><XCircle className="w-3 h-3 mr-1"/> Échoué</span>
      default: 
        return null
    }
  }

  const renderScheduleDetail = (c: Campaign) => {
    const scheduling = c.message_payload?.scheduling
    if (scheduling?.mode === 'recurring' && scheduling.days?.length > 0) {
      const daysStr = scheduling.days.map((d: string) => DAY_LABELS[d] || d).join(', ')
      const timesStr = (scheduling.times || []).join(' • ')
      return (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Repeat className="w-3 h-3 text-[#fe5105]" />
            {daysStr}
          </span>
          <span>{timesStr ? `${timesStr} (${scheduling.frequencyPerDay || 1}x/j)` : 'Heure auto'}</span>
        </div>
      )
    }

    if (c.scheduled_at) {
      return (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-500" />
            {format(new Date(c.scheduled_at), 'dd MMM yyyy', { locale: fr })}
          </span>
          <span>{format(new Date(c.scheduled_at), 'HH:mm')}</span>
        </div>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Zap className="w-3 h-3 text-amber-500" />
        Envoi direct
      </span>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">Campagnes Marketing</h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              WhatsApp
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Diffusez des messages personnalisés en masse, directement ou selon un calendrier récurrent.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canAccess('campaigns') ? (
            <Link 
              href="/dashboard/campaigns/new" 
              className="inline-flex items-center justify-center rounded-xl text-sm font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 transition-all active:scale-95 gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle campagne</span>
            </Link>
          ) : (
            <Link 
              href="/dashboard/settings/billing" 
              className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 h-10 px-4 py-2 gap-1.5 border border-border"
            >
              <Lock className="h-4 w-4 text-[#fe5105]" />
              <span>Débloquer les campagnes</span>
            </Link>
          )}
        </div>
      </div>

      {/* Plan gate banner if required */}
      {!canAccess('campaigns') && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 shrink-0 text-[#fe5105]" />
            <p className="text-xs sm:text-sm">
              Les campagnes marketing WhatsApp nécessitent le forfait <strong>Starter (5 000 FCFA/mois)</strong> ou supérieur. Vous êtes actuellement sur le forfait <strong>{plan.name}</strong>.
            </p>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:brightness-105 shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passer à Starter</span>
          </Link>
        </div>
      )}

      {/* Top Analytics Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Campagnes</span>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">{statsSummary.totalCampaigns}</span>
          <span className="text-[11px] text-muted-foreground">Directes et récurrentes</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Messages Envoyés</span>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">{statsSummary.totalSent}</span>
          <span className="text-[11px] text-muted-foreground">Total contacts touchés</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Taux Délivrance</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">{statsSummary.deliveryRate}%</span>
          <span className="text-[11px] text-muted-foreground">Reçus par les destinataires</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Programmations</span>
            <Repeat className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">{statsSummary.scheduledActive}</span>
          <span className="text-[11px] text-muted-foreground">En cours d'exécution active</span>
        </div>
      </div>

      {/* Main Campaign Container */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
        {/* Controls Bar: Filters and Search */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
                filterTab === 'all' ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Toutes ({campaigns.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('direct')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                filterTab === 'direct' ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Directes</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('scheduled')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                filterTab === 'scheduled' ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Calendar className="w-3 h-3 text-blue-500" />
              <span>Programmées</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
                filterTab === 'completed' ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Terminées
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('draft')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
                filterTab === 'draft' ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Brouillons
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span>Chargement des campagnes...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {campaigns.length === 0 ? 'Aucune campagne pour le moment' : 'Aucune campagne correspondante'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {campaigns.length === 0
                ? "Créez votre première campagne WhatsApp personnalisée en sélectionnant un modèle Meta et vos contacts ciblés."
                : "Modifiez votre recherche ou sélectionnez un autre filtre pour afficher les campagnes."}
            </p>
            {campaigns.length === 0 && canAccess('campaigns') && (
              <Link 
                href="/dashboard/campaigns/new" 
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une campagne</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground">
              <div className="col-span-4">Campagne</div>
              <div className="col-span-2">Audience</div>
              <div className="col-span-2">Planning / Fréquence</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-1 text-center">Performance</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Rows */}
            {filteredCampaigns.map((c) => {
              const variableMappings = c.message_payload?.templateVariablesMapping || c.message_payload?.variableMappings
              const hasVariables = variableMappings && Object.keys(variableMappings).length > 0

              return (
                <div key={c.id} className="p-4 sm:px-6 hover:bg-muted/15 transition-colors">
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                    {/* Column 1: Info */}
                    <div className="col-span-4 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{c.name}</span>
                        {hasVariables && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold border border-purple-500/20 shrink-0" title="Variables de personnalisation contact actives">
                            Personnalisé
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{c.message_payload?.templateName || c.message_payload?.templateId || 'Modèle WhatsApp'}</span>
                        <span>•</span>
                        <span>Créé le {format(new Date(c.created_at), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>

                    {/* Column 2: Audience */}
                    <div className="col-span-2">
                      {c.target_type === 'all' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Tous les contacts</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          <TagIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {(c.target_tags || []).slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium border border-border">
                              {tag}
                            </span>
                          ))}
                          {(c.target_tags?.length || 0) > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{c.target_tags!.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column 3: Planning */}
                    <div className="col-span-2">
                      {renderScheduleDetail(c)}
                    </div>

                    {/* Column 4: Status */}
                    <div className="col-span-2">
                      {getStatusBadge(c.status)}
                    </div>

                    {/* Column 5: Performance */}
                    <div className="col-span-1 text-center">
                      <div className="text-xs font-semibold text-foreground">
                        {c.stats?.sent || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.stats?.delivered ? `${c.stats.delivered} reçus` : 'envoyés'}
                      </div>
                    </div>

                    {/* Column 6: Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {c.status !== 'sending' && (
                        <button
                          type="button"
                          onClick={() => handleDispatchNow(c.id, c.name)}
                          disabled={dispatchingId === c.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-[#fe5105] hover:bg-[#fe5105]/10 transition-colors"
                          title="Lancer immédiatement"
                        >
                          {dispatchingId === c.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-[#fe5105]" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Supprimer la campagne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout (Card) */}
                  <div className="lg:hidden flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground">{c.name}</h4>
                          {hasVariables && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold border border-purple-500/20">
                              Personnalisé
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Modèle : {c.message_payload?.templateName || c.message_payload?.templateId || 'WhatsApp'}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(c.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Audience :</span>
                        {c.target_type === 'all' ? (
                          <span className="font-medium text-foreground">Tous les contacts</span>
                        ) : (
                          <span className="font-medium text-foreground truncate block">
                            Tags : {(c.target_tags || []).join(', ') || 'Aucun'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Planification :</span>
                        {renderScheduleDetail(c)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground">
                        Envoyés : <strong className="text-foreground">{c.stats?.sent || 0}</strong> • Délivrés : <strong className="text-foreground">{c.stats?.delivered || 0}</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        {c.status !== 'sending' && (
                          <button
                            type="button"
                            onClick={() => handleDispatchNow(c.id, c.name)}
                            disabled={dispatchingId === c.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-[#fe5105] transition-colors"
                            title="Lancer immédiatement"
                          >
                            {dispatchingId === c.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#fe5105]" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                          title="Supprimer la campagne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
