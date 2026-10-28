'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import {
  Zap,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  MessageSquare,
  Layers,
  Edit3,
  Lock,
  Sparkles,
  Phone,
  ArrowRight,
  Play,
  ShoppingCart,
  Tag,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { usePlanAccess } from '@/hooks/use-plan-access'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardPanel, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  TelegramIcon,
  GoogleSheetsIcon,
  GoogleCalendarIcon,
  NotionIcon,
  WhatsAppIcon,
  PaymentCardIcon,
  WebhookIcon,
  AiAgentIcon,
} from '@/components/automations/builder/icons/app-icons'

interface Automation {
  id: string
  name: string
  trigger_type: string
  trigger_value: string | null
  action_type: string
  is_active: boolean
  executions_count: number
  created_at: string
  phone_number_id?: string | null
  nodes?: any[]
  edges?: any[]
}

function getTriggerInfo(auto: Automation) {
  switch (auto.trigger_type) {
    case 'keyword':
      return {
        label: auto.trigger_value ? `Mot-clé « ${auto.trigger_value} »` : 'Mot-clé reçu',
        badge: 'Mot-clé',
      }
    case 'first_message':
      return {
        label: 'Premier message entrant',
        badge: 'Nouveau',
      }
    case 'flow_completed':
      return {
        label: 'Validation formulaire Flow',
        badge: 'Flow',
      }
    case 'order_created':
      return {
        label: 'Commande panier catalogue',
        badge: 'Panier',
      }
    case 'api_request':
      return {
        label: 'Appel API Webhook',
        badge: 'Webhook',
      }
    default:
      return {
        label: 'Déclencheur automatique',
        badge: 'Trigger',
      }
  }
}

function getActionInfo(auto: Automation) {
  switch (auto.action_type) {
    case 'send_flow':
      return {
        label: 'Formulaire Flow WhatsApp',
        icon: <Layers className="size-3.5 text-cyan-500" />,
      }
    case 'send_template':
      return {
        label: 'Template Meta vérifié',
        icon: <WhatsAppIcon size={15} />,
      }
    case 'send_text':
      return {
        label: 'Message WhatsApp interactif',
        icon: <WhatsAppIcon size={15} />,
      }
    case 'create_saspay_payment':
      return {
        label: 'Lien de paiement sécurisé',
        icon: <PaymentCardIcon size={15} />,
      }
    case 'telegram_message':
      return {
        label: 'Notification Telegram Bot',
        icon: <TelegramIcon size={15} />,
      }
    case 'google_sheets':
      return {
        label: 'Tableur Google Sheets',
        icon: <GoogleSheetsIcon size={15} />,
      }
    case 'google_calendar':
      return {
        label: 'Événement Google Calendar',
        icon: <GoogleCalendarIcon size={15} />,
      }
    case 'notion':
      return {
        label: 'Synchronisation Notion',
        icon: <NotionIcon size={15} />,
      }
    case 'ai_agent':
      return {
        label: 'Agent IA Whatooz',
        icon: <AiAgentIcon size={15} />,
      }
    case 'http_request':
      return {
        label: 'Requête API Webhook',
        icon: <WebhookIcon size={15} />,
      }
    case 'add_tag':
    case 'remove_tag':
      return {
        label: 'Étiquetage CRM',
        icon: <Tag className="size-3.5 text-violet-500" />,
      }
    case 'assign_agent':
      return {
        label: 'Assignation conseiller',
        icon: <UserCheck className="size-3.5 text-sky-500" />,
      }
    case 'send_product':
    case 'send_catalog':
    case 'send_product_list':
    case 'send_product_carousel':
      return {
        label: 'Catalogue WhatsApp',
        icon: <ShoppingCart className="size-3.5 text-emerald-500" />,
      }
    default:
      return {
        label: 'Action WhatsApp',
        icon: <MessageSquare className="size-3.5 text-blue-500" />,
      }
  }
}

export default function AutomationsPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  const { plan } = usePlanAccess()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [connectedPhones, setConnectedPhones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const activeCount = automations.filter((a) => a.is_active).length
  const isLimitReached = activeCount >= plan.limits.activeAutomations

  useEffect(() => {
    if (activeOrganization) {
      loadData()
    }
  }, [activeOrganization])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const autoRes = await fetch('/api/whatsapp/automations', { 
        headers: { 'x-organization-id': activeOrganization?.id || '' } 
      })

      const autoData = await autoRes.json()
      if (autoRes.ok) setAutomations(autoData.automations ?? [])

      if (activeOrganization) {
        const supabase = createClient()
        const { data: phones } = await supabase
          .from('whatsapp_config')
          .select('phone_number_id, phone_label, display_phone_number')
          .eq('organization_id', activeOrganization.id)
        if (phones) setConnectedPhones(phones)
      }
    } catch {
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': activeOrganization?.id || '' },
        body: JSON.stringify({ id, is_active: !currentActive }),
      })
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a))
        )
      }
    } catch {
      alert('Erreur lors de la mise à jour')
    }
  }

  async function handleDelete(id: string, autoName: string) {
    if (!confirm(`Supprimer le scénario "${autoName}" ?`)) return
    try {
      const res = await fetch('/api/whatsapp/automations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': activeOrganization?.id || '' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id))
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">Scénarios & Automatisations</h1>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              Actives : {activeCount} / {plan.limits.activeAutomations > 100 ? 'Illimitées' : plan.limits.activeAutomations} ({plan.name})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gérez le comportement de votre assistant WhatsApp via l&apos;éditeur visuel (Workflow Builder).
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/automations/builder/new')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un scénario</span>
        </button>
      </div>

      {isLimitReached && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Vous avez atteint la limite de <strong>{plan.limits.activeAutomations} automatisations actives</strong> sur votre forfait <strong>{plan.name}</strong>.
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/billing')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Débloquer plus d&apos;automatisations</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {automations.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aucun scénario</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            Créez votre premier workflow pour répondre automatiquement aux messages de vos clients.
          </p>
          <button
            onClick={() => router.push('/dashboard/automations/builder/new')}
            className="mt-6 border border-border text-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Créer maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((auto) => {
            const triggerInfo = getTriggerInfo(auto)
            const actionInfo = getActionInfo(auto)
            const assignedPhone = connectedPhones.find(
              (p) => p.phone_number_id === auto.phone_number_id
            )
            const totalSteps =
              Array.isArray(auto.nodes) && auto.nodes.length > 0
                ? auto.nodes.filter((n) => n.type !== 'triggerNode').length
                : 1

            return (
              <Card
                key={auto.id}
                className={cn(
                  'relative overflow-hidden group hover:border-[#fe5105]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between',
                  auto.is_active ? 'border-border' : 'opacity-85'
                )}
              >
                {/* Active indicator accent bar */}
                <div
                  className={cn(
                    'h-1 w-full absolute top-0 left-0 transition-colors',
                    auto.is_active
                      ? 'bg-gradient-to-r from-[#fe5105] to-amber-500'
                      : 'bg-transparent'
                  )}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          'p-2.5 rounded-xl border transition-colors shrink-0 mt-0.5',
                          auto.is_active
                            ? 'bg-[#fe5105]/10 text-[#fe5105] border-[#fe5105]/20 shadow-2xs'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        <Zap className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base font-bold truncate group-hover:text-[#fe5105] transition-colors">
                          {auto.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {assignedPhone ? (
                            <Badge
                              variant="outline"
                              size="sm"
                              className="font-mono text-[10px] py-0 px-1.5 gap-1 text-foreground/80"
                            >
                              <Phone className="size-2.5 text-[#fe5105]" />
                              {assignedPhone.phone_label || assignedPhone.display_phone_number}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm" className="text-[10px] py-0 px-1.5 opacity-70">
                              Toutes les lignes
                            </Badge>
                          )}
                          {auto.is_active ? (
                            <Badge variant="success" size="sm" dot>
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">
                              En pause
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Switch
                      checked={auto.is_active}
                      onCheckedChange={() => handleToggle(auto.id, auto.is_active)}
                      ariaLabel={`Activer ou désactiver le scénario ${auto.name}`}
                    />
                  </div>
                </CardHeader>

                <CardPanel className="pb-4">
                  {/* Modern visual pipeline replacing outdated SI / ALORS */}
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex flex-col gap-2">
                    {/* Trigger Step */}
                    <div className="flex items-center gap-2 text-xs text-foreground bg-card/90 px-2.5 py-1.5 rounded-lg border border-border/50 shadow-2xs">
                      <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <Zap className="size-3" />
                      </span>
                      <span className="truncate font-medium">{triggerInfo.label}</span>
                    </div>

                    {/* Step Connector */}
                    <div className="flex items-center gap-2 px-3 text-muted-foreground/60 -my-0.5">
                      <div className="w-px h-2.5 bg-border ml-1" />
                      <ArrowRight className="size-2.5 rotate-90 text-muted-foreground" />
                    </div>

                    {/* Action Step */}
                    <div className="flex items-center gap-2 text-xs text-foreground bg-card/90 px-2.5 py-1.5 rounded-lg border border-border/50 shadow-2xs">
                      <span className="p-1 rounded-md bg-muted text-primary shrink-0">
                        {actionInfo.icon}
                      </span>
                      <span className="truncate font-medium">{actionInfo.label}</span>
                      {totalSteps > 1 && (
                        <Badge variant="info" size="sm" className="ml-auto text-[9px] py-0 px-1 font-mono">
                          +{totalSteps - 1} action{totalSteps > 2 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {/* Metric footer */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Play className="size-3 text-[#fe5105]" />
                        {auto.executions_count || 0} exécution(s)
                      </span>
                      <span>
                        {new Date(auto.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </CardPanel>

                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => router.push(`/dashboard/automations/builder/${auto.id}`)}
                      className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-border/60 transition-all hover:border-[#fe5105]/30 group/btn"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="size-3.5 text-muted-foreground group-hover/btn:text-[#fe5105] transition-colors" />
                        <span>Configurer le scénario</span>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground group-hover/btn:text-[#fe5105] group-hover/btn:translate-x-0.5 transition-all" />
                    </button>
                    <button
                      onClick={() => handleDelete(auto.id, auto.name)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-transparent hover:border-destructive/20"
                      title="Supprimer ce scénario"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
