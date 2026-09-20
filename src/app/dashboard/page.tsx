'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Calendar,
  Plus,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Wifi,
  Send,
  Download,
  Users,
  Layers,
  MessageSquare,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    status: string
    payment_method: string
    ref: string
    brand_color?: string
    brand_initial?: string
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 18,
    totalOrders: 6,
    totalRevenueFcfa: 1560000,
    connectedPhone: '',
    verifiedName: '',
    recentOrders: [
      {
        id: 'cmd-1',
        created_at: '2026-09-19T21:45:00Z',
        contact_name: 'Amadou Diallo',
        contact_phone: '+221 77 450 12 34',
        product_name: 'TechWave TW14 Pro (256 Go)',
        amount: '325 000 FCFA',
        status: 'Payé',
        payment_method: 'Wave',
        ref: 'CMD-849201',
        brand_color: 'bg-sky-500 text-white',
        brand_initial: 'W',
      },
      {
        id: 'cmd-2',
        created_at: '2026-09-19T18:30:00Z',
        contact_name: 'Fatou Ndiaye',
        contact_phone: '+225 07 89 12 34',
        product_name: 'Apex Aura Ultra (128 Go)',
        amount: '260 000 FCFA',
        status: 'Payé',
        payment_method: 'Orange Money',
        ref: 'CMD-392810',
        brand_color: 'bg-orange-500 text-white',
        brand_initial: 'OM',
      },
      {
        id: 'cmd-3',
        created_at: '2026-09-19T14:15:00Z',
        contact_name: 'Koffi Kouamé',
        contact_phone: '+225 05 12 43 90',
        product_name: 'VirtuVision VX2 Pack',
        amount: '225 000 FCFA',
        status: 'Payé',
        payment_method: 'MTN MoMo',
        ref: 'CMD-198273',
        brand_color: 'bg-amber-400 text-neutral-900',
        brand_initial: 'M',
      },
      {
        id: 'cmd-4',
        created_at: '2026-09-19T11:20:00Z',
        contact_name: 'Aïcha Traoré',
        contact_phone: '+223 66 12 34 56',
        product_name: 'Casque Audio Sans Fil Pro',
        amount: '45 000 FCFA',
        status: 'Payé',
        payment_method: 'Carte Bancaire',
        ref: 'CMD-771289',
        brand_color: 'bg-emerald-600 text-white',
        brand_initial: 'CB',
      },
    ],
  })

  const [timeframe, setTimeframe] = useState<'monthly' | 'annually'>('monthly')
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

        if (responses && responses.length > 0) {
          let ordersCount = 0
          let totalFcfa = 0
          const liveOrders: typeof stats.recentOrders = []

          responses.forEach((r) => {
            const data = (r.response_data as Record<string, any>) || {}
            ordersCount++
            let price = 260000
            let prodName = 'TechWave TW14 Pro (256 Go)'
            const model = String(data.modele_selectionne || data.product_name || '').toLowerCase()

            if (model.includes('apex')) {
              price = 260000
              prodName = 'Apex Aura Ultra (128 Go)'
            } else if (model.includes('virtu')) {
              price = 225000
              prodName = 'VirtuVision VX2'
            } else if (model.includes('audio') || model.includes('casque')) {
              price = 45000
              prodName = 'Casque Audio Pro'
            } else if (data.product_name) {
              prodName = data.product_name
            }

            totalFcfa += price
            liveOrders.push({
              id: r.id,
              created_at: r.created_at,
              contact_name: r.contact_name || 'Client WhatsApp',
              contact_phone: r.contact_phone,
              product_name: prodName,
              amount: price.toLocaleString('fr-FR') + ' FCFA',
              status: 'Payé',
              payment_method: 'Mobile Money',
              ref: `CMD-${r.id.substring(0, 6).toUpperCase()}`,
              brand_color: 'bg-[#fe5105] text-white',
              brand_initial: 'W',
            })
          })

          setStats((prev) => ({
            ...prev,
            totalConversations: convoCount || prev.totalConversations,
            totalOrders: ordersCount || prev.totalOrders,
            totalRevenueFcfa: totalFcfa > 0 ? totalFcfa : prev.totalRevenueFcfa,
            connectedPhone: config?.display_phone_number || '',
            verifiedName: config?.verified_name || '',
            recentOrders: liveOrders.length > 0 ? liveOrders : prev.recentOrders,
          }))
        } else {
          setStats((prev) => ({
            ...prev,
            connectedPhone: config?.display_phone_number || '',
            verifiedName: config?.verified_name || '',
            totalConversations: convoCount || prev.totalConversations,
          }))
        }
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* ─── 1. TOP HEADER (Quixotic style) ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Bon retour, {capitalizedUserName} 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Aperçu en temps réel de vos ventes et flux automatisés WhatsApp Commerce
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-card/80 px-4 py-2 text-xs font-semibold text-foreground backdrop-blur-md shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>29 Juin, 2026 - 29 Août, 2026</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
          </div>

          <Link
            href="/dashboard/flows"
            className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau Flow</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. MAIN 3-COLUMN METRICS GRID (Quixotic Inspiration Image 5) ─── */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: WhatsApp Business Card (4 cols) */}
        <div className="space-y-5 lg:col-span-4 flex flex-col justify-between">
          <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/70 p-5 backdrop-blur-md shadow-xs flex-1 flex flex-col justify-between">
            {/* Header with ↗ button */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-foreground">Objectif Ventes</h3>
                <p className="text-[11px] text-muted-foreground">Solde WhatsApp Commerce</p>
              </div>
              <div className="h-7 w-7 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Credit Card Widget (Quixotic Emerald VISA style) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c4a3e] via-[#056049] to-[#023326] p-6 text-white shadow-xl flex flex-col justify-between min-h-[200px]">
              {/* Subtle radial glow & noise */}
              <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[1px] pointer-events-none" />
              <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                    Whatooz Pay
                  </span>
                  <p className="text-[10px] text-emerald-300/80 font-medium">Carte Marchand Virtuelle</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-4 w-4 text-emerald-200 rotate-90" />
                </div>
              </div>

              <div className="relative z-10 my-3">
                <span className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
                  Chiffre d&apos;affaires Encaissé
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                  {stats.totalRevenueFcfa.toLocaleString('fr-FR')}{' '}
                  <span className="text-xs font-semibold uppercase tracking-normal text-emerald-200">FCFA</span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/90 font-mono">
                <span>•••• {stats.connectedPhone ? stats.connectedPhone.slice(-4) : '7700'}</span>
                <span className="font-sans font-medium text-[10px] bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15">
                  {stats.verifiedName || 'Meta Cloud v7.3'}
                </span>
              </div>
            </div>

            {/* Weekly Revenue Minimal row */}
            <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Revenu Hebdomadaire</p>
                <p className="text-lg font-bold text-foreground mt-0.5">+485 000 FCFA</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                <span>+12.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Engagement Rate & Zebra Striped Bar Chart (5 cols) */}
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/70 p-6 backdrop-blur-md shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Taux d&apos;Engagement WhatsApp</h3>
                <p className="text-[11px] text-muted-foreground">Activité et formulaires validés</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Pill Switcher */}
              <div className="flex items-center rounded-full bg-secondary p-1 border border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setTimeframe('monthly')}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-semibold transition-all',
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
                    'rounded-full px-3 py-1 text-[11px] font-semibold transition-all',
                    timeframe === 'annually'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Annuel
                </button>
              </div>

              <div className="h-7 w-7 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Quixotic Striped Vertical Bars with Y-Axis and Grid lines */}
          <div className="my-6 relative">
            <div className="flex h-44 items-end">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between h-36 pr-3 text-[10px] font-mono text-muted-foreground/60 select-none">
                <span>5k</span>
                <span>4k</span>
                <span>3k</span>
                <span>2k</span>
                <span>1k</span>
                <span>0</span>
              </div>

              {/* Chart Grid Lines & Bars Area */}
              <div className="relative flex-1 flex items-end justify-between gap-2.5 h-36 border-b border-black/[0.08] dark:border-white/[0.1] pb-0.5">
                {/* Dotted horizontal guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-foreground w-full" />
                  <div className="border-b border-dashed border-foreground w-full" />
                  <div className="border-b border-dashed border-foreground w-full" />
                  <div className="border-b border-dashed border-foreground w-full" />
                  <div className="border-b border-dashed border-foreground w-full" />
                </div>

                {[
                  { month: 'JAN', value: 35, peak: false },
                  { month: 'FÉV', value: 58, peak: false },
                  { month: 'MAR', value: 48, peak: false },
                  { month: 'AVR', value: 94, peak: true },
                  { month: 'MAI', value: 65, peak: false },
                  { month: 'JUIN', value: 72, peak: false },
                ].map((bar) => (
                  <div key={bar.month} className="relative z-10 flex flex-col items-center flex-1 group">
                    {/* Peak badge pin indicator (Quixotic style) */}
                    {bar.peak && (
                      <div className="absolute -top-7 flex flex-col items-center">
                        <span className="rounded-full bg-[#007a5f] dark:bg-[#00a884] text-white px-2 py-0.5 text-[9px] font-extrabold shadow-sm">
                          +17.8%
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-[#007a5f] dark:bg-[#00a884] -mt-0.5" />
                      </div>
                    )}

                    {/* Pillar Bar (Pill shape rounded-full) */}
                    <div
                      style={{ height: `${bar.value}%` }}
                      className={cn(
                        'w-full max-w-[34px] rounded-full transition-all duration-500',
                        bar.peak ? 'bg-quixotic-bar-peak' : 'bg-quixotic-bar-idle hover:opacity-90'
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* X-Axis Month Labels */}
            <div className="flex justify-between pl-8 pr-1 pt-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN'].map((m) => (
                <span key={m} className="flex-1 text-center">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.06] pt-4 text-xs">
            <span className="text-muted-foreground">Taux de conversion moyen</span>
            <span className="font-bold text-emerald-500">94.2% des formulaires remplis</span>
          </div>
        </div>

        {/* Right Column: Total Balance & Pill Actions (3 cols) */}
        <div className="space-y-5 lg:col-span-3 flex flex-col justify-between">
          {/* Card Top: Wave Area Chart + Send/Receive Pills */}
          <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/70 p-5 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Performance des Flows</p>
                <p className="text-[11px] text-muted-foreground">Clients Actifs</p>
              </div>
              <div className="h-7 w-7 rounded-full border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Discussions</span>
              <div className="text-2xl font-black text-foreground">
                {stats.totalConversations} clients
              </div>
            </div>

            {/* Smooth Wavy Curve Area Chart (Quixotic style) */}
            <div className="my-2 h-14 w-full">
              <svg viewBox="0 0 120 40" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="quixoticWave" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00a884" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00a884" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                  d="M0,28 Q15,10 30,22 T60,8 T90,20 T120,6 L120,40 L0,40 Z"
                  fill="url(#quixoticWave)"
                />
                {/* Line stroke */}
                <path
                  d="M0,28 Q15,10 30,22 T60,8 T90,20 T120,6"
                  fill="none"
                  stroke="#00a884"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Quixotic Pill Action Buttons: Send ↑ & Receive ↓ */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link
                href="/dashboard/inbox"
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#007a5f] hover:bg-[#006650] dark:bg-[#00a884] dark:hover:bg-[#008f6f] py-2 text-xs font-bold text-white shadow-xs transition-all"
              >
                <span>Envoyer</span>
                <span className="text-[11px]">↑</span>
              </Link>
              <Link
                href="/dashboard/flows"
                className="flex items-center justify-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-card hover:bg-secondary py-2 text-xs font-bold text-foreground transition-all"
              >
                <span>Flows</span>
                <span className="text-[11px]">↓</span>
              </Link>
            </div>
          </div>

          {/* Card Bottom: Conversion Rate & Stacked Client Avatars */}
          <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/70 p-5 backdrop-blur-md shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Commandes Traitées</p>
                <p className="text-[11px] text-muted-foreground">Taux de succès</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                +12.8%
              </div>
            </div>

            <div className="text-2xl font-black text-foreground mt-1">
              {stats.totalOrders} commandes
            </div>

            <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Derniers Acheteurs</p>
                <p className="text-[11px] text-foreground font-medium">WhatsApp direct</p>
              </div>

              {/* Overlapping Avatar Circles (Quixotic style) */}
              <div className="flex items-center -space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-amber-500 text-white font-bold text-[10px] shadow-xs">
                  A
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white font-bold text-[10px] shadow-xs">
                  F
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-sky-500 text-white font-bold text-[10px] shadow-xs">
                  K
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-[#fe5105] text-white font-bold text-[10px] shadow-xs">
                  +3
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. RECENT SALES & TRANSACTION FEED (Minimalist Quixotic Table) ─── */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/70 p-6 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">Historique des Commandes WhatsApp</h2>
            <p className="text-xs text-muted-foreground">Paiements Mobile Money et formulaires validés</p>
          </div>
          <Link
            href="/dashboard/flows"
            className="flex items-center gap-1 text-xs font-semibold text-[#fe5105] hover:underline"
          >
            <span>Voir les réponses</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Transactions List with Quixotic layout */}
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-x-auto">
          {stats.recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-3.5 px-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-2xl transition-colors gap-3"
            >
              {/* Brand Logo & Client Name */}
              <div className="flex items-center gap-3 min-w-[180px]">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-2xl font-bold text-xs shrink-0 shadow-xs',
                    order.brand_color || 'bg-[#fe5105] text-white'
                  )}
                >
                  {order.brand_initial || order.contact_name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{order.contact_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{order.product_name}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="hidden sm:block text-left text-xs">
                <span className="font-medium text-foreground">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Status with green dot */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {order.status}
                </span>
              </div>

              {/* Amount */}
              <div className="text-right min-w-[110px]">
                <p className="text-xs sm:text-sm font-bold text-foreground">{order.amount}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{order.payment_method}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
