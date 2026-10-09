/**
 * Centralized Plans and Capabilities for Whatooz
 *
 * Grille tarifaire africaine officielle :
 * - Free: 0 FCFA / mois (Découverte)
 * - Starter: 5 000 FCFA / mois (Petits commerçants)
 * - Growth: 15 000 FCFA / mois (Recommandé / Entreprises en croissance)
 * - Business: 35 000 FCFA / mois (PME & Équipes commerciales)
 * - Enterprise: Sur devis (Grands comptes & franchises)
 */

export type PlanCode = 'free' | 'starter' | 'growth' | 'business' | 'enterprise'

export interface PlanFeatureDefinition {
  inbox: boolean
  contacts: boolean
  catalogAndOrders: boolean
  metaTemplatesAndFlows: boolean
  basicAnalytics: boolean
  advancedAnalytics: boolean
  campaigns: 'none' | 'basic' | 'advanced'
  scheduledCampaigns: boolean
  externalIntegrations: 'none' | 'single' | 'multiple'
  aiToolsAndConnections: boolean
  multiModelRouting: boolean
  granularAgentPermissions: boolean
  walletWithdrawals: boolean
  prioritySupport: boolean
  dedicatedManagerSla: boolean
}

export interface PlanLimits {
  whatsappNumbers: number
  users: number
  aiAgents: number
  activeAutomations: number
  aiBudgetFcfa: number | 'custom'
  externalIntegrations: number
}

export interface PlanDefinition {
  code: PlanCode
  name: string
  badge?: string
  popular?: boolean
  priceFcfa: number | 'custom'
  priceDisplay: string
  period: string
  tagline: string
  description: string
  targetAudience: string
  limits: PlanLimits
  features: PlanFeatureDefinition
  highlights: string[]
  ctaText: string
}

export const PLANS_CONFIG: Record<PlanCode, PlanDefinition> = {
  free: {
    code: 'free',
    name: 'Free',
    badge: 'Découverte',
    popular: false,
    priceFcfa: 0,
    priceDisplay: '0 FCFA',
    period: '/ mois',
    tagline: 'Idéal pour tester Whatooz et connecter son activité.',
    description: 'Une offre gratuite sans engagement pour découvrir la puissance de Whatooz sur WhatsApp.',
    targetAudience: 'Commerçants débutants et phase de test',
    limits: {
      whatsappNumbers: 1,
      users: 1,
      aiAgents: 1,
      activeAutomations: 2,
      aiBudgetFcfa: 0,
      externalIntegrations: 0,
    },
    features: {
      inbox: true,
      contacts: true,
      catalogAndOrders: true,
      metaTemplatesAndFlows: true,
      basicAnalytics: true,
      advancedAnalytics: false,
      campaigns: 'none',
      scheduledCampaigns: false,
      externalIntegrations: 'none',
      aiToolsAndConnections: false,
      multiModelRouting: false,
      granularAgentPermissions: false,
      walletWithdrawals: false,
      prioritySupport: false,
      dedicatedManagerSla: false,
    },
    highlights: [
      '1 numéro WhatsApp & 1 utilisateur',
      '1 agent IA (quota découverte)',
      '2 automatisations actives',
      'Boîte de réception & contacts',
      'Catalogue produits & commandes',
      'Templates & Flows Meta officiels',
      'Statistiques de base',
      'Pas de campagnes de masse',
    ],
    ctaText: 'Commencer gratuitement',
  },

  starter: {
    code: 'starter',
    name: 'Starter',
    badge: 'Indépendants',
    popular: false,
    priceFcfa: 5000,
    priceDisplay: '5 000 FCFA',
    period: '/ mois',
    tagline: 'Pour les petits commerçants et entrepreneurs.',
    description: 'Le premier palier accessible pour professionnaliser ses ventes et son support client.',
    targetAudience: 'Boutiques indépendantes et petits commerces',
    limits: {
      whatsappNumbers: 1,
      users: 2,
      aiAgents: 2,
      activeAutomations: 10,
      aiBudgetFcfa: 1000,
      externalIntegrations: 1,
    },
    features: {
      inbox: true,
      contacts: true,
      catalogAndOrders: true,
      metaTemplatesAndFlows: true,
      basicAnalytics: true,
      advancedAnalytics: false,
      campaigns: 'basic',
      scheduledCampaigns: false,
      externalIntegrations: 'single',
      aiToolsAndConnections: false,
      multiModelRouting: false,
      granularAgentPermissions: false,
      walletWithdrawals: true,
      prioritySupport: false,
      dedicatedManagerSla: false,
    },
    highlights: [
      '1 numéro WhatsApp & 2 utilisateurs',
      '2 agents IA dédiés',
      '10 automatisations actives',
      'Catalogue, produits & commandes',
      'Templates personnalisés avec variables',
      'Campagnes marketing de base',
      'Connexion d’un Google Sheet',
      'Wallet & demandes de retrait',
      'Quota IA mensuel visible en direct',
    ],
    ctaText: 'Choisir Starter',
  },

  growth: {
    code: 'growth',
    name: 'Growth',
    badge: 'Recommandé',
    popular: true,
    priceFcfa: 15000,
    priceDisplay: '15 000 FCFA',
    period: '/ mois',
    tagline: 'Pour les entreprises qui automatisent leurs ventes.',
    description: 'La formule optimale pour développer son chiffre d’affaires avec des agents IA multi-outils.',
    targetAudience: 'Marques en expansion, e-commerces & équipes de vente',
    limits: {
      whatsappNumbers: 3,
      users: 5,
      aiAgents: 5,
      activeAutomations: 50,
      aiBudgetFcfa: 3000,
      externalIntegrations: 999,
    },
    features: {
      inbox: true,
      contacts: true,
      catalogAndOrders: true,
      metaTemplatesAndFlows: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      campaigns: 'advanced',
      scheduledCampaigns: true,
      externalIntegrations: 'multiple',
      aiToolsAndConnections: true,
      multiModelRouting: false,
      granularAgentPermissions: false,
      walletWithdrawals: true,
      prioritySupport: false,
      dedicatedManagerSla: false,
    },
    highlights: [
      'Jusqu’à 3 numéros WhatsApp',
      '5 utilisateurs & 5 agents IA',
      '50 automatisations actives',
      'Segments & campagnes personnalisées',
      'Automatisations marketing programmées',
      'IA avec outils & connexions externes',
      'Google Sheets, Docs & Telegram',
      'Commerce, commandes & paiements',
      'Statistiques commerciales avancées',
      'Historique & logs d’automatisation',
    ],
    ctaText: 'Choisir Growth',
  },

  business: {
    code: 'business',
    name: 'Business',
    badge: 'PME & Équipes',
    popular: false,
    priceFcfa: 35000,
    priceDisplay: '35 000 FCFA',
    period: '/ mois',
    tagline: 'Pour les PME et les équipes commerciales exigeantes.',
    description: 'Une infrastructure complète avec multi-numéros, routage de modèles IA et support prioritaire.',
    targetAudience: 'PME, agences et équipes avec fort volume d’échanges',
    limits: {
      whatsappNumbers: 10,
      users: 15,
      aiAgents: 10,
      activeAutomations: 9999,
      aiBudgetFcfa: 8000,
      externalIntegrations: 999,
    },
    features: {
      inbox: true,
      contacts: true,
      catalogAndOrders: true,
      metaTemplatesAndFlows: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      campaigns: 'advanced',
      scheduledCampaigns: true,
      externalIntegrations: 'multiple',
      aiToolsAndConnections: true,
      multiModelRouting: true,
      granularAgentPermissions: true,
      walletWithdrawals: true,
      prioritySupport: true,
      dedicatedManagerSla: false,
    },
    highlights: [
      'Jusqu’à 10 numéros WhatsApp',
      '15 utilisateurs & 10 agents IA',
      'Automatisations avancées illimitées',
      'Permissions fines par agent et outil',
      'Gestion avancée équipes & assignations',
      'Campagnes, audiences & rapports complets',
      'Intégrations externes multiples',
      'Routage IA entre fournisseurs & modèles',
      'Analyses ventes & performances IA',
      'Gestion avancée commandes & wallet',
      'Support prioritaire 7j/7',
    ],
    ctaText: 'Choisir Business',
  },

  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    badge: 'Sur Mesure',
    popular: false,
    priceFcfa: 'custom',
    priceDisplay: 'Sur devis',
    period: '',
    tagline: 'Pour les structures avec des besoins spécifiques.',
    description: 'Accompagnement sur mesure, infrastructure dédiée et SLAs adaptés.',
    targetAudience: 'Grands groupes, franchises et institutions',
    limits: {
      whatsappNumbers: 9999,
      users: 9999,
      aiAgents: 9999,
      activeAutomations: 9999,
      aiBudgetFcfa: 'custom',
      externalIntegrations: 9999,
    },
    features: {
      inbox: true,
      contacts: true,
      catalogAndOrders: true,
      metaTemplatesAndFlows: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      campaigns: 'advanced',
      scheduledCampaigns: true,
      externalIntegrations: 'multiple',
      aiToolsAndConnections: true,
      multiModelRouting: true,
      granularAgentPermissions: true,
      walletWithdrawals: true,
      prioritySupport: true,
      dedicatedManagerSla: true,
    },
    highlights: [
      'Limites personnalisées sur mesure',
      'Numéros et utilisateurs selon vos besoins',
      'Agents spécialisés & permissions dédiées',
      'Intégrations personnalisées & APIs ERP',
      'Routage IA custom & fine-tuning métier',
      'Accompagnement dédié à la migration',
      'SLA contractuel garanti 99.9%',
      'Account Manager dédié',
    ],
    ctaText: 'Contacter un expert',
  },
}

/**
 * Normalise un code ou nom de plan vers un PlanCode valide.
 */
export function normalizePlanCode(raw?: string | null): PlanCode {
  if (!raw) return 'free'
  const clean = raw.trim().toLowerCase()
  if (clean.includes('enter') || clean.includes('sur devis')) return 'enterprise'
  if (clean.includes('busi')) return 'business'
  if (clean.includes('grow') || clean.includes('pro')) return 'growth'
  if (clean.includes('start')) return 'starter'
  return 'free'
}

/**
 * Récupère la définition complète d'un plan à partir d'un code ou nom.
 */
export function getPlanDefinition(rawPlan?: string | null): PlanDefinition {
  const code = normalizePlanCode(rawPlan)
  return PLANS_CONFIG[code]
}

/**
 * Vérifie si un plan a accès à une fonctionnalité donnée.
 */
export function checkPlanFeatureAccess(
  rawPlan: string | null | undefined,
  feature: keyof PlanFeatureDefinition
): boolean {
  const plan = getPlanDefinition(rawPlan)
  const val = plan.features[feature]
  if (typeof val === 'boolean') return val
  return val !== 'none'
}
