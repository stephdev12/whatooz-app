import React from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  Tag,
  UserCheck,
  ShoppingCart,
  Layers,
  LayoutTemplate,
  MessageSquare,
} from 'lucide-react'
import { ActionNodeData } from '../types'
import {
  TelegramIcon,
  GoogleSheetsIcon,
  GoogleCalendarIcon,
  NotionIcon,
  WhatsAppIcon,
  PaymentCardIcon,
  WebhookIcon,
  AiAgentIcon,
} from '../icons/app-icons'

interface ActionNodeProps {
  data: ActionNodeData
  selected: boolean
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  const getIcon = () => {
    switch (data.actionType) {
      case 'telegram_message':
        return <TelegramIcon size={32} />
      case 'google_sheets':
        return <GoogleSheetsIcon size={32} />
      case 'google_calendar':
        return <GoogleCalendarIcon size={32} />
      case 'notion':
        return <NotionIcon size={32} />
      case 'create_saspay_payment':
        return <PaymentCardIcon size={32} />
      case 'http_request':
        return <WebhookIcon size={30} />
      case 'ai_agent':
        return <AiAgentIcon size={32} />
      case 'send_message':
        return <WhatsAppIcon size={32} />
      case 'send_template':
        return <WhatsAppIcon size={32} />
      case 'send_flow':
        return <Layers className="w-7 h-7 text-cyan-500" />
      case 'send_product':
      case 'send_product_list':
      case 'send_product_carousel':
      case 'send_catalog':
        return <ShoppingCart className="w-7 h-7 text-emerald-500" />
      case 'add_tag':
      case 'remove_tag':
        return <Tag className="w-7 h-7 text-violet-500" />
      case 'assign_agent':
        return <UserCheck className="w-7 h-7 text-sky-500" />
      default:
        return <WhatsAppIcon size={32} />
    }
  }

  const getSubtitle = () => {
    switch (data.actionType) {
      case 'telegram_message':
        return 'Telegram'
      case 'google_sheets':
        return 'Google Sheets'
      case 'google_calendar':
        return 'Google Calendar'
      case 'notion':
        return 'Notion'
      case 'create_saspay_payment':
        return 'Lien Paiement'
      case 'http_request':
        return 'Requête API'
      case 'ai_agent':
        return 'Agent IA'
      case 'send_message':
        return 'Message WhatsApp'
      case 'send_template':
        return 'Template WhatsApp'
      case 'send_flow':
        return 'Flow WhatsApp'
      case 'send_product':
        return 'Produit'
      case 'send_product_list':
        return 'Liste produits'
      case 'send_product_carousel':
        return 'Carousel'
      case 'send_catalog':
        return 'Catalogue'
      case 'add_tag':
        return 'Ajout tag'
      case 'remove_tag':
        return 'Retrait tag'
      case 'assign_agent':
        return 'Conseiller'
      default:
        return 'Action'
    }
  }

  return (
    <div className="relative flex flex-col items-center select-none group">
      {/* Sleek minimal n8n rectangle */}
      <div
        className={`relative w-[96px] h-[84px] bg-card rounded-2xl flex flex-col items-center justify-center transition-all duration-150 border-2 ${
          selected
            ? 'border-[#fe5105] ring-4 ring-[#fe5105]/20 shadow-lg scale-105'
            : 'border-border/80 hover:border-border hover:shadow-md'
        }`}
      >
        {/* Enlarged Input Handle on Left (Target) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-zinc-400 dark:!bg-zinc-500 hover:!bg-[#fe5105] !border-2 !border-background rounded-full -ml-2 hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Point d'entrée de l'action"
        />

        {/* Central App or Feature Icon */}
        <div className="flex items-center justify-center p-2 rounded-xl group-hover:scale-110 transition-transform">
          {getIcon()}
        </div>

        {/* Enlarged Output Handle on Right (Source) */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-4 !h-4 !bg-[#fe5105] !border-2 !border-background rounded-full -mr-2 hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Connecter à l'action suivante"
        />
      </div>

      {/* Label and subtitle outside under the node */}
      <div className="mt-2 text-center select-none pointer-events-none max-w-[120px]">
        <div className="text-xs font-semibold text-foreground truncate leading-tight">
          {data.label || getSubtitle()}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
          {getSubtitle()}
        </div>
      </div>
    </div>
  )
}
