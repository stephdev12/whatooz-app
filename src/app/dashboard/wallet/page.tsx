'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { CreditCard, ArrowRightLeft, Clock, CheckCircle, XCircle, Download, Upload } from 'lucide-react'

export default function WalletPage() {
  const { activeOrganization } = useOrganization()
  const supabase = createClient()
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [amount, setAmount] = useState('')
  const [network, setNetwork] = useState('MTN')
  const [phone, setPhone] = useState('')
  const [filter, setFilter] = useState('ALL') // ALL, SALE, PAYMENT, WITHDRAWAL, REFUND, FEE

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
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', wData.id)
          .order('created_at', { ascending: false })

        if (wHistory) {
          setTransactions(wHistory)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [activeOrganization, supabase])

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet || !amount || isNaN(Number(amount)) || Number(amount) <= 0 || !phone) return

    setIsWithdrawing(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization!.id
        },
        body: JSON.stringify({ amount: Number(amount), method: network, phone })
      })

      if (res.ok) {
        setAmount('')
        setPhone('')
        
        // Reload
        const { data: wData } = await supabase
          .from('wallets')
          .select('*')
          .eq('organization_id', activeOrganization!.id)
          .maybeSingle()
        setWallet(wData)

        if (wData) {
          const { data: wHistory } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wData.id)
            .order('created_at', { ascending: false })
          setTransactions(wHistory || [])
        }
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error || 'Demande de retrait échouée'}`)
      }
    } catch (err) {
      console.error(err)
    }
    setIsWithdrawing(false)
  }

  const availableBalance = wallet ? wallet.available_balance : 0
  const pendingBalance = wallet ? wallet.pending_balance : 0
  const currency = wallet ? wallet.currency : 'XOF'

  const filteredTransactions = filter === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.type === filter)

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
                <div className="flex flex-col">
                  <h2 className="text-sm font-medium text-muted-foreground">Solde disponible</h2>
                  <div className="text-4xl font-bold text-foreground mt-1">
                    {Number(availableBalance).toLocaleString('fr-FR')} {currency}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between">
                <span className="text-sm text-muted-foreground">En attente</span>
                <span className="text-sm font-medium text-foreground">{Number(pendingBalance).toLocaleString('fr-FR')} {currency}</span>
              </div>
            </div>

            {/* Withdraw Action Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-center">
              <h2 className="text-sm font-medium text-foreground mb-4">Demander un retrait</h2>
              <form onSubmit={handleWithdrawal} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Montant ({currency})</label>
                    <input
                      type="number"
                      min="1000"
                      max={availableBalance}
                      step="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Ex: 50000"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                      required
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Réseau</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                    >
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="Orange">Orange Money</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Numéro de téléphone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 2376XXXXXXXX"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isWithdrawing || !amount || Number(amount) > availableBalance || Number(amount) <= 0 || !phone}
                    className="flex items-center justify-center h-[38px] px-6 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isWithdrawing ? 'En cours...' : 'Retirer'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* History Section */}
          <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-sm font-medium text-foreground">Historique des transactions</h2>
              <div className="flex gap-2">
                {['ALL', 'PAYMENT', 'WITHDRAWAL', 'SALE', 'REFUND', 'FEE'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === f ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                  >
                    {f === 'ALL' ? 'Tous' : f === 'PAYMENT' ? 'Paiements' : f === 'WITHDRAWAL' ? 'Retraits' : f === 'SALE' ? 'Ventes' : f === 'REFUND' ? 'Remboursements' : 'Frais'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <ArrowRightLeft className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Aucune transaction</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Vos paiements et retraits apparaîtront ici.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Détails</th>
                      <th className="px-6 py-4 font-medium">Montant</th>
                      <th className="px-6 py-4 font-medium text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-secondary/80 transition-colors group">
                        <td className="px-6 py-4 text-foreground font-medium whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${t.direction === 'CREDIT' ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {t.direction === 'CREDIT' ? <Download className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {t.reference_type && t.reference_id && (
                            <span className="text-xs font-mono">{t.reference_type} #{t.reference_id.substring(0,8)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                          {t.direction === 'CREDIT' ? '+' : '-'}{Number(t.amount).toLocaleString('fr-FR')} {currency}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end">
                          {t.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-900/50">
                              <Clock className="w-3.5 h-3.5" />
                              En attente
                            </span>
                          )}
                          {t.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900/50">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Terminé
                            </span>
                          )}
                          {t.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
                              <XCircle className="w-3.5 h-3.5" />
                              Échoué
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

