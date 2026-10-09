'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { useAuth } from '@/hooks/use-auth'
import { isPlatformAdmin } from '@/lib/admin'
import {
  getPlanDefinition,
  normalizePlanCode,
  type PlanDefinition,
  type PlanFeatureDefinition,
} from '@/lib/plans'

export interface PlanAccessState {
  plan: PlanDefinition
  isTrial: boolean
  status: 'trialing' | 'active' | 'expired' | 'canceled'
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  loading: boolean
  canAccess: (feature: keyof PlanFeatureDefinition) => boolean
  checkLimit: (limitKey: keyof PlanDefinition['limits'], currentCount: number) => {
    allowed: boolean
    max: number
    remaining: number
  }
  refresh: () => Promise<void>
}

export function usePlanAccess(): PlanAccessState {
  const { user } = useAuth()
  const { activeOrganization } = useOrganization()
  const isAdmin = isPlatformAdmin(user?.email)
  const [loading, setLoading] = useState(true)
  const [planCode, setPlanCode] = useState<string>(isAdmin ? 'enterprise' : 'free')
  const [status, setStatus] = useState<'trialing' | 'active' | 'expired' | 'canceled'>('active')
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchPlan = useCallback(async () => {
    if (isAdmin) {
      setPlanCode('enterprise')
      setStatus('active')
      setLoading(false)
      return
    }

    if (!activeOrganization) {
      setPlanCode('free')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          status,
          trial_ends_at,
          current_period_end,
          plans ( code, name )
        `)
        .eq('organization_id', activeOrganization.id)
        .maybeSingle()

      if (!subscription) {
        setPlanCode('free')
        setStatus('active')
        setTrialEndsAt(null)
        setCurrentPeriodEnd(null)
        return
      }

      const now = new Date()
      const tEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null
      const pEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null

      setTrialEndsAt(tEnd)
      setCurrentPeriodEnd(pEnd)

      let currentStatus: 'trialing' | 'active' | 'expired' | 'canceled' = 'active'
      if (subscription.status === 'trialing') {
        currentStatus = tEnd && tEnd < now ? 'expired' : 'trialing'
      } else if (subscription.status === 'active') {
        currentStatus = pEnd && pEnd < now ? 'expired' : 'active'
      } else {
        currentStatus = (subscription.status as any) || 'canceled'
      }

      setStatus(currentStatus)

      // Pendant l'essai, l'utilisateur a accès au plan Growth
      if (currentStatus === 'trialing') {
        setPlanCode('growth')
      } else if (currentStatus === 'expired') {
        setPlanCode('free')
      } else {
        const rawName = Array.isArray(subscription.plans)
          ? subscription.plans[0]?.code || subscription.plans[0]?.name
          : (subscription.plans as any)?.code || (subscription.plans as any)?.name

        setPlanCode(normalizePlanCode(rawName))
      }
    } catch (err) {
      console.error('Error fetching organization plan:', err)
      setPlanCode('free')
    } finally {
      setLoading(false)
    }
  }, [activeOrganization, supabase])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  const plan = useMemo(() => getPlanDefinition(planCode), [planCode])

  const canAccess = useCallback(
    (feature: keyof PlanFeatureDefinition) => {
      if (isAdmin) return true
      const val = plan.features[feature]
      if (typeof val === 'boolean') return val
      return val !== 'none'
    },
    [plan, isAdmin]
  )

  const checkLimit = useCallback(
    (limitKey: keyof PlanDefinition['limits'], currentCount: number) => {
      if (isAdmin) {
        return {
          allowed: true,
          max: 999999,
          remaining: 999999,
        }
      }
      const maxVal = plan.limits[limitKey]
      const max = typeof maxVal === 'number' ? maxVal : Infinity
      const remaining = Math.max(0, max - currentCount)
      return {
        allowed: currentCount < max,
        max,
        remaining,
      }
    },
    [plan, isAdmin]
  )

  return {
    plan,
    isTrial: status === 'trialing',
    status,
    trialEndsAt,
    currentPeriodEnd,
    loading,
    canAccess,
    checkLimit,
    refresh: fetchPlan,
  }
}
