import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Clock } from 'lucide-react'
import { DelayNodeData } from '../types'

interface DelayNodeProps {
  data: DelayNodeData
  selected: boolean
}

export function DelayNode({ data, selected }: DelayNodeProps) {
  const duration = data.delayMinutes || 1

  return (
    <div className="relative flex flex-col items-center select-none group">
      {/* Sleek minimal n8n rectangle */}
      <div
        className={`relative w-[96px] h-[84px] bg-card rounded-2xl flex flex-col items-center justify-center transition-all duration-150 border-2 ${
          selected
            ? 'border-amber-500 ring-4 ring-amber-500/20 shadow-lg scale-105'
            : 'border-border/80 hover:border-border hover:shadow-md'
        }`}
      >
        {/* Enlarged Input Handle on Left (Target) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-zinc-400 dark:!bg-zinc-500 hover:!bg-amber-500 !border-2 !border-background rounded-full -ml-2 hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Point d'entrée du délai"
        />

        {/* Central Icon & Duration Pill */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl group-hover:scale-110 transition-transform gap-1">
          <Clock className="w-6 h-6 text-amber-500" />
          <span className="text-[10px] font-bold text-foreground bg-muted px-1.5 py-0.2 rounded-md">
            {duration}m
          </span>
        </div>

        {/* Enlarged Output Handle on Right (Source) */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-4 !h-4 !bg-amber-500 !border-2 !border-background rounded-full -mr-2 hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Reprendre après la pause"
        />
      </div>

      {/* Label and subtitle outside under the node */}
      <div className="mt-2 text-center select-none pointer-events-none max-w-[120px]">
        <div className="text-xs font-semibold text-foreground truncate leading-tight">
          {data.label || 'Délai'}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
          Attente {duration} min{duration > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
