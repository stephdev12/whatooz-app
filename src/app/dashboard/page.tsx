'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  TrendingUp,
  MessageSquare,
  Zap,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalConversations: number
  totalOrders: number
  totalRevenueFcfa: number
  recentInteractions: Array<{
    id: string
    created_at: string
    contact_name: string
    contact_phone: string
    type: string
    detail: string
  }>
  chartData: Array<{ month: string; value: number; peak: boolean }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    totalOrders: 0,
    totalRevenueFcfa: 0,
    recentInteractions: [],
    chartData: [],
  })

  const [timeframe, setTimeframe] = useState<'monthly' | 'annually'>('monthly')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        const { data: config } = await supabase
          .from('whatsapp_config')
          .select('display_phone_number, verified_name, phone_number_id')
          .eq('user_id', user.id)
          .maybeSingle()

        const { count: convoCount } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        const { data: responses } = await supabase
          .from('flow_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        let ordersCount = 0
        let totalFcfa = 0
        const interactions: typeof stats.recentInteractions = []

        if (responses && responses.length > 0) {
          responses.forEach((r) => {
            const data = (r.response_data as Record<string, any>) || {}
            ordersCount++
            let price = 260000
            const model = String(data.modele_selectionne || data.product_name || '').toLowerCase()

            if (model.includes('apex')) price = 260000
            else if (model.includes('virtu')) price = 225000
            else if (model.includes('audio') || model.includes('casque')) price = 45000

            totalFcfa += price
            interactions.push({
              id: r.id,
              created_at: r.created_at,
              contact_name: r.contact_name || 'Client',
              contact_phone: r.contact_phone,
              type: 'Formulaire',
              detail: data.product_name || data.modele_selectionne || 'Soumission Flow',
            })
          })
        }

        // Build 6 months dynamic chart data based on real interaction counts
        const monthCounts: Record<string, number> = {}
        interactions.forEach(r => {
          const date = new Date(r.created_at)
          const month = date.toLocaleString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
          monthCounts[month] = (monthCounts[month] || 0) + 1
        })
        
        const dynamicChartData = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const m = d.toLocaleString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
          const val = monthCounts[m] || 0
          dynamicChartData.push({
            month: m,
            // visually scale it up so the chart isn't completely flat if there's only 1 order
            value: val > 0 ? Math.min(val * 20, 100) : 5, 
            peak: false
          })
        }

        // Add a peak visual if there's actual data
        let maxVal = -1
        let peakIdx = -1
        dynamicChartData.forEach((d, i) => {
          if (d.value > maxVal && d.value > 5) {
            maxVal = d.value
            peakIdx = i
          }
        })
        if (peakIdx !== -1) {
          dynamicChartData[peakIdx].peak = true
        }

        setStats({
          totalConversations: convoCount || 0,
          totalOrders: ordersCount,
          totalRevenueFcfa: totalFcfa,
          recentInteractions: interactions,
          chartData: dynamicChartData,
        })
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, supabase])

  const userName = user?.email?.split('@')[0] || 'Marchand'
  const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
          Bon retour, {capitalizedUserName} 👋
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Aperçu de votre activité
        </p>
      </div>

      {/* ─── Metrics Row ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Solde */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground">Solde total</p>
          <p className="text-lg font-bold text-foreground mt-1">
            {stats.totalRevenueFcfa.toLocaleString('fr-FR')} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
          </p>
        </div>

        {/* Conversations */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground">Conversations</p>
          <p className="text-lg font-bold text-foreground mt-1">{stats.totalConversations}</p>
        </div>

        {/* Commandes */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground">Commandes</p>
          <p className="text-lg font-bold text-foreground mt-1">{stats.totalOrders}</p>
        </div>

        {/* Taux conversion */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground">Taux de conversion</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-bold text-emerald-500">94.2%</p>
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-500">
              <TrendingUp className="h-3 w-3" /> +12.8%
            </span>
          </div>
        </div>
      </div>

      {/* ─── Chart + Quick Links ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Engagement</h2>
            <div className="flex items-center rounded-full bg-secondary p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-medium transition-all',
                  timeframe === 'monthly'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('annually')}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-medium transition-all',
                  timeframe === 'annually'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Annuel
              </button>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex h-40 items-end gap-3 border-b border-border pb-1">
            {stats.chartData.map((bar) => (
              <div key={bar.month} className="relative flex flex-col items-center flex-1">
                {bar.peak && (
                  <span className="absolute -top-5 rounded-full bg-emerald-500 text-white px-1.5 py-0.5 text-[9px] font-bold">
                    Max
                  </span>
                )}
                <div
                  style={{ height: `${bar.value}%` }}
                  className={cn(
                    'w-full max-w-[28px] rounded-full transition-all',
                    bar.peak ? 'bg-quixotic-bar-peak' : 'bg-quixotic-bar-idle'
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 text-[10px] font-medium text-muted-foreground">
            {stats.chartData.map((bar) => (
              <span key={bar.month} className="flex-1 text-center">{bar.month}</span>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <Link
            href="/dashboard/inbox"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe5105]/10 text-[#fe5105]">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Discussions</p>
              <p className="text-[11px] text-muted-foreground">Répondre aux messages</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>

          <Link
            href="/dashboard/flows"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Flows</p>
              <p className="text-[11px] text-muted-foreground">Créer un formulaire</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>

          <Link
            href="/dashboard/automations"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Scénarios</p>
              <p className="text-[11px] text-muted-foreground">Automatiser les réponses</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* ─── Interactions récentes ─── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Interactions récentes</h2>
          <Link
            href="/dashboard/flows"
            className="text-xs font-medium text-[#fe5105] hover:underline"
          >
            Tout voir
          </Link>
        </div>

        {stats.recentInteractions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Aucune interaction pour le moment
          </p>
        ) : (
          <div className="divide-y divide-border">
            {stats.recentInteractions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fe5105]/10 text-[#fe5105] text-xs font-bold shrink-0">
                    {item.contact_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.contact_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {item.type}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
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
