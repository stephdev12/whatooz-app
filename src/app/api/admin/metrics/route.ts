import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/admin'
import { normalizePlanCode, PLANS_CONFIG, type PlanCode } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Seul le Super Admin (stephaneboyce@gmail.com) peut accéder à cette API
    if (!isPlatformAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Accès réservé au Super Administrateur de la plateforme' },
        { status: 403 }
      )
    }

    // 1. Récupérer toutes les organisations
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false })

    if (orgsError) {
      console.error('Error fetching orgs for admin:', orgsError)
    }

    // 2. Récupérer tous les profils utilisateurs
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, email, platform_role, created_at')

    // 3. Récupérer l'ensemble des membres d'organisations
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, user_id, role')

    // 4. Récupérer tous les abonnements
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('organization_id, status, trial_ends_at, current_period_end, plans(code, name)')

    // 5. Récupérer l'ensemble des commandes pour le calcul du GMV global et par organisation
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, organization_id, total_amount, currency, status, created_at')

    // 6. Récupérer les configurations WhatsApp actives
    const { data: whatsappConfigs } = await supabaseAdmin
      .from('whatsapp_config')
      .select('organization_id, phone_number_id, is_active')

    // 7. Nombre total de messages échangés
    const { count: totalMessagesCount } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })

    // Indexation des abonnements par organisation
    const subByOrg = new Map<string, any>()
    subscriptions?.forEach((sub) => {
      subByOrg.set(sub.organization_id, sub)
    })

    // Indexation des commandes par organisation
    const ordersByOrg = new Map<string, { totalAmount: number; count: number }>()
    let totalGlobalGMV = 0
    let totalOrdersCount = orders?.length || 0

    orders?.forEach((order) => {
      const amount = Number(order.total_amount) || 0
      const isPaid = order.status === 'PAID'

      if (isPaid) {
        totalGlobalGMV += amount
      }

      const existing = ordersByOrg.get(order.organization_id) || { totalAmount: 0, count: 0 }
      ordersByOrg.set(order.organization_id, {
        totalAmount: existing.totalAmount + (isPaid ? amount : 0),
        count: existing.count + 1,
      })
    })

    // Indexation des WhatsApp configs par organisation
    const waByOrg = new Set<string>()
    whatsappConfigs?.forEach((cfg) => {
      if (cfg.organization_id) waByOrg.add(cfg.organization_id)
    })

    // Indexation des profils par user_id
    const profilesByUser = new Map<string, any>()
    profiles?.forEach((p) => {
      profilesByUser.set(p.user_id, p)
    })

    // Indexation des membres par organisation
    const membersByOrg = new Map<string, any[]>()
    members?.forEach((m) => {
      const list = membersByOrg.get(m.organization_id) || []
      list.push(m)
      membersByOrg.set(m.organization_id, list)
    })

    // Répartition des plans et calcul du MRR
    const planBreakdown: Record<PlanCode, number> = {
      free: 0,
      starter: 0,
      growth: 0,
      business: 0,
      enterprise: 0,
    }

    let totalSubscriptionMRR = 0

    // Construction de la liste des utilisateurs / organisations pour l'affichage
    const userRows: any[] = []

    const organizationsList = orgs || []

    for (const org of organizationsList) {
      const sub = subByOrg.get(org.id)
      const rawPlanName = Array.isArray(sub?.plans)
        ? sub?.plans[0]?.name || sub?.plans[0]?.code
        : sub?.plans?.name || sub?.plans?.code

      const planCode = normalizePlanCode(rawPlanName)
      planBreakdown[planCode] = (planBreakdown[planCode] || 0) + 1

      // Tarification officielle Whatooz en FCFA
      const planDef = PLANS_CONFIG[planCode]
      const planPrice = typeof planDef.priceFcfa === 'number' ? planDef.priceFcfa : 50000
      totalSubscriptionMRR += planPrice

      // Récupérer le propriétaire ou le premier membre
      const orgMembers = membersByOrg.get(org.id) || []
      const ownerMember = orgMembers.find((m) => m.role === 'OWNER') || orgMembers[0]
      const userProfile = ownerMember ? profilesByUser.get(ownerMember.user_id) : null

      const orderStats = ordersByOrg.get(org.id) || { totalAmount: 0, count: 0 }

      userRows.push({
        id: org.id,
        organizationId: org.id,
        organizationName: org.name,
        slug: org.slug,
        userId: userProfile?.user_id || ownerMember?.user_id || org.id,
        email: userProfile?.email || 'Non renseigné',
        fullName: userProfile?.full_name || 'Utilisateur',
        role: ownerMember?.role || 'MEMBER',
        planCode,
        planName: planDef.name,
        planPriceDisplay: planDef.priceDisplay,
        subscriptionStatus: sub?.status || 'active',
        totalTransactionsAmount: orderStats.totalAmount,
        totalOrdersCount: orderStats.count,
        hasWhatsApp: waByOrg.has(org.id),
        membersCount: orgMembers.length || 1,
        createdAt: org.created_at,
      })
    }

    // Estimation des marges bénéficiaires Whatooz (estimé à 72% de marge brute après coûts infra)
    const estimatedNetProfit = Math.round(totalSubscriptionMRR * 0.72)
    const totalSubscriptionARR = totalSubscriptionMRR * 12

    return NextResponse.json({
      summary: {
        totalUsers: profiles?.length || organizationsList.length,
        totalOrganizations: organizationsList.length,
        totalGlobalGMV,
        totalOrdersCount,
        totalSubscriptionMRR,
        totalSubscriptionARR,
        estimatedNetProfit,
        totalActiveWhatsAppNumbers: waByOrg.size,
        totalMessagesCount: totalMessagesCount || 0,
        planBreakdown,
      },
      users: userRows,
    })
  } catch (error: any) {
    console.error('Admin metrics error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne lors de la récupération des métriques' },
      { status: 500 }
    )
  }
}
