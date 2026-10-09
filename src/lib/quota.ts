import { createClient } from '@/lib/supabase/server'
import { getPlanDefinition, normalizePlanCode, type PlanCode, type PlanDefinition } from '@/lib/plans'
import { isPlatformAdmin } from '@/lib/admin'

export type QuotaType =
  | 'agents'
  | 'team_members'
  | 'ai_agents'
  | 'automations'
  | 'whatsapp_numbers'
  | 'campaigns'
  | 'scheduled_campaigns'
  | 'integrations'
  | 'ai_routing'
  | 'messages'

export interface QuotaCheckResult {
  allowed: boolean
  error?: string
  current?: number
  max?: number
  planCode?: PlanCode
  planName?: string
}

/**
 * Récupère le plan actif d'une organisation (en tenant compte de l'état d'essai et de l'abonnement).
 */
export async function getOrganizationPlan(organizationId: string): Promise<{
  plan: PlanDefinition
  status: 'trialing' | 'active' | 'expired' | 'canceled'
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
}> {
  const supabase = await createClient()

  // Le Super Admin de la plateforme n'a AUCUNE restriction d'abonnement
  const { data: { user } } = await supabase.auth.getUser()
  if (user && isPlatformAdmin(user.email)) {
    return {
      plan: getPlanDefinition('enterprise'),
      status: 'active',
      trialEndsAt: null,
      currentPeriodEnd: null,
    }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, current_period_end, plans(code, name, max_agents, max_automations, max_messages_per_month)')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!subscription) {
    // Si l'organisation n'a pas encore d'abonnement en base, on applique le plan Free
    return {
      plan: getPlanDefinition('free'),
      status: 'active',
    }
  }

  const rawPlanName = Array.isArray(subscription.plans)
    ? subscription.plans[0]?.name || subscription.plans[0]?.code
    : (subscription.plans as any)?.name || (subscription.plans as any)?.code

  const now = new Date()
  let status: 'trialing' | 'active' | 'expired' | 'canceled' = 'active'

  if (subscription.status === 'trialing') {
    if (subscription.trial_ends_at && new Date(subscription.trial_ends_at) < now) {
      status = 'expired'
    } else {
      status = 'trialing'
    }
  } else if (subscription.status === 'active') {
    if (subscription.current_period_end && new Date(subscription.current_period_end) < now) {
      status = 'expired'
    } else {
      status = 'active'
    }
  } else {
    status = (subscription.status as any) || 'canceled'
  }

  // Pendant la période d'essai gratuite, accorder les capacités complètes du plan Growth (le plus populaire)
  // pour que l'utilisateur découvre la puissance de la plateforme
  if (status === 'trialing') {
    return {
      plan: getPlanDefinition('growth'),
      status,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEnd: subscription.current_period_end,
    }
  }

  // Si l'essai est expiré et qu'aucun plan payant n'est actif, rétrograder automatiquement sur les limites Free
  if (status === 'expired') {
    return {
      plan: getPlanDefinition('free'),
      status,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEnd: subscription.current_period_end,
    }
  }

  const resolvedCode = normalizePlanCode(rawPlanName)
  return {
    plan: getPlanDefinition(resolvedCode),
    status,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodEnd: subscription.current_period_end,
  }
}

/**
 * Vérifie si une action ou un quota est autorisé pour l'organisation selon son niveau d'abonnement.
 */
export async function checkQuota(
  organizationId: string,
  quotaType: QuotaType
): Promise<QuotaCheckResult> {
  const supabase = await createClient()

  // Le Super Admin de la plateforme n'a AUCUNE restriction de quota
  const { data: { user } } = await supabase.auth.getUser()
  if (user && isPlatformAdmin(user.email)) {
    return {
      allowed: true,
      current: 0,
      max: 999999,
      planCode: 'enterprise',
      planName: 'Super Admin (Illimité)',
    }
  }

  const { plan, status } = await getOrganizationPlan(organizationId)

  // 1. Vérification des membres d'équipe humains (Utilisateurs)
  if (quotaType === 'agents' || quotaType === 'team_members') {
    const { count, error } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (error) {
      return { allowed: false, error: 'Erreur lors du comptage des membres de l’équipe.' }
    }

    const current = count ?? 0
    const max = plan.limits.users

    if (current >= max) {
      return {
        allowed: false,
        current,
        max,
        planCode: plan.code,
        planName: plan.name,
        error: `Limite de membres atteinte (${current}/${max}) pour le forfait ${plan.name}. Passez au forfait supérieur pour ajouter des collaborateurs.`,
      }
    }

    return { allowed: true, current, max, planCode: plan.code, planName: plan.name }
  }

  // 2. Vérification des Agents IA
  if (quotaType === 'ai_agents') {
    const { count, error } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (error) {
      return { allowed: false, error: 'Erreur lors de la vérification des agents IA.' }
    }

    const current = count ?? 0
    const max = plan.limits.aiAgents

    if (current >= max) {
      return {
        allowed: false,
        current,
        max,
        planCode: plan.code,
        planName: plan.name,
        error: `Limite d'agents IA atteinte (${current}/${max}) pour le forfait ${plan.name}. Passez au forfait supérieur pour configurer davantage d'agents.`,
      }
    }

    return { allowed: true, current, max, planCode: plan.code, planName: plan.name }
  }

  // 3. Vérification des Automatisations ACTIVES
  if (quotaType === 'automations') {
    const { count, error } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) {
      return { allowed: false, error: 'Erreur lors de la vérification des automatisations.' }
    }

    const current = count ?? 0
    const max = plan.limits.activeAutomations

    if (current >= max) {
      return {
        allowed: false,
        current,
        max,
        planCode: plan.code,
        planName: plan.name,
        error: `Limite d'automatisations actives atteinte (${current}/${max}) pour le forfait ${plan.name}. Mettez à niveau votre abonnement pour activer plus de flux.`,
      }
    }

    return { allowed: true, current, max, planCode: plan.code, planName: plan.name }
  }

  // 4. Vérification des Campagnes Marketing (Broadcasts)
  if (quotaType === 'campaigns') {
    if (plan.features.campaigns === 'none') {
      return {
        allowed: false,
        planCode: plan.code,
        planName: plan.name,
        error: `Les campagnes de diffusion WhatsApp ne sont pas disponibles sur le forfait Free. Passez au forfait Starter (5 000 FCFA/mois) pour envoyer des campagnes.`,
      }
    }

    return { allowed: true, planCode: plan.code, planName: plan.name }
  }

  // 5. Vérification des Campagnes Programmées / Récurrentes
  if (quotaType === 'scheduled_campaigns') {
    if (!plan.features.scheduledCampaigns) {
      return {
        allowed: false,
        planCode: plan.code,
        planName: plan.name,
        error: `La programmation de campagnes marketing est disponible à partir du forfait Growth (15 000 FCFA/mois).`,
      }
    }

    return { allowed: true, planCode: plan.code, planName: plan.name }
  }

  // 6. Vérification du Routage IA multi-fournisseurs (Multi-model routing)
  if (quotaType === 'ai_routing') {
    if (!plan.features.multiModelRouting) {
      return {
        allowed: false,
        planCode: plan.code,
        planName: plan.name,
        error: `Le routage personnalisé entre plusieurs fournisseurs IA (DeepSeek, OpenAI, Gemini...) est réservé au forfait Business (35 000 FCFA/mois).`,
      }
    }

    return { allowed: true, planCode: plan.code, planName: plan.name }
  }

  // 7. Vérification des Numéros WhatsApp connectés
  if (quotaType === 'whatsapp_numbers') {
    const { count, error } = await supabase
      .from('whatsapp_config')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (error) {
      return { allowed: false, error: 'Erreur lors de la vérification des numéros WhatsApp.' }
    }

    const current = count ?? 0
    const max = plan.limits.whatsappNumbers

    if (current >= max) {
      return {
        allowed: false,
        current,
        max,
        planCode: plan.code,
        planName: plan.name,
        error: `Limite de numéros WhatsApp atteinte (${current}/${max}) pour le forfait ${plan.name}. Passez au forfait supérieur pour connecter des numéros supplémentaires.`,
      }
    }

    return { allowed: true, current, max, planCode: plan.code, planName: plan.name }
  }

  return { allowed: true, planCode: plan.code, planName: plan.name }
}
