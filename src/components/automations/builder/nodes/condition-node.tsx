import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Split, MoreHorizontal } from 'lucide-react'
import { ConditionNodeData } from '../types'

interface ConditionNodeProps {
  data: ConditionNodeData
  selected: boolean
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
  const getSubtitle = () => {
    switch (data.conditionType) {
      case 'equals': return 'Est égal à'
      case 'not_equals': return 'N\'est pas égal à'
      case 'contains': return 'Contient'
      case 'not_contains': return 'Ne contient pas'
      case 'greater_than': return 'Supérieur à'
      case 'less_than': return 'Inférieur à'
      case 'exists': return 'Existe'
      case 'empty': return 'Est vide'
      default: return 'Condition'
    }
  }

  return (
    <div
      className={`relative min-w-[240px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border ${
        selected ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-slate-200 dark:border-slate-800'
      } transition-all`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-200 border-2 border-white dark:border-slate-900 dark:bg-slate-700 -ml-1.5"
      />
      
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="text-slate-500 dark:text-slate-400">
            <Split className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{data.label || 'Condition'}</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      {/* Node Body */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-b-xl space-y-1.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-500 font-medium uppercase tracking-wider">Type</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">{getSubtitle()}</span>
        </div>
        
        {data.conditionType !== 'exists' && data.conditionType !== 'empty' && (
          <div className="flex justify-between items-start text-[10px] gap-4">
            <span className="text-slate-500 font-medium uppercase tracking-wider flex-shrink-0">Valeur</span>
            <span className="text-slate-700 dark:text-slate-300 truncate text-right">
              {data.conditionValue || '-'}
            </span>
          </div>
        )}
      </div>

      {/* Two outputs for condition: True / False */}
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 -mr-1.5 top-1/3"
      />
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        className="w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 -mr-1.5 top-2/3"
      />
    </div>
  )
}
