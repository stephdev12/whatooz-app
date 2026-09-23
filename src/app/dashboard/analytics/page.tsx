'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  ShoppingCart,
  MessageCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

export default function AnalyticsPage() {
  const { activeOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalContacts: 0,
    activeConversations: 0,
    revenueGrowth: 0, // mock percentage for now
  })
  
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (activeOrganization) {
      loadAnalyticsData()
    }
  }, [activeOrganization])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const orgId = activeOrganization!.id

      // 1. Fetch Orders (Revenue & Count)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('organization_id', orgId)

      if (ordersError) throw ordersError

      // 2. Fetch Contacts
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      if (contactsError) throw contactsError

      // 3. Fetch Active Conversations
      const { count: conversationsCount, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'open')

      if (convError) throw convError

      // Process Orders
      let revenue = 0
      const paidOrders = orders?.filter(o => o.status === 'PAID') || []
      revenue = paidOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)

      setMetrics({
        totalRevenue: revenue,
        totalOrders: orders?.length || 0,
        totalContacts: contactsCount || 0,
        activeConversations: conversationsCount || 0,
        revenueGrowth: 12.5, // placeholder
      })

      // Recent Orders (Last 5)
      const sortedOrders = [...(orders || [])].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setRecentOrders(sortedOrders.slice(0, 5))

      // Generate Chart Data (Last 7 Days Revenue)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i)
        return {
          date: startOfDay(d),
          name: format(d, 'EEE', { locale: fr }),
          revenue: 0,
          orders: 0
        }
      })

      paidOrders.forEach(order => {
        const orderDate = new Date(order.created_at)
        const dayEntry = last7Days.find(d => 
          orderDate >= d.date && orderDate <= endOfDay(d.date)
        )
        if (dayEntry) {
          dayEntry.revenue += Number(order.total_amount) || 0
          dayEntry.orders += 1
        }
      })

      setChartData(last7Days)

    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const kpis = [
    {
      title: "Chiffre d'Affaires",
      value: `${metrics.totalRevenue.toLocaleString('fr-FR')} FCFA`,
      icon: <CreditCard className="h-5 w-5 text-indigo-600" />,
      trend: "+12.5%",
      isPositive: true,
      description: "Par rapport au mois dernier"
    },
    {
      title: "Commandes",
      value: metrics.totalOrders.toString(),
      icon: <ShoppingCart className="h-5 w-5 text-emerald-600" />,
      trend: "+5.2%",
      isPositive: true,
      description: "Total des commandes enregistrées"
    },
    {
      title: "Clients (Contacts)",
      value: metrics.totalContacts.toString(),
      icon: <Users className="h-5 w-5 text-blue-600" />,
      trend: "+18%",
      isPositive: true,
      description: "Nouveaux prospects et clients"
    },
    {
      title: "Conversations Actives",
      value: metrics.activeConversations.toString(),
      icon: <MessageCircle className="h-5 w-5 text-amber-600" />,
      trend: "-2.4%",
      isPositive: false,
      description: "En attente de réponse"
    }
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Aperçu de vos performances et activités récentes.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {kpi.trend}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{kpi.title}</h3>
              <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Revenus (7 derniers jours)</h2>
              <p className="text-sm text-muted-foreground">Évolution du chiffre d'affaires quotidien.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} FCFA`, 'Revenu']}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-foreground">Commandes récentes</h2>
          </div>
          
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Package className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune commande récente</p>
              </div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    order.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                    order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {order.customer_name || 'Client Inconnu'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'dd MMM à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {order.total_amount} FCFA
                    </p>
                    <p className="text-xs font-medium uppercase mt-0.5">
                      {order.status === 'PAID' ? (
                        <span className="text-emerald-600">Payé</span>
                      ) : order.status === 'PENDING' ? (
                        <span className="text-amber-600">En attente</span>
                      ) : (
                        <span className="text-muted-foreground">{order.status}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
