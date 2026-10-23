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
        return 'Est égal à'
      case 'not_equals':
        return 'Différent de'
      case 'contains':
        return 'Contient'
      case 'not_contains':
        return 'Ne contient pas'
      case 'starts_with':
        return 'Commence par'
      case 'ends_with':
        return 'Se termine par'
      case 'greater_than':
        return 'Supérieur à'
      case 'less_than':
        return 'Inférieur à'
      case 'empty':
        return 'Est vide'
      case 'not_empty':
        return 'N\'est pas vide'
      default:
        return 'Condition'
    }
  }

  const field = data.conditionField || 'message.text'

  return (
    <div
      className={`relative min-w-[260px] max-w-[320px] bg-card rounded-xl shadow-sm border ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
          : 'border-border hover:border-border/80'
      } transition-all duration-150 select-none`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground/40 hover:!bg-purple-500 !border-2 !border-background rounded-full -ml-1.5 transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/60 bg-purple-500/5 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-foreground truncate">
            {data.label || 'Condition Si / Sinon'}
          </h3>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 ml-2">
          Branche
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-1.5 text-[11px]">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-[10px] uppercase font-medium tracking-wider">Test</span>
          <span className="font-mono text-[10px] text-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[170px]">
            {field}
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span className="text-[10px] uppercase font-medium tracking-wider">Règle</span>
          <span className="font-medium text-foreground truncate max-w-[170px] text-right">
            {getSubtitle()}
          </span>
        </div>

        {data.conditionType !== 'empty' && data.conditionType !== 'not_empty' && (
          <div className="pt-1 border-t border-border/40 flex justify-between items-center">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
              Valeur
            </span>
            <span className="font-semibold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] truncate max-w-[160px]">
              {data.conditionValue || '""'}
            </span>
          </div>
        )}
      </div>

      {/* Branch Indicators and Handles on the right */}
      <div className="border-t border-border/40 px-3 py-2 bg-muted/10 rounded-b-xl flex flex-col gap-2">
        {/* TRUE BRANCH */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="w-3 h-3" />
            <span>VRAI (Si valide)</span>
          </div>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background rounded-full -mr-1.5 hover:scale-125 transition-transform"
          />
        </div>

        {/* FALSE BRANCH */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <X className="w-3 h-3" />
            <span>FAUX (Sinon)</span>
          </div>
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            className="!w-3 !h-3 !bg-rose-500 !border-2 !border-background rounded-full -mr-1.5 hover:scale-125 transition-transform"
          />
        </div>
      </div>
    </div>
  )
}
