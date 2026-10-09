'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, Lock, ArrowRight } from 'lucide-react'
import { usePlanAccess } from '@/hooks/use-plan-access'
import type { PlanFeatureDefinition } from '@/lib/plans'

interface PlanFeatureGateProps {
  feature: keyof PlanFeatureDefinition
  requiredPlanName?: string
  fallbackTitle?: string
  fallbackDescription?: string
  children: React.ReactNode
}

export function PlanFeatureGate({
  feature,
  requiredPlanName = 'Growth',
  fallbackTitle = 'Fonctionnalité réservée',
  fallbackDescription,
  children,
}: PlanFeatureGateProps) {
  const { canAccess, plan, loading } = usePlanAccess()

  if (loading) {
    return <>{children}</>
  }

  if (canAccess(feature)) {
    return <>{children}</>
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {fallbackTitle}
      </h3>

      <p className="text-sm text-muted-foreground mb-6">
        {fallbackDescription ||
          `Cette fonctionnalité nécessite le forfait ${requiredPlanName} ou supérieur. Vous êtes actuellement sur le forfait ${plan.name}.`}
      </p>

      <Link
        href="/dashboard/settings/billing"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-105 transition-all shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        <span>Passer au forfait {requiredPlanName}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
