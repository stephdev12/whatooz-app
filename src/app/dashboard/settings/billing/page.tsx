'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Bot,
  Zap,
  Phone,
  Users,
  Layers,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PLANS_CONFIG, normalizePlanCode, type PlanCode } from '@/lib/plans'

export default function BillingPage() {
  const { activeOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
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

      // Load organization subscription with plan relation
      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('organization_id', activeOrganization!.id)
        .maybeSingle()

      setSubscription(subData)
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planCode: PlanCode) => {
    setProcessing(planCode)
    try {
      const res = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planCode,
          organization_id: activeOrganization!.id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        await loadBillingData()
        alert('Votre forfait a été mis à jour avec succès.')
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate Subscription & Trial Status
  const isTrial = subscription?.status === 'trialing'
  const trialEnds = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null
  const daysLeft = trialEnds ? Math.max(0, differenceInDays(trialEnds, new Date())) : 0
  const isTrialExpired = isTrial && daysLeft <= 0

  const rawPlanName = subscription?.plan?.name || subscription?.plan?.code
  const currentPlanCode: PlanCode = isTrial
    ? 'growth'
    : isTrialExpired
    ? 'free'
    : normalizePlanCode(rawPlanName)

  const currentPlanDef = PLANS_CONFIG[currentPlanCode]
  const displayPlanCards: PlanCode[] = ['free', 'starter', 'growth', 'business']

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">Abonnement & Facturation</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Une tarification transparente en FCFA conçue pour évoluer avec la croissance de votre entreprise.
        </p>
      </div>

      {/* 1. ÉTAT DU FORFAIT ACTUEL */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border p-6 bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isTrial ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
              }`}
            >
              {isTrial ? <Clock className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Forfait {currentPlanDef.name}
                </h2>
                {isTrial && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                    Période d&apos;essai gratuit
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    subscription?.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : subscription?.status === 'trialing'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {subscription?.status === 'active'
                    ? 'Actif'
                    : subscription?.status === 'trialing'
                    ? 'En essai'
                    : 'Expiré'}
                </span>
                <span>
                  {isTrial
                    ? isTrialExpired
                      ? 'Votre essai est terminé. Choisissez un forfait ci-dessous pour continuer.'
                      : `Il vous reste ${daysLeft} jours d'essai gratuit avec les fonctionnalités Growth.`
                    : subscription?.current_period_end
                    ? `Renouvellement le ${format(
                        new Date(subscription.current_period_end),
                        'dd MMMM yyyy',
                        { locale: fr }
                      )}`
                    : 'Abonnement sans engagement'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quotas actuels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="space-y-1 sm:pr-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" /> Numéros WhatsApp
            </span>
            <p className="text-lg font-bold text-foreground">
              {currentPlanDef.limits.whatsappNumbers} {currentPlanDef.limits.whatsappNumbers > 1 ? 'numéros' : 'numéro'}
            </p>
          </div>
          <div className="space-y-1 sm:px-4 pt-4 sm:pt-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> Membres d&apos;équipe
            </span>
            <p className="text-lg font-bold text-foreground">
              {currentPlanDef.limits.users} {currentPlanDef.limits.users > 1 ? 'utilisateurs' : 'utilisateur'}
            </p>
          </div>
          <div className="space-y-1 sm:px-4 pt-4 sm:pt-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-primary" /> Agents IA
            </span>
            <p className="text-lg font-bold text-foreground">
              {currentPlanDef.limits.aiAgents} {currentPlanDef.limits.aiAgents > 1 ? 'agents' : 'agent'}
            </p>
          </div>
          <div className="space-y-1 sm:pl-4 pt-4 sm:pt-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> Automatisations
            </span>
            <p className="text-lg font-bold text-foreground">
              {currentPlanDef.limits.activeAutomations > 100
                ? 'Illimitées'
                : `${currentPlanDef.limits.activeAutomations} actives`}
            </p>
          </div>
        </div>
      </div>

      {/* 2. TRANSPARENCE DES 3 COÛTS */}
      <div className="rounded-2xl border border-border p-6 bg-secondary/15 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3>Comprendre la facturation transparente Whatooz</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="p-3.5 rounded-xl bg-card border border-border">
            <strong className="text-foreground block mb-1">1. Forfait Whatooz</strong>
            Accès aux fonctionnalités, boîte de réception, automatisations, catalogues et gestion des commandes.
          </div>
          <div className="p-3.5 rounded-xl bg-card border border-border">
            <strong className="text-foreground block mb-1">2. Crédits IA</strong>
            Consommation réelle des modèles (tokens). Les forfaits Starter, Growth et Business incluent un quota cible affiché dans votre compte.
          </div>
          <div className="p-3.5 rounded-xl bg-card border border-border">
            <strong className="text-foreground block mb-1">3. WhatsApp & Paiements</strong>
            Frais de conversation officiels Meta et commissions SasPay distincts, sans aucune marge cachée de Whatooz.
          </div>
        </div>
      </div>

      {/* 3. GRILLE DES 4 FORFAITS */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Choisissez le forfait adapté à votre activité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayPlanCards.map((code) => {
            const plan = PLANS_CONFIG[code]
            const isCurrent = currentPlanCode === code
            const isHighlight = plan.popular

            return (
              <div
                key={code}
                className={`rounded-2xl border ${
                  isCurrent
                    ? 'border-primary ring-2 ring-primary/20'
                    : isHighlight
                    ? 'border-[#fe5105]'
                    : 'border-border'
                } bg-card p-5 shadow-xs flex flex-col justify-between relative overflow-hidden`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    Actuel
                  </div>
                )}
                {!isCurrent && plan.badge && (
                  <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-bl-lg">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">
                      {plan.tagline}
                    </p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground">
                        {plan.priceDisplay}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Quotas highlights */}
                  <div className="p-2.5 rounded-lg bg-secondary/40 text-[11.5px] space-y-1 mb-4 border border-border/50">
                    <div>
                      <strong>{plan.limits.whatsappNumbers}</strong> WhatsApp •{' '}
                      <strong>{plan.limits.users}</strong> utilisateurs
                    </div>
                    <div>
                      <strong>{plan.limits.aiAgents}</strong> agents IA •{' '}
                      <strong>
                        {plan.limits.activeAutomations > 100
                          ? 'Automatisations avancées'
                          : `${plan.limits.activeAutomations} flux actifs`}
                      </strong>
                    </div>
                  </div>

                  {/* Feature checklist */}
                  <ul className="space-y-2 mb-6 text-xs text-muted-foreground">
                    {plan.highlights.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpgrade(code)}
                  disabled={isCurrent || processing !== null}
                  className={`w-full py-2 px-3 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                      : isHighlight
                      ? 'bg-primary text-primary-foreground hover:brightness-105'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {processing === code ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isCurrent ? 'Forfait actuel' : plan.ctaText}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
