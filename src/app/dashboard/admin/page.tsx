'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { isPlatformAdmin } from '@/lib/admin'
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShoppingCart,
  X,
  CreditCard,
  PieChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanCode } from '@/lib/plans'

interface AdminUserRow {
  id: string
  organizationId: string
  organizationName: string
  slug: string
  userId: string
  email: string
  fullName: string
  role: string
  planCode: PlanCode
  planName: string
  planPriceDisplay: string
  subscriptionStatus: 'active' | 'trialing' | 'expired' | 'canceled'
  totalTransactionsAmount: number
  totalOrdersCount: number
  hasWhatsApp: boolean
  membersCount: number
  createdAt: string
}

interface AdminMetricsSummary {
  totalUsers: number
  totalOrganizations: number
  totalGlobalGMV: number
  totalOrdersCount: number
  totalSubscriptionMRR: number
  totalSubscriptionARR: number
  estimatedNetProfit: number
  totalActiveWhatsAppNumbers: number
  totalMessagesCount: number
  planBreakdown: Record<PlanCode, number>
}

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AdminMetricsSummary | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'gmv' | 'date' | 'orders' | 'name'>('gmv')
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserRow | null>(null)

  const isAdmin = useMemo(() => isPlatformAdmin(user?.email), [user?.email])

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, isAdmin, router])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/metrics')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la récupération des données administrateur')
      }
      const data = await res.json()
      setSummary(data.summary)
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le tableau de bord administrateur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics()
    }
  }, [isAdmin])

  // Filtered & sorted users list
  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      // Plan filter
      if (selectedPlan !== 'all' && u.planCode !== selectedPlan) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesEmail = u.email.toLowerCase().includes(q)
        const matchesName = u.fullName.toLowerCase().includes(q)
        const matchesOrg = u.organizationName.toLowerCase().includes(q)
        return matchesEmail || matchesName || matchesOrg
      }

      return true
    })

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'gmv') {
        return b.totalTransactionsAmount - a.totalTransactionsAmount
      }
      if (sortBy === 'orders') {
        return b.totalOrdersCount - a.totalOrdersCount
      }
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'name') {
        return a.organizationName.localeCompare(b.organizationName)
      }
      return 0
    })

    return result
  }, [users, selectedPlan, searchQuery, sortBy])

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getPlanBadge = (code: PlanCode) => {
    switch (code) {
      case 'enterprise':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
            Enterprise
          </span>
        )
      case 'business':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
            Business
          </span>
        )
      case 'growth':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#fe5105]/15 text-[#fe5105] border border-[#fe5105]/25">
            Growth
          </span>
        )
      case 'starter':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
            Starter
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
            Free
          </span>
        )
    }
  }

  if (authLoading || (!isAdmin && !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 py-2 sm:py-6 space-y-6 sm:space-y-8">
      {/* ─── Super Admin Banner & Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#fe5105]/10 text-[#fe5105] flex items-center justify-center shrink-0 border border-[#fe5105]/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading">
                Super Administration Platform
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Monitor
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Supervisé par <strong className="text-foreground">{user?.email}</strong> • Accès illimité sans restrictions
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all shrink-0"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-primary')} />
          <span>Actualiser les métriques</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Global Financial & Activity KPIs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Subscription MRR */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Revenus Abonnements (MRR)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {formatCurrency(summary?.totalSubscriptionMRR || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            ARR estimé : <strong className="text-foreground">{formatCurrency(summary?.totalSubscriptionARR || 0)}</strong>
          </div>
        </div>

        {/* Global GMV Platform Volume */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Volume GMV Plateforme</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {formatCurrency(summary?.totalGlobalGMV || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Total commandes : <strong className="text-foreground">{summary?.totalOrdersCount || 0}</strong>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Bénéfices Abonnements</span>
            <div className="p-2 rounded-xl bg-[#fe5105]/10 text-[#fe5105]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {formatCurrency(summary?.estimatedNetProfit || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Marge estimée : <span className="font-semibold text-emerald-600">~72% brut</span>
          </div>
        </div>

        {/* Total Users & WhatsApp lines */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Comptes & Lignes WA</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {summary?.totalOrganizations || 0} orgs
          </div>
          <div className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">{summary?.totalActiveWhatsAppNumbers || 0}</strong> numéros •{' '}
            <strong className="text-foreground">{summary?.totalMessagesCount || 0}</strong> msgs
          </div>
        </div>
      </div>

      {/* ─── Plan Breakdown Quick Tabs ─── */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
            Répartition des forfaits Whatooz
          </h3>
          <span className="text-xs text-muted-foreground">
            {summary?.totalOrganizations || 0} clients au total
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { key: 'free', label: 'Free (0 FCFA)', color: 'text-zinc-600 dark:text-zinc-400', count: summary?.planBreakdown.free || 0 },
            { key: 'starter', label: 'Starter (5 000 FCFA)', color: 'text-blue-600 dark:text-blue-400', count: summary?.planBreakdown.starter || 0 },
            { key: 'growth', label: 'Growth (15 000 FCFA)', color: 'text-[#fe5105]', count: summary?.planBreakdown.growth || 0 },
            { key: 'business', label: 'Business (35 000 FCFA)', color: 'text-indigo-600 dark:text-indigo-400', count: summary?.planBreakdown.business || 0 },
            { key: 'enterprise', label: 'Enterprise (Sur devis)', color: 'text-purple-600 dark:text-purple-400', count: summary?.planBreakdown.enterprise || 0 },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => setSelectedPlan(selectedPlan === item.key ? 'all' : item.key)}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer select-none',
                selectedPlan === item.key
                  ? 'border-foreground bg-secondary shadow-xs'
                  : 'border-border/70 bg-secondary/30 hover:bg-secondary/60'
              )}
            >
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {item.label}
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={cn('text-lg sm:text-xl font-bold', item.color)}>
                  {item.count}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {summary?.totalOrganizations
                    ? `${Math.round((item.count / summary.totalOrganizations) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── User Accounts Management & Tracking Table ─── */}
      <div className="space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par email, nom, entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Plan Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Plan filter dropdown */}
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="all">Tous les forfaits</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="gmv">Trier : GMV Transactions</option>
              <option value="orders">Trier : Nombre de commandes</option>
              <option value="date">Trier : Récents d'abord</option>
              <option value="name">Trier : Nom (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Client / Organisation</th>
                  <th className="px-5 py-3">Forfait</th>
                  <th className="px-5 py-3">Transactions (GMV)</th>
                  <th className="px-5 py-3">Commandes</th>
                  <th className="px-5 py-3">WhatsApp</th>
                  <th className="px-5 py-3">Inscrit le</th>
                  <th className="px-5 py-3 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs sm:text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      Aucun utilisateur ne correspond aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserDetail(u)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Org */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                            {u.organizationName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-[200px]">
                              {u.organizationName}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getPlanBadge(u.planCode)}
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {u.planPriceDisplay}
                          </span>
                        </div>
                      </td>

                      {/* Transactions Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-foreground">
                          {formatCurrency(u.totalTransactionsAmount)}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-foreground">{u.totalOrdersCount}</span>{' '}
                        <span className="text-muted-foreground text-xs">cdes</span>
                      </td>

                      {/* WhatsApp status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {u.hasWhatsApp ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Connecté</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Non connecté</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-xs">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUserDetail(u)
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground group-hover:text-foreground hover:bg-secondary"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUserDetail(u)}
                className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {u.organizationName}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="shrink-0">{getPlanBadge(u.planCode)}</div>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-border/60">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Volume des ventes
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(u.totalTransactionsAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">Commandes</span>
                    <span className="text-sm font-semibold text-foreground">
                      {u.totalOrdersCount} cdes
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span>Inscrit le {formatDate(u.createdAt)}</span>
                  <span>{u.hasWhatsApp ? '🟢 WhatsApp actif' : '⚪ Pas de WhatsApp'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Detailed User Inspection Modal ─── */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-base">
                  {selectedUserDetail.organizationName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {selectedUserDetail.organizationName}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedUserDetail.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground">Forfait Whatooz</span>
                <div className="flex items-center gap-2">
                  {getPlanBadge(selectedUserDetail.planCode)}
                  <span className="font-bold text-foreground">
                    {selectedUserDetail.planPriceDisplay}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground">Total des transactions générées</span>
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(selectedUserDetail.totalTransactionsAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Commandes passées</span>
                  <span className="text-base font-bold text-foreground">
                    {selectedUserDetail.totalOrdersCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Numéro WhatsApp</span>
                  <span className="text-sm font-semibold text-foreground">
                    {selectedUserDetail.hasWhatsApp ? 'Connecté' : 'Aucun'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ID Organisation :</span>
                  <span className="font-mono text-foreground text-[11px]">{selectedUserDetail.organizationId}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Slug :</span>
                  <span className="font-mono text-foreground text-[11px]">{selectedUserDetail.slug}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Date d'inscription :</span>
                  <span className="text-foreground">{formatDate(selectedUserDetail.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-secondary text-foreground"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
