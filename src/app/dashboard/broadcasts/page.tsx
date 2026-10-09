'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, Play, CheckCircle2, XCircle, Clock, Zap, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { usePlanAccess } from '@/hooks/use-plan-access'

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { activeOrganization } = useOrganization()
  const { canAccess, plan } = usePlanAccess()

  useEffect(() => {
    if (activeOrganization) {
      fetchBroadcasts()
    }
  }, [activeOrganization])

  const fetchBroadcasts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .eq('organization_id', activeOrganization?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setBroadcasts(data || [])
    } catch (err) {
      console.error('Failed to load broadcasts:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"><Clock className="w-3 h-3 mr-1"/> Brouillon</span>
      case 'scheduled': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500"><Calendar className="w-3 h-3 mr-1"/> Programmé</span>
      case 'sending': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500"><Play className="w-3 h-3 mr-1"/> En cours</span>
      case 'completed': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1"/> Terminé</span>
      case 'failed': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1"/> Échoué</span>
      default: return null
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">Diffusions</h2>
          <p className="text-muted-foreground">Envoyez des messages en masse à vos contacts</p>
        </div>
        <div className="flex items-center space-x-2">
          {canAccess('campaigns') ? (
            <Link 
              href="/dashboard/broadcasts/new" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Nouvelle diffusion
            </Link>
          ) : (
            <Link 
              href="/dashboard/settings/billing" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors bg-secondary text-foreground hover:bg-secondary/80 h-10 px-4 py-2 gap-1.5"
            >
              <Lock className="h-4 w-4 text-primary" /> Débloquer les diffusions
            </Link>
          )}
        </div>
      </div>

      {!canAccess('campaigns') && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              Les campagnes de diffusion WhatsApp nécessitent le forfait <strong>Starter (5 000 FCFA/mois)</strong> ou supérieur. Vous êtes actuellement sur le forfait <strong>{plan.name}</strong>.
            </p>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passer à Starter</span>
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une diffusion..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des diffusions...</div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Aucune diffusion</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">Vous n'avez pas encore créé de campagne de diffusion. Commencez par en créer une pour envoyer un message à plusieurs contacts.</p>
            <Link 
              href="/dashboard/broadcasts/new" 
              className="mt-6 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Créer ma première diffusion
            </Link>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b [&_tr]:border-border">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type de Message</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cible</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date Prévue</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Performance</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {broadcasts.map((broadcast) => (
                  <tr key={broadcast.id} className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium text-foreground">{broadcast.name}</td>
                    <td className="p-4 align-middle">{getStatusBadge(broadcast.status)}</td>
                    <td className="p-4 align-middle capitalize">{broadcast.message_type}</td>
                    <td className="p-4 align-middle">
                      {broadcast.target_type === 'all' && 'Tous les contacts'}
                      {broadcast.target_type === 'tags' && `Tags: ${(broadcast.target_tags || []).join(', ')}`}
                      {broadcast.target_type === 'contacts' && `${(broadcast.target_contacts || []).length} contacts`}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {broadcast.scheduled_at ? format(new Date(broadcast.scheduled_at), 'd MMM yyyy HH:mm', { locale: fr }) : 'Immédiat'}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex space-x-2 text-xs">
                        <span className="text-emerald-500">{broadcast.stats?.delivered || 0} livrés</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-red-500">{broadcast.stats?.failed || 0} erreurs</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
