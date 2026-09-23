'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { CreditCard, ArrowUpRight, Clock, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react'

export default function WalletPage() {
  const { activeOrganization } = useOrganization()
  const supabase = createClient()
  const [wallet, setWallet] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!activeOrganization) return

    const loadData = async () => {
      setIsLoading(true)
      
      const { data: wData } = await supabase
        .from('wallets')
        .select('*')
        .eq('organization_id', activeOrganization.id)
        .maybeSingle()

      setWallet(wData)

      if (wData) {
        const { data: wHistory } = await supabase
          .from('wallet_withdrawals')
          .select('*')
          .eq('wallet_id', wData.id)
          .order('created_at', { ascending: false })

        if (wHistory) {
          setWithdrawals(wHistory)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [activeOrganization, supabase])

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return

    setIsWithdrawing(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization!.id
        },
        body: JSON.stringify({ amount: Number(amount), method: 'Bank Transfer' })
      })

      if (res.ok) {
        setAmount('')
        const { data: wData } = await supabase
          .from('wallets')
          .select('*')
          .eq('organization_id', activeOrganization!.id)
          .maybeSingle()
        setWallet(wData)

        const { data: wHistory } = await supabase
          .from('wallet_withdrawals')
          .select('*')
          .eq('wallet_id', wData.id)
          .order('created_at', { ascending: false })
        setWithdrawals(wHistory || [])
      } else {
        alert("Erreur lors de la demande de retrait")
      }
    } catch (err) {
      console.error(err)
    }
    setIsWithdrawing(false)
  }

  const balance = wallet ? wallet.balance : 0
  const currency = wallet ? wallet.currency : 'XOF'

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portefeuille</h1>
          <p className="text-sm text-muted-foreground">Gérez vos revenus générés via SasPay et demandez des retraits.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-center p-6">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1 overflow-hidden">
          {/* Top section: Balance and Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            {/* Balance Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-medium text-muted-foreground">Solde disponible</h2>
              </div>
              <div className="text-4xl font-bold text-foreground mt-2">
                {Number(balance).toLocaleString('fr-FR')} {currency}
              </div>
            </div>

            {/* Withdraw Action Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-center">
              <h2 className="text-sm font-medium text-foreground mb-4">Demander un retrait</h2>
              <form onSubmit={handleWithdrawal} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Montant ({currency})</label>
                  <input
                    type="number"
                    min="1000"
                    max={balance}
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isWithdrawing || !amount || Number(amount) > balance || Number(amount) <= 0}
                  className="flex items-center justify-center h-[38px] px-6 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isWithdrawing ? 'En cours...' : 'Retirer'}
                </button>
              </form>
            </div>
          </div>

          {/* History Section */}
          <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">Historique des retraits</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              {withdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <ArrowRightLeft className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Aucun retrait</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Vos demandes de retrait apparaîtront ici.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Montant</th>
                      <th className="px-6 py-4 font-medium">Méthode</th>
                      <th className="px-6 py-4 font-medium text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.map((w: any) => (
                      <tr key={w.id} className="hover:bg-secondary/80 transition-colors group">
                        <td className="px-6 py-4 text-foreground font-medium">
                          {new Date(w.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {Number(w.amount).toLocaleString('fr-FR')} {w.currency}
                        </td>
                        <td className="px-6 py-4">
                          {w.withdrawal_method || 'Virement bancaire'}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end">
                          {w.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-900/50">
                              <Clock className="w-3.5 h-3.5" />
                              En attente
                            </span>
                          )}
                          {w.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900/50">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Effectué
                            </span>
                          )}
                          {w.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
                              <XCircle className="w-3.5 h-3.5" />
                              Refusé
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
