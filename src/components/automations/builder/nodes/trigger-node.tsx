import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Zap, Layers, ShoppingCart, MessageSquare } from 'lucide-react'
import { TriggerNodeData } from '../types'
import { WebhookIcon } from '../icons/app-icons'

interface TriggerNodeProps {
  data: TriggerNodeData
  selected: boolean
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  const getIcon = () => {
    switch (data.triggerType) {
      case 'keyword':
        return <Zap className="w-6 h-6 text-amber-500 fill-amber-500/20" />
      case 'first_message':
        return <MessageSquare className="w-6 h-6 text-blue-500" />
      case 'flow_completed':
        return <Layers className="w-6 h-6 text-cyan-500" />
      case 'order_created':
        return <ShoppingCart className="w-6 h-6 text-emerald-500" />
      case 'api_request':
        return <WebhookIcon size={26} />
      default:
        return <Zap className="w-6 h-6 text-amber-500 fill-amber-500/20" />
    }
  }

  const getSubtitle = () => {
    switch (data.triggerType) {
      case 'keyword':
        return data.triggerValue ? `« ${data.triggerValue} »` : 'Mot-clé'
      case 'first_message':
        return 'Nouveau contact'
      case 'flow_completed':
        return 'Formulaire validé'
      case 'order_created':
        return 'Panier catalogue'
      case 'api_request':
        return 'Webhook entrant'
      default:
        return 'Déclencheur'
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
        {/* Subtle top indicator pill */}
        <div className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Start</span>
        </div>

        {/* Central Icon */}
        <div className="flex items-center justify-center p-2 rounded-xl bg-muted/40 group-hover:scale-110 transition-transform">
          {getIcon()}
        </div>

        {/* Enlarged Prominent Connection Handle (Output only on right) */}
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
          {data.label || 'Déclencheur'}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
          {getSubtitle()}
        </div>
      </div>
    </div>
  )
}
