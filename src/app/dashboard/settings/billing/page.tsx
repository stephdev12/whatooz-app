'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  Users,
  MessageCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function BillingPage() {
  const { activeOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (activeOrganization) {
      loadBillingData()
    }
  }, [activeOrganization])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Load available plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price_fcfa', { ascending: true })

      setPlans(plansData || [])

      // Load organization subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('organization_id', activeOrganization!.id)
        .single()

      setSubscription(subData)
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setProcessing(planId)
    try {
      // Call the real API to generate SasPay checkout URL
      const res = await fetch('/api/checkout/subscription', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, organization_id: activeOrganization!.id }) 
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
      }

      // Redirect to SasPay checkout page
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('Aucune URL de paiement retournée')
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Erreur lors du traitement.')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Calculate Trial status
  const isTrial = subscription?.status === 'trialing'
  const trialEnds = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null
  const daysLeft = trialEnds ? differenceInDays(trialEnds, new Date()) : 0
  const isTrialExpired = isTrial && daysLeft < 0

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abonnement & Facturation</h1>
        <p className="text-sm text-muted-foreground">Gérez votre forfait, vos quotas et vos moyens de paiement.</p>
      </div>

      {/* CURRENT STATUS */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border p-6 bg-secondary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isTrial ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {isTrial ? <Clock className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isTrial ? 'Période d\'essai gratuit' : `Plan ${subscription?.plan?.name || 'Inconnu'}`}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  subscription?.status === 'trialing' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {subscription?.status === 'active' ? 'Actif' :
                   subscription?.status === 'trialing' ? 'En essai' :
                   'Expiré'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {isTrial 
                    ? (isTrialExpired ? 'Votre période d\'essai a expiré.' : `Il vous reste ${daysLeft} jours d'essai.`)
                    : `Renouvellement le ${format(new Date(subscription?.current_period_end || Date.now()), 'dd MMMM yyyy', { locale: fr })}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLANS TABLE */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Passez à la vitesse supérieure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`rounded-2xl border ${subscription?.plan_id === plan.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-border'} bg-card p-6 shadow-sm flex flex-col relative overflow-hidden`}>
              {subscription?.plan_id === plan.id && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  ACTUEL
                </div>
              )}
              <div className="mb-4">
                <h4 className="text-xl font-bold text-foreground">{plan.name}</h4>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">{plan.price_fcfa.toLocaleString('fr-FR')}</span>
                  <span className="text-sm font-medium text-muted-foreground">FCFA / mois</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Jusqu'à <strong>{plan.max_agents}</strong> agents (utilisateurs)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Jusqu'à <strong>{plan.max_automations}</strong> flux d'automatisations</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>{plan.max_messages_per_month.toLocaleString('fr-FR')}</strong> messages / mois</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Support prioritaire WhatsApp</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={subscription?.plan_id === plan.id || processing !== null}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  subscription?.plan_id === plan.id
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {processing === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {subscription?.plan_id === plan.id ? 'Forfait actuel' : 'Choisir ce plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
