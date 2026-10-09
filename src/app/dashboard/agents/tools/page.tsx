'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Lock,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

interface ToolDefinition {
  id: string
  name: string
  category: 'whatsapp' | 'commerce' | 'finance' | 'automations'
  description: string
  sensitive?: boolean
  lockedForAgents?: boolean
  salesAgent: boolean
  supportAgent: boolean
  financeAgent: boolean
}

const INITIAL_TOOLS: ToolDefinition[] = [
  // WhatsApp
  {
    id: 'whatsapp_send_message',
    name: 'whatsapp.send_message',
    category: 'whatsapp',
    description: 'Envoi direct de messages et réponses automatiques sur WhatsApp aux contacts de l\'entreprise.',
    salesAgent: true,
    supportAgent: true,
    financeAgent: false,
  },
  {
    id: 'whatsapp_send_catalog',
    name: 'whatsapp.send_catalog',
    category: 'whatsapp',
    description: 'Envoi interactif des fiches articles et boutons de sélection de modèles au client.',
    salesAgent: true,
    supportAgent: true,
    financeAgent: false,
  },
  {
    id: 'whatsapp_escalate',
    name: 'whatsapp.escalate_to_human',
    category: 'whatsapp',
    description: 'Transfère la conversation aux opérateurs humains dans l\'Inbox en cas d\'incompréhension ou de litige.',
    salesAgent: true,
    supportAgent: true,
    financeAgent: false,
  },

  // Commerce
  {
    id: 'commerce_search_catalog',
    name: 'commerce.search_products',
    category: 'commerce',
    description: 'Interrogation de la base de données produits, variantes de stock et prix unitaires.',
    salesAgent: true,
    supportAgent: true,
    financeAgent: true,
  },
  {
    id: 'commerce_calculate_price',
    name: 'commerce.calculate_discount',
    category: 'commerce',
    description: 'Calcul des remises négociées dans la limite fixée par la direction commerciale (max 10%).',
    salesAgent: true,
    supportAgent: false,
    financeAgent: false,
  },
  {
    id: 'commerce_create_order',
    name: 'commerce.create_order',
    category: 'commerce',
    description: 'Création d\'un bon de commande client dans le système avec coordonnées de livraison.',
    salesAgent: true,
    supportAgent: false,
    financeAgent: false,
  },

  // Finance & Wallet (Sensitive)
  {
    id: 'wallet_read_balance',
    name: 'wallet.read_balance',
    category: 'finance',
    description: 'Consultation du solde et récapitulatif pour les bilans de trésorerie interne.',
    salesAgent: false,
    supportAgent: false,
    financeAgent: true,
  },
  {
    id: 'wallet_withdraw_funds',
    name: 'wallet.withdraw_funds',
    category: 'finance',
    description: 'Retrait de fonds vers Mobile Money / Wave. Verrouillé : nécessite une authentification 2FA humaine.',
    sensitive: true,
    lockedForAgents: true,
    salesAgent: false,
    supportAgent: false,
    financeAgent: false,
  },

  // Automations
  {
    id: 'automation_trigger_flow',
    name: 'automation.trigger_flow',
    category: 'automations',
    description: 'Déclenchement d\'un flux WhatsApp interactif (formulaire de commande, enquête de satisfaction).',
    salesAgent: true,
    supportAgent: true,
    financeAgent: false,
  },
  {
    id: 'automation_query_abandoned',
    name: 'automation.query_abandoned_sessions',
    category: 'automations',
    description: 'Analyse des paniers sans achat et ciblage pour relance automatique ciblée.',
    salesAgent: true,
    supportAgent: false,
    financeAgent: false,
  },
]

import { Switch } from '@/components/ui/switch'

function MinimalToggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <Switch
      size="sm"
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      ariaLabel={ariaLabel}
    />
  )
}

export default function AgentToolsPage() {
  const { isAdmin } = usePermissions()
  const [tools, setTools] = useState<ToolDefinition[]>(INITIAL_TOOLS)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'whatsapp' | 'commerce' | 'finance' | 'automations'>('all')
  const [savedNotification, setSavedNotification] = useState(false)

  const handleToggle = (
    toolId: string,
    agentKey: 'salesAgent' | 'supportAgent' | 'financeAgent',
    nextVal: boolean
  ) => {
    if (!isAdmin) return
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, [agentKey]: nextVal } : t))
    )
    setSavedNotification(true)
    setTimeout(() => setSavedNotification(false), 2000)
  }

  const handleResetDefaults = () => {
    if (!isAdmin) return
    setTools(INITIAL_TOOLS)
    setSavedNotification(true)
    setTimeout(() => setSavedNotification(false), 2000)
  }

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [tools, categoryFilter, search])

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-2 sm:px-4">
      {/* ─── Breadcrumb & Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <Link
            href="/dashboard/agents"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Agents</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-heading">
            Outils & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Matrice des outils exécutables par chaque sous-agent de l'entreprise.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {savedNotification && (
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted px-2.5 py-1 rounded-md transition-opacity">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Modifications appliquées</span>
            </span>
          )}

          <button
            onClick={handleResetDefaults}
            disabled={!isAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Rétablir les permissions par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* ─── Understated Security Policy ─── */}
      <div className="rounded-xl border border-border/70 bg-card/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-medium text-foreground">Politique de sécurité financière</span>
            <p className="text-muted-foreground leading-relaxed">
              L'outil <code className="font-mono text-[11px] text-foreground">wallet.withdraw_funds</code> est réservé aux administrateurs humains. Les agents IA ne peuvent pas initier de retraits financiers.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto shrink-0 font-mono text-[11px] text-muted-foreground px-2 py-0.5 rounded border border-border bg-background">
          Gouvernance stricte
        </span>
      </div>

      {/* ─── Search & Category Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'whatsapp', label: 'WhatsApp' },
              { id: 'commerce', label: 'Commerce' },
              { id: 'finance', label: 'Finance' },
              { id: 'automations', label: 'Automatisations' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap',
                categoryFilter === cat.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer un outil..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </div>
      </div>

      {/* ─── Tools Table Matrix ─── */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        {/* Table Column Headers */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/70 bg-muted/30 text-xs font-medium text-muted-foreground">
          <div className="col-span-6">Outil & Description</div>
          <div className="col-span-2 text-center">Ventes</div>
          <div className="col-span-2 text-center">Support</div>
          <div className="col-span-2 text-center">Finance</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/60">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Aucun outil ne correspond à votre recherche.
            </div>
          ) : (
            filteredTools.map((t) => (
              <div
                key={t.id}
                className="p-4 sm:px-5 sm:py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center hover:bg-muted/15 transition-colors"
              >
                {/* Tool Name and Description */}
                <div className="sm:col-span-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold text-foreground">
                      {t.name}
                    </span>
                    {t.sensitive && (
                      <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded text-muted-foreground border border-border">
                        Sensible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Mobile labels & Toggles */}
                {t.lockedForAgents ? (
                  <div className="sm:col-span-6 flex sm:justify-end items-center gap-1.5 text-xs text-muted-foreground py-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Non déléguable aux agents</span>
                  </div>
                ) : (
                  <>
                    {/* Sales Column */}
                    <div className="sm:col-span-2 flex sm:justify-center items-center justify-between pt-1 sm:pt-0">
                      <span className="text-xs text-muted-foreground sm:hidden">Agent Ventes :</span>
                      <MinimalToggle
                        checked={t.salesAgent}
                        onChange={(val) => handleToggle(t.id, 'salesAgent', val)}
                        disabled={!isAdmin}
                        ariaLabel={`Autoriser ${t.name} pour l'agent ventes`}
                      />
                    </div>

                    {/* Support Column */}
                    <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                      <span className="text-xs text-muted-foreground sm:hidden">Agent Support :</span>
                      <MinimalToggle
                        checked={t.supportAgent}
                        onChange={(val) => handleToggle(t.id, 'supportAgent', val)}
                        disabled={!isAdmin}
                        ariaLabel={`Autoriser ${t.name} pour l'agent support`}
                      />
                    </div>

                    {/* Finance Column */}
                    <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                      <span className="text-xs text-muted-foreground sm:hidden">Agent Finance :</span>
                      <MinimalToggle
                        checked={t.financeAgent}
                        onChange={(val) => handleToggle(t.id, 'financeAgent', val)}
                        disabled={!isAdmin}
                        ariaLabel={`Autoriser ${t.name} pour l'agent finance`}
                      />
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
