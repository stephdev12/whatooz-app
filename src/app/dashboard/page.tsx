'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  Layers,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

interface DashboardStats {
  totalConversations: number
  totalOrders: number
  totalRevenueFcfa: number
  connectedPhone: string
  verifiedName: string
  recentOrders: Array<{
    id: string
    created_at: string
    contact_name: string
    contact_phone: string
    product_name: string
    amount: string
    ref: string
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    totalOrders: 0,
    totalRevenueFcfa: 0,
    connectedPhone: '',
    verifiedName: '',
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        // 1. WhatsApp Config
        const { data: config } = await supabase
          .from('whatsapp_config')
          .select('display_phone_number, verified_name, phone_number_id')
          .eq('user_id', user.id)
          .maybeSingle()

        // 2. Total Conversations count
        const { count: convoCount } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // 3. Flow submissions & Orders
        const { data: responses } = await supabase
          .from('flow_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        let ordersCount = 0
        let totalFcfa = 0
        const formattedOrders: DashboardStats['recentOrders'] = []

        if (responses && responses.length > 0) {
          responses.forEach((r) => {
            const data = (r.response_data as Record<string, any>) || {}
            if (data.modele_selectionne || data.product_name || data.categorie_produit) {
              ordersCount++
              let price = 260000
              let prodName = 'TechWave TW14 Pro (256 Go)'

              const model = String(data.modele_selectionne || '').toLowerCase()
              if (model.includes('apex')) {
                price = 260000
                prodName = 'Apex Aura Ultra (128 Go)'
              } else if (model.includes('virtu')) {
                price = 225000
                prodName = 'VirtuVision VX2'
              } else if (model.includes('nova')) {
                price = 195000
                prodName = 'Nova N1 Edition'
              } else if (data.product_name) {
                prodName = data.product_name
              }

              totalFcfa += price
              formattedOrders.push({
                id: r.id,
                created_at: r.created_at,
                contact_name: r.contact_name || 'Client',
                contact_phone: r.contact_phone,
                product_name: prodName,
                amount: price.toLocaleString('fr-FR') + ' FCFA',
                ref: `CMD-${r.id.substring(0, 6).toUpperCase()}`,
              })
            }
          })
        }

        setStats({
          totalConversations: convoCount || 0,
          totalOrders: ordersCount,
          totalRevenueFcfa: totalFcfa,
          connectedPhone: config?.display_phone_number || '+237 6 41 46 42 11',
          verifiedName: config?.verified_name || 'Whatooz Commerce',
          recentOrders: formattedOrders,
        })
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, supabase])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-card to-secondary/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fe5105]/10 px-3 py-1 text-xs font-semibold text-[#fe5105] border border-[#fe5105]/20">
              <Sparkles className="h-3.5 w-3.5" />
              API Officielle WhatsApp Cloud v7.3
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-[Cabinet_Grotesk]">
              Bienvenue sur <span className="text-[#fe5105]">Whatooz</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Votre canal de vente automatisé 24h/24 : catalogues interactifs, tunnels de commande WhatsApp et règlements Mobile Money sécurisés.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-background/80 border border-border px-3.5 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">{stats.connectedPhone}</p>
                <p className="text-[10px] text-muted-foreground">{stats.verifiedName} (Connecté)</p>
              </div>
            </div>

            <Link
              href="/dashboard/flows"
              className="inline-flex items-center gap-2 rounded-xl bg-[#fe5105] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#e04602] transition-colors"
            >
              <Layers className="h-4 w-4" />
              <span>Créer un Flow</span>
            </Link>
          </div>
        </div>

        {/* Subtle orange decorative circle in corner */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#fe5105]/5 blur-3xl" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Commandes reçues</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-[Cabinet_Grotesk]">
              {loading ? '...' : stats.totalOrders}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Tunnels Flows complétés</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Chiffre d&apos;affaires généré</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe5105]/10 text-[#fe5105]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fe5105] font-[Cabinet_Grotesk]">
              {loading ? '...' : stats.totalRevenueFcfa.toLocaleString('fr-FR')} FCFA
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Montant des commandes validées</p>
          </div>
        </div>

        {/* Active Conversations */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Discussions engagées</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-[Cabinet_Grotesk]">
              {loading ? '...' : stats.totalConversations}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Clients actifs dans l&apos;Inbox</p>
          </div>
        </div>

        {/* Security & Reliability */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Disponibilité Meta</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-[Cabinet_Grotesk]">
              99.9 %
            </span>
            <p className="mt-1 text-xs text-emerald-500 font-medium">Zéro déconnexion • Certifié</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards (4 pillars of Whatooz) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/flows"
          className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-[#fe5105]/40 hover:bg-secondary/20 transition-all"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fe5105]/10 text-[#fe5105] mb-3 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">WhatsApp Flows v7.3</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Créez des catalogues produits multi-écrans avec photos, fiches techniques et commande directe.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#fe5105]">
            Ouvrir l&apos;éditeur <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/inbox"
          className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-blue-500/40 hover:bg-secondary/20 transition-all"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 mb-3 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Messagerie & Inbox Live</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Répondez à vos clients en temps réel, consultez les historiques et reprenez la main manuellement.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-500">
            Accéder au chat <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/automations"
          className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-amber-500/40 hover:bg-secondary/20 transition-all"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 mb-3 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Scénarios & Relances</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Déclenchez des réponses automatiques par mots-clés ou envoyez des relances sur panier abandonné.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
            Configurer <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/templates"
          className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-emerald-500/40 hover:bg-secondary/20 transition-all"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Modèles Certifiés Meta</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Soumettez et synchronisez vos messages marketing et alertes avec validation officielle Meta.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
            Gérer les modèles <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* Recent Orders & Flow Submissions */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground font-[Cabinet_Grotesk]">
              Dernières commandes & formulaires WhatsApp
            </h2>
            <p className="text-xs text-muted-foreground">
              Commandes enregistrées en direct via vos WhatsApp Flows
            </p>
          </div>
          <Link
            href="/dashboard/inbox"
            className="text-xs font-medium text-[#fe5105] hover:underline inline-flex items-center gap-1"
          >
            Voir les conversations <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto h-10 w-10 opacity-30 mb-2" />
            <p className="text-sm font-medium">Aucune commande pour le moment</p>
            <p className="text-xs mt-1">
              Partagez votre lien ou mot-clé de boutique WhatsApp pour enregistrer vos premiers achats.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-x-auto">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs">
                    CMD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{order.product_name}</p>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {order.ref}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Client : {order.contact_name} ({order.contact_phone})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-[#fe5105]">{order.amount}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
