import React from 'react'
import { Zap, MessageSquare, Split, Clock, LayoutTemplate, Layers, FileText, ShoppingCart, CreditCard, Globe } from 'lucide-react'

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, subType?: string) => {
    const data = JSON.stringify({ nodeType, label, subType })
    event.dataTransfer.setData('application/reactflow', data)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full z-10 shadow-sm relative">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Blocs disponibles</h2>
        <p className="text-xs text-muted-foreground mt-1">Glissez-déposez sur le canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* TRIGGERS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Déclencheurs</h3>
          
          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-amber-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'triggerNode', 'Mot-clé')}
            draggable
          >
            <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-md">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Déclencheur</span>
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-emerald-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'triggerNode', 'Requête API / Webhook', 'api_request')}
            draggable
          >
            <div className="p-1.5 bg-emerald-500/20 text-emerald-600 rounded-md">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Requête API</span>
          </div>
        </div>

        {/* LOGIQUE */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logique</h3>
          
          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-purple-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'conditionNode', 'Condition')}
            draggable
          >
            <div className="p-1.5 bg-purple-500/20 text-purple-600 rounded-md">
              <Split className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Condition</span>
          </div>



          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-slate-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'delayNode', 'Délai')}
            draggable
          >
            <div className="p-1.5 bg-secondary text-foreground rounded-md">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Délai</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</h3>
          
          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-blue-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'actionNode', 'Action')}
            draggable
          >
            <div className="p-1.5 bg-blue-500/20 text-blue-600 rounded-md">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Action</span>
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-indigo-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'actionNode', 'Envoyer Modèle', 'send_template')}
            draggable
          >
            <div className="p-1.5 bg-indigo-500/20 text-indigo-600 rounded-md">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Envoyer Modèle</span>
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-cyan-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'actionNode', 'Envoyer Flow', 'send_flow')}
            draggable
          >
            <div className="p-1.5 bg-cyan-500/20 text-cyan-600 rounded-md">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Envoyer Flow</span>
          </div>

        </div>

        {/* E-COMMERCE */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-commerce</h3>
          
          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-emerald-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'actionNode', 'Envoyer le Catalogue', 'send_catalog')}
            draggable
          >
            <div className="p-1.5 bg-emerald-500/20 text-emerald-600 rounded-md">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Envoyer le Catalogue</span>
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-teal-400 hover:shadow-sm transition-all"
            onDragStart={(e) => onDragStart(e, 'actionNode', 'Demande de Paiement', 'request_payment')}
            draggable
          >
            <div className="p-1.5 bg-teal-500/20 text-teal-600 rounded-md">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Demande de Paiement</span>
          </div>
        </div>

      </div>
    </aside>
  )
}
