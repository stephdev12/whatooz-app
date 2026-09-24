import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { MessageSquare, LayoutTemplate, Layers, MoreHorizontal } from 'lucide-react'
import { ActionNodeData } from '../types'

interface ActionNodeProps {
  data: ActionNodeData
  selected: boolean
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  const getIcon = () => {
    switch (data.actionType) {
      case 'send_message': return <MessageSquare className="w-4 h-4" />
      case 'send_template': return <LayoutTemplate className="w-4 h-4" />
      case 'send_flow': return <Layers className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getSubtitle = () => {
    switch (data.actionType) {
      case 'send_message': return 'Envoyer un message'
      case 'send_template': return 'Envoyer un template'
      case 'send_flow': return 'Envoyer un Flow'
      default: return 'Action'
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
            {getIcon()}
          </div>
          <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{data.label || 'Action'}</h3>
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
          <span className="text-slate-500 font-medium uppercase tracking-wider flex-shrink-0">Détails</span>
          <span className="text-slate-700 dark:text-slate-300 truncate text-right">
            {data.actionType === 'send_message' && ((data.actionPayload as any)?.text || 'Texte vide...')}
            {data.actionType === 'send_template' && (data.templateId || 'Non sélectionné')}
            {data.actionType === 'send_flow' && (data.flowId || 'Non sélectionné')}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-slate-200 border-2 border-white dark:border-slate-900 dark:bg-slate-700 -mr-1.5"
      />
    </div>
  )
}
