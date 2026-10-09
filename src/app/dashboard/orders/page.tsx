'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Eye,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Copy,
  Check,
  TrendingUp,
  CreditCard,
  Phone,
  User,
  X,
  ArrowUpRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  organization_id?: string
  contact_id?: string
  total_amount: number
  currency: string
  status: string
  payment_provider?: string
  payment_reference?: string
  saspay_checkout_url?: string
  whatsapp_order_id?: string
  created_at: string
  contacts?: {
    name?: string
    phone?: string
  } | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { activeOrganization } = useOrganization()

  useEffect(() => {
    if (activeOrganization) {
      loadOrders()
    }
  }, [activeOrganization])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select('*, contacts(name, phone)')
        .eq('organization_id', activeOrganization?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Copy payment link or order id
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // KPIs
  const stats = useMemo(() => {
    const totalCount = orders.length
    const paidOrders = orders.filter((o) => o.status === 'PAID')
    const paidAmount = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    const pendingCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length

    return {
      totalCount,
      paidAmount,
      pendingCount,
      deliveredCount,
    }
  }, [orders])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (selectedStatus !== 'all' && order.status !== selectedStatus) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesId = order.id.toLowerCase().includes(q)
        const matchesRef = order.payment_reference?.toLowerCase().includes(q) || false
        const matchesProvider = order.payment_provider?.toLowerCase().includes(q) || false
        const matchesContact =
          order.contacts?.name?.toLowerCase().includes(q) ||
          order.contacts?.phone?.includes(q) ||
          false

        return matchesId || matchesRef || matchesProvider || matchesContact
      }

      return true
    })
  }, [orders, selectedStatus, searchQuery])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Payé</span>
          </span>
        )
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>En attente</span>
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5" />
            <span>Livré</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Annulé</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
            {status}
          </span>
        )
    }
  }

  const formatCurrency = (amount: number, currency: string = 'FCFA') => {
    return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-6 space-y-6 sm:space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
            Commandes & Paiements
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Suivez les commandes passées par vos clients sur WhatsApp et les règlements SasPay.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-border bg-card text-foreground hover:bg-secondary transition-colors"
          title="Actualiser les commandes"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin text-primary')} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* ─── Metric KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Commandes</span>
            <div className="p-2 bg-[#fe5105]/10 text-[#fe5105] rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalCount}
            </span>
          </div>
        </div>

        {/* Paid Revenue */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">CA Encaissé</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(stats.paidAmount)}
            </span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">En Attente</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.pendingCount}
            </span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Livrées</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.deliveredCount}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par référence, client, montant..."
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

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'PAID', label: 'Payées' },
            { id: 'PENDING_PAYMENT', label: 'En attente' },
            { id: 'DELIVERED', label: 'Livrées' },
            { id: 'CANCELLED', label: 'Annulées' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedStatus(pill.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0',
                selectedStatus === pill.id
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content List (Desktop Table + Mobile Cards) ─── */}
      {isLoading ? (
        <div className="p-12 bg-card border border-border rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Chargement des commandes...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 sm:p-16 text-center">
          <div className="mx-auto w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
            {orders.length === 0 ? 'Aucune commande enregistrée' : 'Aucun résultat trouvé'}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto">
            {orders.length === 0
              ? "Vos commandes WhatsApp apparaîtront ici automatiquement dès qu'un panier est validé."
              : 'Essayez de modifier vos filtres ou termes de recherche.'}
          </p>
        </div>
      ) : (
        <>
          {/* 🖥️ Desktop Table View (visible on md+) */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3">Commande</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Montant</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Paiement</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs sm:text-sm">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* ID & Date */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(order.created_at)}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground truncate max-w-[150px]">
                          {order.contacts?.name || 'Client WhatsApp'}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
                          {order.contacts?.phone || '-'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-foreground">
                          {formatCurrency(Number(order.total_amount), order.currency)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground capitalize">
                          {order.payment_provider || 'SasPay'}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[130px]">
                          {order.payment_reference || '-'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {order.saspay_checkout_url && (
                            <a
                              href={order.saspay_checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Lien de paiement SasPay"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📱 Mobile Card View (visible on < md) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3 active:scale-[0.99] transition-all cursor-pointer"
              >
                {/* Top: ID + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-sm text-foreground">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      • {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="shrink-0">{getStatusBadge(order.status)}</div>
                </div>

                {/* Middle: Amount & Customer */}
                <div className="flex items-baseline justify-between pt-1 border-t border-border/50">
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground block">Client</span>
                    <span className="text-sm font-semibold text-foreground truncate block">
                      {order.contacts?.name || order.contacts?.phone || 'Client WhatsApp'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-muted-foreground block">Total</span>
                    <span className="text-base font-bold text-foreground">
                      {formatCurrency(Number(order.total_amount), order.currency)}
                    </span>
                  </div>
                </div>

                {/* Bottom: Provider & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground capitalize">
                    {order.payment_provider || 'SasPay'} {order.payment_reference ? `• ${order.payment_reference.slice(0, 8)}...` : ''}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {order.saspay_checkout_url && (
                      <a
                        href={order.saspay_checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20"
                      >
                        <span>Paiement</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Order Detail Modal ─── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Commande #{selectedOrder.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enregistrée le {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details Grid */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground">Statut du règlement</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground">Montant total</span>
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(Number(selectedOrder.total_amount), selectedOrder.currency)}
                </span>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client :</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.contacts?.name || 'Client WhatsApp'}
                  </span>
                </div>
                {selectedOrder.contacts?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Téléphone :</span>
                    <span className="font-mono text-foreground">{selectedOrder.contacts.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Passerelle :</span>
                  <span className="capitalize text-foreground">
                    {selectedOrder.payment_provider || 'SasPay'}
                  </span>
                </div>
                {selectedOrder.payment_reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Référence :</span>
                    <span className="font-mono text-foreground text-[11px] truncate max-w-[200px]">
                      {selectedOrder.payment_reference}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Link actions */}
              {selectedOrder.saspay_checkout_url && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Lien de paiement SasPay
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedOrder.saspay_checkout_url}
                      className="flex-1 px-3 py-2 text-xs bg-secondary border border-border rounded-xl font-mono text-muted-foreground select-all outline-none"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(selectedOrder.saspay_checkout_url!, selectedOrder.id)
                      }
                      className="px-3 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === selectedOrder.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                    <a
                      href={selectedOrder.saspay_checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <span>Ouvrir</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
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
