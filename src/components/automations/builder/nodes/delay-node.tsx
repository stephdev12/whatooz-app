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
    <div
      className={`relative min-w-[220px] max-w-[280px] bg-card rounded-xl shadow-sm border ${
        selected
          ? 'border-slate-500 ring-2 ring-slate-500/20 shadow-lg'
          : 'border-border hover:border-border/80'
      } transition-all duration-150 select-none`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground/40 hover:!bg-slate-500 !border-2 !border-background rounded-full -ml-1.5 transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/60 bg-muted/20 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-muted text-muted-foreground border border-border shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-foreground truncate">
            {data.label || 'Délai d\'attente'}
          </h3>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 ml-2">
          Pause
        </span>
      </div>

      {/* Body */}
      <div className="p-3 text-[11px] flex justify-between items-center text-muted-foreground">
        <span className="text-[10px] uppercase font-medium tracking-wider">Durée</span>
        <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded text-xs">
          {duration} min{duration > 1 ? 's' : ''}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground/40 hover:!bg-slate-500 !border-2 !border-background rounded-full -mr-1.5 transition-colors"
      />
    </div>
  )
}
