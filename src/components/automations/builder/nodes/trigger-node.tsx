import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Zap, MoreHorizontal } from 'lucide-react'
import { TriggerNodeData } from '../types'

interface TriggerNodeProps {
  data: TriggerNodeData
  selected: boolean
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  const getSubtitle = () => {
    switch (data.triggerType) {
      case 'keyword': return 'Mot-clé'
      case 'new_contact': return 'Nouveau contact'
      case 'menu_click': return 'Clic menu'
      default: return 'Déclencheur'
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* "Start" Label above the node */}
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start</span>
      
      <div
        className={`relative min-w-[240px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border ${
          selected ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-slate-200 dark:border-slate-800'
        } transition-all`}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="text-slate-500 dark:text-slate-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{data.label || 'Déclencheur'}</h3>
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
          
          <div className="flex justify-between items-start text-[10px] gap-4">
            <span className="text-slate-500 font-medium uppercase tracking-wider flex-shrink-0">Valeur</span>
            <span className="text-slate-700 dark:text-slate-300 truncate text-right">
              {data.triggerType === 'keyword' ? (data.triggerValue || 'Tous les messages') : '-'}
            </span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-slate-200 border-2 border-white dark:border-slate-900 dark:bg-slate-700 -mr-1.5"
        />
      </div>
    </div>
  )
}
