'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Eye, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'

interface Order {
  id: string
  total_amount: number
  currency: string
  status: string
  payment_provider: string
  payment_reference: string
  saspay_checkout_url: string
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Payé</span>
      case 'PENDING_PAYMENT':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">En attente</span>
      case 'CANCELLED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Annulé</span>
      case 'DELIVERED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Livré</span>
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary text-foreground">{status}</span>
    }
  }

  if (isLoading) {
    return <div className="p-8 animate-pulse flex space-x-4">Chargement...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivez les paiements SasPay et les commandes de vos clients.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Aucune commande</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Les commandes apparaîtront ici lorsqu'un client initiera un achat depuis WhatsApp.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Paiement</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{order.total_amount} {order.currency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground capitalize">{order.payment_provider}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{order.payment_reference || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-3">
                    {order.saspay_checkout_url && (
                      <a href={order.saspay_checkout_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900" title="Lien de paiement SasPay">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button className="text-muted-foreground hover:text-foreground">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
