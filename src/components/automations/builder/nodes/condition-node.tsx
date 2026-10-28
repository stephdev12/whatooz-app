import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { GitBranch, Check, X } from 'lucide-react'
import { ConditionNodeData } from '../types'

interface ConditionNodeProps {
  data: ConditionNodeData
  selected: boolean
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
  const getSubtitle = () => {
    switch (data.conditionType) {
      case 'equals':
        return data.conditionValue ? `= "${data.conditionValue}"` : 'Égal à'
      case 'not_equals':
        return 'Différent de'
      case 'contains':
        return data.conditionValue ? `Contient "${data.conditionValue}"` : 'Contient'
      case 'not_contains':
        return 'Ne contient pas'
      case 'empty':
        return 'Est vide'
      case 'not_empty':
        return 'Non vide'
      default:
        return 'Si / Sinon'
    }
  }

  return (
    <div className="relative flex flex-col items-center select-none group">
      {/* Sleek minimal n8n rectangle */}
      <div
        className={`relative w-[104px] h-[92px] bg-card rounded-2xl flex flex-col items-center justify-center transition-all duration-150 border-2 ${
          selected
            ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-lg scale-105'
            : 'border-border/80 hover:border-border hover:shadow-md'
        }`}
      >
        {/* Enlarged Input Handle on Left (Target) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-zinc-400 dark:!bg-zinc-500 hover:!bg-purple-500 !border-2 !border-background rounded-full -ml-2 hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Point d'entrée du test conditionnel"
        />

        {/* Central Icon */}
        <div className="flex items-center justify-center p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
          <GitBranch className="w-7 h-7" />
        </div>

        {/* TRUE Branch (Top Right) */}
        <div className="absolute top-2 right-2.5 flex items-center gap-1 pointer-events-none">
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
            VRAI
          </span>
        </div>
        <Handle
          type="source"
          id="true"
          position={Position.Right}
          className="!top-5.5 -mr-2 !w-4 !h-4 !bg-emerald-500 !border-2 !border-background rounded-full hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Branche VRAI (Condition vérifiée)"
        />

        {/* FALSE Branch (Bottom Right) */}
        <div className="absolute bottom-2 right-2.5 flex items-center gap-1 pointer-events-none">
          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tighter">
            FAUX
          </span>
        </div>
        <Handle
          type="source"
          id="false"
          position={Position.Right}
          className="!bottom-5.5 -mr-2 !w-4 !h-4 !bg-rose-500 !border-2 !border-background rounded-full hover:!scale-130 transition-transform cursor-crosshair shadow-md"
          title="Branche FAUX (Condition non vérifiée)"
        />
      </div>

      {/* Label and subtitle outside under the node */}
      <div className="mt-2 text-center select-none pointer-events-none max-w-[130px]">
        <div className="text-xs font-semibold text-foreground truncate leading-tight">
          {data.label || 'Condition'}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
          {getSubtitle()}
        </div>
      </div>
    </div>
  )
}
