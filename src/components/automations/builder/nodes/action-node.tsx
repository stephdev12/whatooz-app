import React from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  MessageSquare,
  LayoutTemplate,
  Layers,
  MoreHorizontal,
  ShoppingCart,
  CreditCard,
  Tag,
  UserCheck,
  Bot,
  Globe,
} from 'lucide-react'
import { ActionNodeData } from '../types'

interface ActionNodeProps {
  data: ActionNodeData
  selected: boolean
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  const getIcon = () => {
    switch (data.actionType) {
      case 'send_message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'send_template':
        return <LayoutTemplate className="w-4 h-4 text-indigo-500" />
      case 'send_flow':
        return <Layers className="w-4 h-4 text-cyan-500" />
      case 'send_product':
      case 'send_product_list':
      case 'send_product_carousel':
      case 'send_catalog':
        return <ShoppingCart className="w-4 h-4 text-orange-500" />
      case 'create_saspay_payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />
      case 'add_tag':
      case 'remove_tag':
        return <Tag className="w-4 h-4 text-violet-500" />
      case 'assign_agent':
        return <UserCheck className="w-4 h-4 text-sky-500" />
      case 'ai_agent':
        return <Bot className="w-4 h-4 text-amber-500" />
      case 'http_request':
        return <Globe className="w-4 h-4 text-emerald-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-blue-500" />
    }
  }

  const getSubtitle = () => {
    switch (data.actionType) {
      case 'send_message':
        return 'Message WhatsApp'
      case 'send_template':
        return 'Template WhatsApp'
      case 'send_flow':
        return 'Flow WhatsApp'
      case 'send_product':
        return 'Produit unique'
      case 'send_product_list':
        return 'Liste de produits'
      case 'send_product_carousel':
        return 'Carousel de produits'
      case 'send_catalog':
        return 'Catalogue WhatsApp'
      case 'create_saspay_payment':
        return 'Paiement SasPay'
      case 'add_tag':
        return 'Ajout de tag CRM'
      case 'remove_tag':
        return 'Suppression de tag CRM'
      case 'assign_agent':
        return 'Assignation conseiller'
      case 'ai_agent':
        return 'Agent IA Whatooz'
      case 'http_request':
        return 'Requête HTTP'
      default:
        return 'Action'
    }
  }

  const getDetails = () => {
    const payload = (data.actionPayload as any) || {}
    switch (data.actionType) {
      case 'send_message':
        return payload.text || 'Message texte...'
      case 'send_template':
        return data.templateId || payload.template_name || 'Modèle non configuré'
      case 'send_flow':
        return data.flowId || 'Flow non configuré'
      case 'send_product':
        return payload.productRetailerId ? `Produit: ${payload.productRetailerId}` : 'Produit...'
      case 'send_product_list':
        return payload.productRetailerIds ? `${payload.productRetailerIds.split(',').length} produits` : 'Sélection de produits...'
      case 'send_product_carousel':
        return payload.productRetailerIds ? `Carousel: ${payload.productRetailerIds.split(',').length} cartes` : 'Carousel...'
      case 'send_catalog':
        return 'Catalogue complet'
      case 'create_saspay_payment':
        return payload.amount || payload.paymentAmount ? `${payload.amount || payload.paymentAmount} (Fixe)` : 'Montant dynamique (Panier)'
      case 'add_tag':
      case 'remove_tag':
        return payload.tagName ? `Tag: #${payload.tagName}` : 'Tag non défini'
      case 'assign_agent':
        return payload.agentId ? `Conseiller: ${payload.agentId}` : 'Assigner à un conseiller'
      case 'ai_agent':
        return payload.prompt ? `Consigne: ${payload.prompt.slice(0, 30)}...` : 'Instructions IA'
      case 'http_request':
        return payload.url ? `${payload.method || 'POST'} ${payload.url}` : 'URL Webhook...'
      default:
        return '-'
    }
  }

  return (
    <div
      className={`relative min-w-[250px] max-w-[320px] bg-card rounded-xl shadow-sm border ${
        selected
          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
          : 'border-border hover:border-border/80'
      } transition-all duration-150 select-none`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground/40 hover:!bg-primary !border-2 !border-background rounded-full -ml-1.5 transition-colors"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/60 bg-muted/20 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-background border border-border shrink-0 shadow-2xs">
            {getIcon()}
          </div>
          <h3 className="text-xs font-semibold text-foreground truncate">
            {data.label || 'Action'}
          </h3>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 ml-2">
          Action
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3 space-y-1.5 text-[11px]">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-[10px] uppercase font-medium tracking-wider">Type</span>
          <span className="font-medium text-foreground truncate max-w-[170px] text-right">
            {getSubtitle()}
          </span>
        </div>

        <div className="pt-1 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
            {getDetails()}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground/40 hover:!bg-primary !border-2 !border-background rounded-full -mr-1.5 transition-colors"
      />
    </div>
  )
}
