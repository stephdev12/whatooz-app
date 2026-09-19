/**
 * Flow Templates Library — Modèles métier WhatsApp Flows prêts à l'emploi.
 * Inspirés des cas d'usage officiels Meta (Ecoshop, Unity Bank, CS Mutual, etc.)
 */

export type FlowCategory =
  | 'LEAD_GENERATION'
  | 'CUSTOMER_SUPPORT'
  | 'APPOINTMENT_BOOKING'
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'CONTACT_US'
  | 'SURVEY'
  | 'OTHER'

export interface FlowFieldOption {
  id: string
  title: string
  description?: string
}

export interface FlowScreenField {
  id: string
  name: string
  label: string
  type: 'TextInput' | 'TextArea' | 'Dropdown' | 'RadioButtons' | 'CheckboxGroup' | 'DatePicker'
  required: boolean
  placeholder?: string
  options?: FlowFieldOption[]
}

export interface FlowTemplateScreen {
  id: string
  title: string
  terminal?: boolean
  heading?: string
  subheading?: string
  bodyText?: string
  imageBannerUrl?: string
  fields: FlowScreenField[]
  ctaLabel: string
  actionType?: 'navigate' | 'complete'
  targetScreenId?: string
}

export interface PrebuiltFlowTemplate {
  id: string
  name: string
  category: FlowCategory
  badge: string
  description: string
  iconName: string
  headerImageUrl?: string
  headerText?: string
  flowCta: string
  flowBodyText: string
  flowFooterText?: string
  screens: FlowTemplateScreen[]
}

export const PREBUILT_FLOW_TEMPLATES: PrebuiltFlowTemplate[] = [
  {
    id: 'ecommerce_catalog',
    name: 'Boutique & Commande Express (Style Ecoshop Multipage)',
    category: 'OTHER',
    badge: 'E-commerce & Vente',
    description: 'Parcours e-commerce officiel Meta en 3 étapes : Choix Type & Budget ➔ Choix du Modèle ➔ Fiche Produit détaillée avec Image, Prix & Paiement instantané.',
    iconName: 'ShoppingBag',
    headerImageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    headerText: '🔥 Offres WhatsApp Privilège',
    flowCta: 'Voir les modèles & commander',
    flowBodyText: 'Découvrez nos promotions de la semaine ! Sélectionnez votre article et commandez en quelques clics directement sur WhatsApp :',
    flowFooterText: 'Livraison express • Paiement sécurisé Wave & Mobile Money',
    screens: [
      {
        id: 'STEP_CRITERIA',
        title: 'Type & Budget',
        heading: 'Trouvez l’appareil idéal',
        subheading: 'Étape 1 sur 3 • Définissez vos critères',
        imageBannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        actionType: 'navigate',
        targetScreenId: 'STEP_MODELS',
        ctaLabel: 'Suivant — Voir les modèles ➔',
        fields: [
          {
            id: 'f_cat',
            name: 'categorie_produit',
            label: 'Quel type d’article recherchez-vous ?',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'smartphones', title: '📱 Smartphones 5G & Mobiles', description: 'Écrans OLED, caméras haute résolution' },
              { id: 'audio', title: '🎧 Casques & Écouteurs sans fil', description: 'Réduction active de bruit, son haute fidélité' },
              { id: 'ordinateurs', title: '💻 Ordinateurs & Tablettes Pro', description: 'Performance bureautique et créative' },
            ],
          },
          {
            id: 'f_budget',
            name: 'gamme_budget',
            label: 'Votre budget estimé :',
            type: 'Dropdown',
            required: true,
            options: [
              { id: 'budget_eco', title: 'Économique (Moins de 100 000 FCFA / ~150€)' },
              { id: 'budget_moyen', title: 'Milieu de gamme (100 000 - 250 000 FCFA / ~150-380€)' },
              { id: 'budget_premium', title: 'Haut de gamme (> 250 000 FCFA / > 380€)' },
            ],
          },
        ],
      },
      {
        id: 'STEP_MODELS',
        title: 'Choix du Modèle',
        heading: 'Sélectionnez votre modèle en stock',
        subheading: 'Étape 2 sur 3 • Modèles disponibles immédiatement',
        actionType: 'navigate',
        targetScreenId: 'STEP_DETAILS',
        ctaLabel: 'Voir la fiche détaillée ➔',
        fields: [
          {
            id: 'f_model',
            name: 'modele_selectionne',
            label: 'Nos meilleures offres du moment :',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'tw14_pro', title: 'TechWave TW14 Pro — 325 000 FCFA (500€)', description: 'Écran OLED 120Hz • 256Go • Caméra 108MP Pro' },
              { id: 'apex_aura', title: 'Apex Aura Ultra — 260 000 FCFA (400€)', description: 'Batterie 5000mAh • Charge ultra-rapide 65W • 128Go' },
              { id: 'virtu_vx2', title: 'VirtuVision VX2 — 225 000 FCFA (350€)', description: 'Ultra fin & léger • Processeur Octa-Core • 8Go RAM' },
              { id: 'nova_n1', title: 'Nova N1 Edition — 195 000 FCFA (300€)', description: 'Design élégant • Connectivité 5G • Robuste' },
            ],
          },
        ],
      },
      {
        id: 'STEP_DETAILS',
        title: 'Fiche Produit & Achat',
        terminal: true,
        heading: 'TechWave TW14 Pro (256 Go)',
        subheading: 'Prix WhatsApp : 325 000 FCFA (500€)',
        bodyText: '🌟 Offre Spéciale : Écran OLED 120Hz, 256 Go de stockage, triple capteur photo 108 MP.\n• Garantie constructeur 2 ans incluse.\n• Livraison express 24h offerte.\n• Règlement sécurisé par lien de paiement dès validation.',
        imageBannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        actionType: 'complete',
        ctaLabel: '💳 Commander & Recevoir le lien de paiement',
        fields: [
          {
            id: 'f_nom',
            name: 'nom_client',
            label: 'Votre prénom et nom complet',
            type: 'TextInput',
            required: true,
            placeholder: 'Ex: Sarah Ouattara',
          },
          {
            id: 'f_adresse',
            name: 'adresse_livraison',
            label: 'Ville et quartier de livraison',
            type: 'TextArea',
            required: true,
            placeholder: 'Ex: Abidjan, Cocody Riviera 2, près de la pharmacie...',
          },
        ],
      },
    ],
  },
  {
    id: 'lead_quote',
    name: 'Demande de Devis & Qualification (B2B / Services)',
    category: 'LEAD_GENERATION',
    badge: 'Génération de Devis',
    description: 'Qualifiez vos prospects avec précision : besoins du projet, budget, délais et coordonnées complètes.',
    iconName: 'FileText',
    headerImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
    headerText: '📋 Devis Personnalisé Gratuit',
    flowCta: 'Demander un devis',
    flowBodyText: 'Bonjour ! Afin d’étudier au mieux votre projet et vous envoyer une offre sur-mesure sous 24h, veuillez répondre à ces quelques questions :',
    flowFooterText: 'Réponse sous 24h ouvrées garantie',
    screens: [
      {
        id: 'STEP_PROJECT',
        title: 'Votre Projet',
        heading: 'Parlez-nous de votre projet',
        subheading: 'Sélectionnez le type de prestation recherchée :',
        imageBannerUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
        fields: [
          {
            id: 'f_service',
            name: 'service_requis',
            label: 'Prestation souhaitée',
            type: 'Dropdown',
            required: true,
            options: [
              { id: 'creation_web', title: 'Création de site Web / E-commerce' },
              { id: 'marketing_digital', title: 'Marketing Digital & Publicités (Meta / Google)' },
              { id: 'automation_whatsapp', title: 'Automatisation WhatsApp & CRM' },
              { id: 'consulting', title: 'Audit & Conseil Stratégique' },
            ],
          },
          {
            id: 'f_objectifs',
            name: 'objectifs_projet',
            label: 'Quels sont vos objectifs principaux ?',
            type: 'CheckboxGroup',
            required: true,
            options: [
              { id: 'obj_ventes', title: 'Augmenter les ventes en ligne' },
              { id: 'obj_leads', title: 'Générer des rendez-vous qualifiés' },
              { id: 'obj_support', title: 'Automatiser le service client WhatsApp' },
              { id: 'obj_notoriete', title: 'Développer la notoriété de marque' },
            ],
          },
          {
            id: 'f_delai',
            name: 'delai_souhaite',
            label: 'Délai de réalisation souhaité',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'urgent', title: 'Urgent (Moins de 2 semaines)' },
              { id: 'un_mois', title: 'Dans le mois à venir' },
              { id: 'flexible', title: 'Flexible / Projet à moyen terme' },
            ],
          },
        ],
        ctaLabel: 'Étape suivante : Coordonnées',
      },
      {
        id: 'STEP_CONTACT',
        title: 'Vos Coordonnées',
        terminal: true,
        heading: 'Comment vous contacter ?',
        subheading: 'Nous vous enverrons votre proposition chiffrée par email et WhatsApp :',
        fields: [
          {
            id: 'f_nom',
            name: 'nom_contact',
            label: 'Nom et Prénom',
            type: 'TextInput',
            required: true,
            placeholder: 'Ex: Marc Dupont',
          },
          {
            id: 'f_entreprise',
            name: 'nom_entreprise',
            label: 'Nom de votre entreprise / activité',
            type: 'TextInput',
            required: false,
            placeholder: 'Ex: Agence Horizon',
          },
          {
            id: 'f_email',
            name: 'email_contact',
            label: 'Adresse email professionnelle',
            type: 'TextInput',
            required: true,
            placeholder: 'contact@votre-entreprise.com',
          },
          {
            id: 'f_precisions',
            name: 'precisions_projet',
            label: 'Précisions supplémentaires ou questions',
            type: 'TextArea',
            required: false,
            placeholder: 'Décrivez brièvement les spécificités de votre demande...',
          },
        ],
        ctaLabel: 'Recevoir mon devis gratuit',
      },
    ],
  },
  {
    id: 'loan_finance',
    name: 'Demande de Prêt & Financement (Style Unity Bank)',
    category: 'LEAD_GENERATION',
    badge: 'Banque & Microfinance',
    description: 'Formulaire de demande de crédit avec montant, durée, mode de versement et justificatifs.',
    iconName: 'CreditCard',
    headerImageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60',
    headerText: '🏦 Simulation de Prêt Express',
    flowCta: 'Simuler mon prêt',
    flowBodyText: 'Besoin d’un financement rapide pour votre activité ? Complétez votre demande en 2 minutes pour recevoir une réponse de pré-accord immédiate :',
    flowFooterText: 'Agrément Microfinance • Confidentialité garantie',
    screens: [
      {
        id: 'STEP_AMOUNT',
        title: 'Paramètres du Prêt',
        heading: 'Votre simulation de crédit',
        subheading: 'Définissez le montant et la durée de remboursement :',
        imageBannerUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60',
        fields: [
          {
            id: 'f_montant',
            name: 'montant_souhaite',
            label: 'Montant souhaité',
            type: 'Dropdown',
            required: true,
            options: [
              { id: 'm_100k', title: '100 000 FCFA' },
              { id: 'm_250k', title: '250 000 FCFA' },
              { id: 'm_500k', title: '500 000 FCFA' },
              { id: 'm_1m', title: '1 000 000 FCFA' },
              { id: 'm_2m', title: '2 000 000 FCFA ou plus' },
            ],
          },
          {
            id: 'f_duree',
            name: 'duree_remboursement',
            label: 'Durée de remboursement souhaitée',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'd_3m', title: '3 mois' },
              { id: 'd_6m', title: '6 mois' },
              { id: 'd_12m', title: '12 mois' },
              { id: 'd_24m', title: '24 mois' },
            ],
          },
          {
            id: 'f_usage',
            name: 'motif_pret',
            label: 'Motif du financement',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'commerce', title: 'Stock & Commerce' },
              { id: 'equipement', title: 'Achat de matériel / véhicule' },
              { id: 'personnel', title: 'Dépense personnelle / Santé' },
            ],
          },
        ],
        ctaLabel: 'Continuer vers le virement',
      },
      {
        id: 'STEP_RECIPIENT',
        title: 'Versement des Fonds',
        terminal: true,
        heading: 'Mode de réception des fonds',
        subheading: 'Où souhaitez-vous recevoir votre financement après validation ?',
        fields: [
          {
            id: 'f_mode',
            name: 'mode_versement',
            label: 'Canal de réception',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'orange_money', title: 'Orange Money' },
              { id: 'wave', title: 'Wave Mobile Money' },
              { id: 'mtn_momo', title: 'MTN Mobile Money' },
              { id: 'virement_banque', title: 'Virement bancaire (IBAN)' },
            ],
          },
          {
            id: 'f_compte',
            name: 'numero_compte_reception',
            label: 'Numéro de compte ou Mobile Money',
            type: 'TextInput',
            required: true,
            placeholder: 'Ex: 07XXXXXXXX ou CI01...',
          },
          {
            id: 'f_nom_titulaire',
            name: 'nom_titulaire',
            label: 'Nom et Prénom du titulaire',
            type: 'TextInput',
            required: true,
            placeholder: 'Nom exact figurant sur le compte',
          },
        ],
        ctaLabel: 'Soumettre ma demande',
      },
    ],
  },
  {
    id: 'booking_appointment',
    name: 'Prise de Rendez-vous & Réservation',
    category: 'APPOINTMENT_BOOKING',
    badge: 'Réservation & Agenda',
    description: 'Idéal pour cliniques, salons de beauté, garages, restaurants ou consultants pour planifier des créneaux.',
    iconName: 'Calendar',
    headerImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=60',
    headerText: '📅 Réservation en Ligne',
    flowCta: 'Réserver un créneau',
    flowBodyText: 'Planifiez facilement votre rendez-vous avec notre équipe. Choisissez votre prestation et la date de votre choix :',
    flowFooterText: 'Confirmation immédiate par WhatsApp',
    screens: [
      {
        id: 'STEP_BOOKING',
        title: 'Votre Rendez-vous',
        terminal: true,
        heading: 'Choisissez votre créneau',
        subheading: 'Remplissez les détails de votre réservation :',
        imageBannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=60',
        fields: [
          {
            id: 'f_nom',
            name: 'nom_client',
            label: 'Votre nom complet',
            type: 'TextInput',
            required: true,
            placeholder: 'Ex: Sophie Martin',
          },
          {
            id: 'f_prestation',
            name: 'prestation_choisie',
            label: 'Prestation souhaitée',
            type: 'Dropdown',
            required: true,
            options: [
              { id: 'consultation_30', title: 'Consultation standard (30 min)' },
              { id: 'consultation_60', title: 'Session approfondie (1 heure)' },
              { id: 'diagnostic', title: 'Diagnostic & Bilan complet' },
            ],
          },
          {
            id: 'f_date',
            name: 'date_souhaitee',
            label: 'Date souhaitée du rendez-vous',
            type: 'DatePicker',
            required: true,
          },
          {
            id: 'f_creneau',
            name: 'creneau_horaire',
            label: 'Créneau horaire préféré',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'matin', title: 'Matin (09h00 - 12h00)' },
              { id: 'midi', title: 'Début d’après-midi (13h00 - 16h00)' },
              { id: 'fin_journee', title: 'Fin de journée (16h00 - 19h00)' },
            ],
          },
        ],
        ctaLabel: 'Confirmer ma réservation',
      },
    ],
  },
  {
    id: 'vip_event_signup',
    name: 'Inscription Événement / VIP (Style Black Friday)',
    category: 'SIGN_UP',
    badge: 'Événement & VIP',
    description: 'Inscription à des ventes privées, webinaires, lancements ou listes d’attente VIP avec consentement RGPD.',
    iconName: 'Sparkles',
    headerImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60',
    headerText: '🎟️ Accès Coupe-File VIP',
    flowCta: 'Rejoindre la liste VIP',
    flowBodyText: 'Rejoignez notre liste VIP exclusive pour bénéficier de nos offres 24h avant tout le monde et d’un bon de réduction de bienvenue :',
    flowFooterText: 'Places limitées • Inscription gratuite',
    screens: [
      {
        id: 'STEP_SIGNUP',
        title: 'Inscription VIP',
        terminal: true,
        heading: 'Accès prioritaire aux ventes',
        subheading: 'Recevez votre pass d’accès directement sur WhatsApp :',
        imageBannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60',
        fields: [
          {
            id: 'f_nom',
            name: 'nom_vip',
            label: 'Votre prénom et nom',
            type: 'TextInput',
            required: true,
            placeholder: 'Ex: Sarah Kone',
          },
          {
            id: 'f_email',
            name: 'email_vip',
            label: 'Adresse email',
            type: 'TextInput',
            required: true,
            placeholder: 'sarah@example.com',
          },
          {
            id: 'f_centres_interet',
            name: 'categories_preferees',
            label: 'Quels produits vous intéressent en priorité ?',
            type: 'CheckboxGroup',
            required: true,
            options: [
              { id: 'mode', title: 'Mode & Prêt-à-porter' },
              { id: 'beaute', title: 'Beauté & Cosmétiques' },
              { id: 'tech', title: 'High-Tech & Gadgets' },
              { id: 'maison', title: 'Maison & Décoration' },
            ],
          },
          {
            id: 'f_consent',
            name: 'accord_conditions',
            label: 'Conditions & Consentement',
            type: 'CheckboxGroup',
            required: true,
            options: [
              { id: 'optin_promo', title: 'J’accepte de recevoir les alertes VIP et offres exclusives' },
            ],
          },
        ],
        ctaLabel: 'Valider mon pass VIP',
      },
    ],
  },
  {
    id: 'customer_feedback',
    name: 'Enquête de Satisfaction & Avis Client',
    category: 'SURVEY',
    badge: 'Avis & Satisfaction',
    description: 'Collectez des retours d’expérience détaillés après une livraison ou une assistance pour améliorer votre service.',
    iconName: 'Star',
    headerImageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60',
    headerText: '⭐ Votre avis compte pour nous !',
    flowCta: 'Donner mon avis',
    flowBodyText: 'Merci pour votre confiance ! Aidez-nous à nous améliorer en répondant à cette courte enquête de 3 questions (1 minute) :',
    flowFooterText: 'Merci pour votre précieuse collaboration',
    screens: [
      {
        id: 'STEP_FEEDBACK',
        title: 'Satisfaction Client',
        terminal: true,
        heading: 'Votre expérience récente',
        subheading: 'Comment évaluez-vous notre service ?',
        imageBannerUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60',
        fields: [
          {
            id: 'f_note',
            name: 'note_globale',
            label: 'Note globale de satisfaction',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: '5_stars', title: '⭐⭐⭐⭐⭐ Excellent, au-delà de mes attentes' },
              { id: '4_stars', title: '⭐⭐⭐⭐ Très bien, satisfait' },
              { id: '3_stars', title: '⭐⭐⭐ Moyen, des points à améliorer' },
              { id: '1_2_stars', title: '⭐ Décevant, j’ai rencontré un problème' },
            ],
          },
          {
            id: 'f_points_forts',
            name: 'points_forts',
            label: 'Qu’avez-vous le plus apprécié ?',
            type: 'CheckboxGroup',
            required: false,
            options: [
              { id: 'rapidite', title: 'Rapidité de la livraison / réponse' },
              { id: 'qualite', title: 'Qualité du produit / service' },
              { id: 'amabilite', title: 'Amabilité et professionnalisme' },
              { id: 'prix', title: 'Rapport qualité / prix' },
            ],
          },
          {
            id: 'f_suggestions',
            name: 'commentaires_suggestions',
            label: 'Une suggestion ou un commentaire ?',
            type: 'TextArea',
            required: false,
            placeholder: 'Dites-nous ce que nous pouvons améliorer...',
          },
        ],
        ctaLabel: 'Envoyer mon évaluation',
      },
    ],
  },
]

/**
 * Compile a list of multi-page FlowTemplateScreens into strict Meta WhatsApp Flows v7.3 JSON.
 */
export function buildMetaFlowJsonFromScreens(screens: FlowTemplateScreen[]): Record<string, any> {
  if (!screens || screens.length === 0) {
    return {
      version: '7.3',
      screens: [
        {
          id: 'INIT',
          title: 'Formulaire',
          data: {},
          terminal: true,
          success: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              {
                type: 'Form',
                name: 'form',
                children: [
                  { type: 'TextHeading', text: 'Bienvenue' },
                  { type: 'Footer', label: 'Valider', 'on-click-action': { name: 'complete', payload: {} } },
                ],
              },
            ],
          },
        },
      ],
    }
  }

  // Pre-sanitize all screen IDs to be strictly alphanumeric + underscore
  const sanitizedScreens = screens.map((screen, idx) => {
    const rawId = (screen.id || `STEP_${idx + 1}`).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    return {
      ...screen,
      id: rawId || `STEP_${idx + 1}`,
    }
  })

  // Pre-compute data models and field schemas across screens so navigate payloads match target screen data models
  const screenDataModels: Record<string, Record<string, any>> = {}
  const inheritedPayloads: Record<string, Record<string, string>> = {}

  sanitizedScreens.forEach((s) => {
    screenDataModels[s.id] = {}
    inheritedPayloads[s.id] = {}
  })

  // First pass: resolve navigation targets and propagate data schemas
  sanitizedScreens.forEach((screen, screenIndex) => {
    const isLastScreen = screenIndex === sanitizedScreens.length - 1
    const nextScreen = sanitizedScreens[screenIndex + 1]

    let targetScreenId = screen.targetScreenId
      ? screen.targetScreenId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      : undefined

    if (targetScreenId && !sanitizedScreens.some((s) => s.id === targetScreenId)) {
      targetScreenId = nextScreen ? nextScreen.id : undefined
    }
    if (!targetScreenId && nextScreen) {
      targetScreenId = nextScreen.id
    }

    const isNavigation =
      !isLastScreen &&
      (screen.actionType === 'navigate' || (!screen.actionType && !isLastScreen)) &&
      Boolean(targetScreenId)

    // Current screen's own fields
    const currentFieldsMeta: Record<string, { type: string; example: any }> = {}
    const currentFieldsPayload: Record<string, string> = {}

    screen.fields.forEach((f) => {
      const cleanFieldName = f.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `field_${Date.now()}`
      currentFieldsPayload[cleanFieldName] = `\${form.${cleanFieldName}}`

      if (f.type === 'CheckboxGroup') {
        currentFieldsMeta[cleanFieldName] = {
          type: 'array',
          example: ['opt_1'],
        }
      } else {
        currentFieldsMeta[cleanFieldName] = {
          type: 'string',
          example: 'valeur',
        }
      }
    })

    if (isNavigation && targetScreenId && screenDataModels[targetScreenId]) {
      // 1. Target screen inherits schemas from current screen's data model
      Object.entries(screenDataModels[screen.id] || {}).forEach(([k, schema]) => {
        screenDataModels[targetScreenId][k] = schema
      })

      // 2. Target screen receives current screen's form fields in its data model
      Object.entries(currentFieldsMeta).forEach(([k, meta]) => {
        if (meta.type === 'array') {
          screenDataModels[targetScreenId][k] = {
            type: 'array',
            items: { type: 'string' },
            __example__: meta.example,
          }
        } else {
          screenDataModels[targetScreenId][k] = {
            type: 'string',
            __example__: meta.example,
          }
        }
      })

      // Target screen inherits references as ${data.fieldName} for subsequent screens
      const targetInherited: Record<string, string> = {}
      Object.keys(screenDataModels[targetScreenId]).forEach((k) => {
        targetInherited[k] = `\${data.${k}}`
      })
      inheritedPayloads[targetScreenId] = targetInherited
    }
  })

  // Second pass: construct complete screens with matching data and payloads
  const flowScreens = sanitizedScreens.map((screen, screenIndex) => {
    const isLastScreen = screenIndex === sanitizedScreens.length - 1
    const nextScreen = sanitizedScreens[screenIndex + 1]

    let targetScreenId = screen.targetScreenId
      ? screen.targetScreenId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      : undefined

    if (targetScreenId && !sanitizedScreens.some((s) => s.id === targetScreenId)) {
      targetScreenId = nextScreen ? nextScreen.id : undefined
    }
    if (!targetScreenId && nextScreen) {
      targetScreenId = nextScreen.id
    }

    const isNavigation =
      !isLastScreen &&
      (screen.actionType === 'navigate' || (!screen.actionType && !isLastScreen)) &&
      Boolean(targetScreenId)

    const isTerminal = !isNavigation

    const formChildren: any[] = []

    if (screen.imageBannerUrl && screen.imageBannerUrl.trim()) {
      formChildren.push({
        type: 'Image',
        src: screen.imageBannerUrl.trim(),
        'alt-text': screen.heading || screen.title || 'Visuel',
      })
    }

    if (screen.heading && screen.heading.trim()) {
      formChildren.push({
        type: 'TextHeading',
        text: screen.heading.trim(),
      })
    }

    if (screen.subheading && screen.subheading.trim()) {
      formChildren.push({
        type: 'TextSubheading',
        text: screen.subheading.trim(),
      })
    }

    if (screen.bodyText && screen.bodyText.trim()) {
      formChildren.push({
        type: 'TextBody',
        text: screen.bodyText.trim(),
      })
    }

    // Form inputs and current screen form payload
    const currentFormPayload: Record<string, string> = {}

    screen.fields.forEach((f) => {
      const cleanFieldName = f.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `field_${Date.now()}`
      currentFormPayload[cleanFieldName] = `\${form.${cleanFieldName}}`

      if (f.type === 'TextInput') {
        formChildren.push({
          type: 'TextInput',
          name: cleanFieldName,
          label: f.label.trim() || 'Champ texte',
          required: Boolean(f.required),
          'input-type': 'text',
          ...(f.placeholder ? { 'helper-text': f.placeholder.trim() } : {}),
        })
      } else if (f.type === 'TextArea') {
        formChildren.push({
          type: 'TextArea',
          name: cleanFieldName,
          label: f.label.trim() || 'Zone de texte',
          required: Boolean(f.required),
          ...(f.placeholder ? { 'helper-text': f.placeholder.trim() } : {}),
        })
      } else if (f.type === 'Dropdown') {
        const validOptions = (f.options || [])
          .filter((opt) => opt.title && opt.title.trim())
          .map((opt) => ({ id: opt.id, title: opt.title.trim() }))

        formChildren.push({
          type: 'Dropdown',
          name: cleanFieldName,
          label: f.label.trim() || 'Sélectionnez une option',
          required: Boolean(f.required),
          'data-source': validOptions.length > 0 ? validOptions : [{ id: 'opt_1', title: 'Option 1' }],
        })
      } else if (f.type === 'RadioButtons') {
        const validOptions = (f.options || [])
          .filter((opt) => opt.title && opt.title.trim())
          .map((opt) => ({
            id: opt.id,
            title: opt.title.trim(),
            ...(opt.description ? { description: opt.description.trim() } : {}),
          }))

        formChildren.push({
          type: 'RadioButtonsGroup',
          name: cleanFieldName,
          label: f.label.trim() || 'Faites votre choix',
          required: Boolean(f.required),
          'data-source': validOptions.length > 0 ? validOptions : [{ id: 'opt_1', title: 'Option 1' }],
        })
      } else if (f.type === 'CheckboxGroup') {
        const validOptions = (f.options || [])
          .filter((opt) => opt.title && opt.title.trim())
          .map((opt) => ({ id: opt.id, title: opt.title.trim() }))

        formChildren.push({
          type: 'CheckboxGroup',
          name: cleanFieldName,
          label: f.label.trim() || 'Cochez les options',
          required: Boolean(f.required),
          'data-source': validOptions.length > 0 ? validOptions : [{ id: 'opt_1', title: 'Option 1' }],
        })
      } else if (f.type === 'DatePicker') {
        formChildren.push({
          type: 'DatePicker',
          name: cleanFieldName,
          label: f.label.trim() || 'Choisir une date',
          required: Boolean(f.required),
        })
      }
    })

    // Combine inherited fields (${data.field}) with current screen form fields (${form.field})
    const fullPayload: Record<string, string> = {
      ...(inheritedPayloads[screen.id] || {}),
      ...currentFormPayload,
    }

    // Add navigation Footer or completion Footer
    if (isNavigation && targetScreenId) {
      formChildren.push({
        type: 'Footer',
        label: screen.ctaLabel?.trim() || 'Suivant ➔',
        'on-click-action': {
          name: 'navigate',
          next: {
            type: 'screen',
            name: targetScreenId,
          },
          payload: fullPayload,
        },
      })
    } else {
      formChildren.push({
        type: 'Footer',
        label: screen.ctaLabel?.trim() || 'Valider',
        'on-click-action': {
          name: 'complete',
          payload: fullPayload,
        },
      })
    }

    return {
      id: screen.id,
      title: screen.title.trim() || `Écran ${screenIndex + 1}`,
      data: screenDataModels[screen.id] || {},
      ...(isTerminal ? { terminal: true, success: true } : { terminal: false }),
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'Form',
            name: 'form',
            children: formChildren,
          },
        ],
      },
    }
  })

  return {
    version: '7.3',
    screens: flowScreens,
  }
}
