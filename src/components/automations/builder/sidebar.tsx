'use client'

import React, { useState } from 'react'
import {
  Zap,
  MessageSquare,
  Split,
  Clock,
  LayoutTemplate,
  Layers,
  ShoppingCart,
  CreditCard,
  Globe,
  Tag,
  UserCheck,
  Bot,
  Search,
  Sparkles,
  GitBranch,
  Send,
  Table,
  Calendar,
  FileText,
} from 'lucide-react'

interface BlockItem {
  nodeType: string
  subType?: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  category: 'triggers' | 'whatsapp' | 'logic' | 'commerce' | 'crm' | 'integrations'
}

const BLOCKS: BlockItem[] = [
  // TRIGGERS
  {
    nodeType: 'triggerNode',
    subType: 'keyword',
    label: 'Mot-clé ou Message',
    description: 'Déclenche lors de la réception d\'un texte ou mot-clé',
    icon: Zap,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    category: 'triggers',
  },
  {
    nodeType: 'triggerNode',
    subType: 'first_message',
    label: 'Premier Message',
    description: 'Nouveau contact ouvrant une discussion',
    icon: Zap,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    category: 'triggers',
  },
  {
    nodeType: 'triggerNode',
    subType: 'flow_completed',
    label: 'Flow WhatsApp Soumis',
    description: 'Formulaire WhatsApp Flow validé par le contact',
    icon: Layers,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    category: 'triggers',
  },
  {
    nodeType: 'triggerNode',
    subType: 'order_created',
    label: 'Commande Créée',
    description: 'Panier validé depuis le catalogue WhatsApp',
    icon: ShoppingCart,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    category: 'triggers',
  },
  {
    nodeType: 'triggerNode',
    subType: 'api_request',
    label: 'Webhook Entrant (API)',
    description: 'Déclenché par appel HTTP POST externe',
    icon: Globe,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    category: 'triggers',
  },

  // WHATSAPP
  {
    nodeType: 'actionNode',
    subType: 'send_message',
    label: 'Envoyer un Message',
    description: 'Message texte avec variables dynamiques',
    icon: MessageSquare,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    category: 'whatsapp',
  },
  {
    nodeType: 'actionNode',
    subType: 'send_template',
    label: 'Envoyer un Modèle (Template)',
    description: 'Modèle Meta vérifié (marketing ou utilitaire)',
    icon: LayoutTemplate,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    category: 'whatsapp',
  },
  {
    nodeType: 'actionNode',
    subType: 'send_flow',
    label: 'Envoyer un Flow',
    description: 'Ouvrir un formulaire natif WhatsApp',
    icon: Layers,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    category: 'whatsapp',
  },

  // LOGIC
  {
    nodeType: 'conditionNode',
    label: 'Condition (Si / Sinon)',
    description: 'Embranchement Vrai / Faux selon les données',
    icon: GitBranch,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    category: 'logic',
  },
  {
    nodeType: 'delayNode',
    label: 'Délai d\'Attente',
    description: 'Pause chronométrée avant la suite du workflow',
    icon: Clock,
    iconColor: 'text-slate-500',
    iconBg: 'bg-slate-500/10 dark:bg-slate-500/20',
    category: 'logic',
  },

  // COMMERCE
  {
    nodeType: 'actionNode',
    subType: 'create_saspay_payment',
    label: 'Lien de Paiement SasPay',
    description: 'Génère un paiement Wave, OM, MoMo ou Carte',
    icon: CreditCard,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    category: 'commerce',
  },
  {
    nodeType: 'actionNode',
    subType: 'send_catalog',
    label: 'Envoyer le Catalogue',
    description: 'Bouton vers le catalogue complet WhatsApp',
    icon: ShoppingCart,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    category: 'commerce',
  },
  {
    nodeType: 'actionNode',
    subType: 'send_product',
    label: 'Envoyer un Produit',
    description: 'Fiche produit individuelle interactive',
    icon: ShoppingCart,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    category: 'commerce',
  },
  {
    nodeType: 'actionNode',
    subType: 'send_product_list',
    label: 'Liste de Produits',
    description: 'Menu interactif avec sélection de produits',
    icon: ShoppingCart,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    category: 'commerce',
  },
  {
    nodeType: 'actionNode',
    subType: 'send_product_carousel',
    label: 'Carousel de Produits',
    description: 'Cartes horizontales défilables (2 à 10 items)',
    icon: ShoppingCart,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    category: 'commerce',
  },

  // CRM
  {
    nodeType: 'actionNode',
    subType: 'add_tag',
    label: 'Ajouter un Tag',
    description: 'Étiqueter le contact dans Whatooz CRM',
    icon: Tag,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    category: 'crm',
  },
  {
    nodeType: 'actionNode',
    subType: 'remove_tag',
    label: 'Retirer un Tag',
    description: 'Supprimer une étiquette du contact',
    icon: Tag,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    category: 'crm',
  },
  {
    nodeType: 'actionNode',
    subType: 'assign_agent',
    label: 'Assigner à un Conseiller',
    description: 'Transférer la conversation à un membre de l\'équipe',
    icon: UserCheck,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    category: 'crm',
  },

  // INTEGRATIONS & AI
  {
    nodeType: 'actionNode',
    subType: 'ai_agent',
    label: 'Agent IA Whatooz',
    description: 'Génère une réponse sur-mesure selon les consignes',
    icon: Bot,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    category: 'integrations',
  },
  {
    nodeType: 'actionNode',
    subType: 'http_request',
    label: 'Requête HTTP (Webhook & API)',
    description: 'Appel API REST externe avec Auth, Headers & Body',
    icon: Globe,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    category: 'integrations',
  },
  {
    nodeType: 'actionNode',
    subType: 'telegram_message',
    label: 'Telegram Bot',
    description: 'Envoyer une alerte ou un message dans un canal Telegram',
    icon: Send,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    category: 'integrations',
  },
  {
    nodeType: 'actionNode',
    subType: 'google_sheets',
    label: 'Google Sheets',
    description: 'Ajouter ou consulter des lignes dans un tableur Google',
    icon: Table,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-600/10 dark:bg-emerald-600/20',
    category: 'integrations',
  },
  {
    nodeType: 'actionNode',
    subType: 'google_calendar',
    label: 'Google Calendar',
    description: 'Créer un événement ou programmer un rendez-vous',
    icon: Calendar,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-600/10 dark:bg-blue-600/20',
    category: 'integrations',
  },
  {
    nodeType: 'actionNode',
    subType: 'notion',
    label: 'Notion',
    description: 'Créer une page ou synchroniser un lead dans Notion',
    icon: FileText,
    iconColor: 'text-slate-800 dark:text-slate-200',
    iconBg: 'bg-slate-500/10 dark:bg-slate-500/20',
    category: 'integrations',
  },
]

const CATEGORIES = [
  { key: 'triggers', label: 'Déclencheurs', badge: 'Start' },
  { key: 'whatsapp', label: 'WhatsApp', badge: 'Actions' },
  { key: 'logic', label: 'Logique & Flux', badge: 'Control' },
  { key: 'commerce', label: 'E-commerce & SasPay', badge: 'Pay' },
  { key: 'crm', label: 'CRM & Contacts', badge: 'CRM' },
  { key: 'integrations', label: 'Intégrations & Outils', badge: 'Apps' },
]

export function Sidebar() {
  const [search, setSearch] = useState('')

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    label: string,
    subType?: string
  ) => {
    const data = JSON.stringify({ nodeType, label, subType })
    event.dataTransfer.setData('application/reactflow', data)
    event.dataTransfer.effectAllowed = 'move'
  }

  const filteredBlocks = BLOCKS.filter((block) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      block.label.toLowerCase().includes(q) ||
      block.description.toLowerCase().includes(q)
    )
  })

  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col h-full z-10 shadow-sm relative select-none">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-semibold text-sm text-foreground">Noeuds du Workflow</h2>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            n8n Style
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Glissez-déposez un bloc pour construire votre flux
        </p>

        {/* Search */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un noeud..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {CATEGORIES.map((cat) => {
          const items = filteredBlocks.filter((b) => b.category === cat.key)
          if (items.length === 0) return null

          return (
            <div key={cat.key} className="space-y-1.5">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {cat.label}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded text-muted-foreground bg-muted">
                  {items.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {items.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={`${item.nodeType}-${item.subType || idx}`}
                      className="group flex items-start gap-2.5 p-2.5 bg-background border border-border/80 rounded-xl cursor-grab hover:border-primary/50 hover:shadow-sm hover:translate-x-0.5 transition-all"
                      onDragStart={(e) =>
                        onDragStart(e, item.nodeType, item.label, item.subType)
                      }
                      draggable
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-110`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {item.label}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Aucun bloc correspondant à « {search} »
          </div>
        )}
      </div>
    </aside>
  )
}
