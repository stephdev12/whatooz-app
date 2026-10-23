import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Zap, Layers, ShoppingCart, Globe, MessageSquare } from 'lucide-react'
import { TriggerNodeData } from '../types'

interface TriggerNodeProps {
  data: TriggerNodeData
  selected: boolean
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  const getIcon = () => {
    switch (data.triggerType) {
      case 'keyword':
        return <Zap className="w-4 h-4 text-amber-500" />
      case 'first_message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'flow_completed':
        return <Layers className="w-4 h-4 text-cyan-500" />
      case 'order_created':
        return <ShoppingCart className="w-4 h-4 text-emerald-500" />
      case 'api_request':
        return <Globe className="w-4 h-4 text-purple-500" />
      default:
        return <Zap className="w-4 h-4 text-amber-500" />
    }
  }

  const getSubtitle = () => {
    switch (data.triggerType) {
      case 'keyword':
        return 'Mot-clé reçu'
      case 'first_message':
        return 'Premier message entrant'
      case 'flow_completed':
        return 'Formulaire Flow validé'
      case 'order_created':
        return 'Commande Catalogue Meta'
      case 'api_request':
        return 'Webhook API entrant'
      default:
        return 'Déclencheur'
    }
  }

  return (
    <div className="relative flex flex-col items-center select-none">
      <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest mb-1 shadow-2xs">
        Démarrage
      </div>

      <div
        className={`relative min-w-[250px] max-w-[320px] bg-card rounded-xl shadow-sm border ${
          selected
            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
            : 'border-border hover:border-border/80'
        } transition-all duration-150`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/60 bg-amber-500/5 rounded-t-xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 shrink-0">
              {getIcon()}
            </div>
            <h3 className="text-xs font-semibold text-foreground truncate">
              {data.label || 'Déclencheur'}
            </h3>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 ml-2">
            Trigger
          </span>
        </div>

        {/* Body */}
        <div className="p-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-medium tracking-wider">Type</span>
            <span className="font-medium text-foreground truncate max-w-[170px] text-right">
              {getSubtitle()}
            </span>
          </div>

          <div className="pt-1 border-t border-border/40 flex justify-between items-start gap-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground shrink-0">
              Filtre
            </span>
            <span className="font-semibold text-foreground truncate text-right">
              {data.triggerType === 'keyword'
                ? (data.triggerValue ? `« ${data.triggerValue} »` : 'Tous les messages')
                : data.triggerType === 'flow_completed'
                ? (data.triggerValue ? `Flow: ${data.triggerValue}` : 'Tous les formulaires')
                : data.triggerType === 'api_request'
                ? 'Appel POST HTTP'
                : 'Automatique'}
            </span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-muted-foreground/40 hover:!bg-amber-500 !border-2 !border-background rounded-full -mr-1.5 transition-colors"
        />
      </div>
    </div>
  )
}
