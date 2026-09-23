'use client'

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { VisualScreen, VisualComponent } from '@/lib/whatsapp/flows/validator';
import { Settings, Check, X, FilePlus, ChevronRight, CornerDownRight, Play, LayoutGrid, CheckSquare, List, Calendar, Image as ImageIcon, CheckCircle, FileText, Upload, Plus } from 'lucide-react';

interface FlowCanvasProps {
  screens: VisualScreen[];
  onScreensChange: (screens: VisualScreen[]) => void;
  selectedScreenId: string | null;
  onSelectScreen: (screenId: string) => void;
  selectedComponentId: string | null;
  onSelectComponent: (compId: string) => void;
}

// Component Preview Renderer
const ComponentPreview = ({ comp }: { comp: any }) => {
  switch (comp.type) {
    case 'TextHeading':
      return <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{comp.text || 'Titre (TextHeading)'}</h4>;
    case 'TextBody':
    case 'TextCaption':
      return <p className={`text-slate-600 dark:text-slate-300 ${comp.type === 'TextCaption' ? 'text-[10px]' : 'text-xs'} leading-relaxed`}>{comp.text || 'Texte (Body/Caption)'}</p>;
    case 'TextInput':
    case 'TextArea':
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500">{comp.label || 'Label (TextInput)'} {comp.required && <span className="text-red-400">*</span>}</label>
          <div className={`w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg ${comp.type === 'TextArea' ? 'h-16' : 'h-8'} px-2 flex items-center text-slate-400 text-[10px]`}>
            Saisie utilisateur...
          </div>
        </div>
      );
    case 'Dropdown':
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500">{comp.label || 'Label (Dropdown)'} {comp.required && <span className="text-red-400">*</span>}</label>
          <div className="w-full h-8 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 flex items-center justify-between text-slate-400 text-[10px]">
            <span>Sélectionner une option...</span>
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
        </div>
      );
    case 'RadioButtons':
    case 'CheckboxGroup':
      return (
        <div className="space-y-2">
          {comp.options && comp.options.length > 0 ? (
            comp.options.slice(0, 3).map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3 h-3 border border-slate-400 flex-shrink-0 ${comp.type === 'RadioButtons' ? 'rounded-full' : 'rounded-sm'}`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">{opt.title}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 opacity-50">
              <div className={`w-3 h-3 border border-slate-400 flex-shrink-0 ${comp.type === 'RadioButtons' ? 'rounded-full' : 'rounded-sm'}`} />
              <span className="text-xs text-slate-700 dark:text-slate-300">Option {comp.type}</span>
            </div>
          )}
          {comp.options && comp.options.length > 3 && (
             <div className="text-[9px] text-slate-500 italic">+ {comp.options.length - 3} options...</div>
          )}
        </div>
      );
    case 'DatePicker':
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500">{comp.label || 'Date'} {comp.required && <span className="text-red-400">*</span>}</label>
          <div className="w-full h-8 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 flex items-center text-slate-400 text-[10px] gap-2">
            <div className="w-3 h-3 border border-slate-400 rounded-sm" /> Sélectionner une date
          </div>
        </div>
      );
    case 'PhotoPicker':
    case 'DocumentPicker':
      return (
        <div className="space-y-1">
          {comp.label && <label className="text-[10px] font-medium text-slate-500">{comp.label}</label>}
          <div className="w-full h-12 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-[10px] gap-1">
            <Plus className="w-3 h-3" /> Ajouter un fichier
          </div>
        </div>
      );
    default:
      return (
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">{comp.label || comp.type}</span>
          <span className="text-slate-400 text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">{comp.type}</span>
        </div>
      );
  }
};

// Custom Node representing a Screen
const ScreenNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-[#efeae2] dark:bg-[#111b21] border-4 rounded-[2rem] shadow-xl w-[320px] h-[568px] overflow-hidden flex flex-col relative ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-800 dark:border-slate-600'} transition-all`}>
      {/* Mobile Notch / Status Bar Simulation */}
      <div className="absolute top-0 inset-x-0 h-6 bg-transparent flex justify-center z-20">
        <div className="w-24 h-4 bg-slate-800 dark:bg-slate-600 rounded-b-xl" />
      </div>

      {/* WhatsApp-like Header */}
      <div className="bg-[#075e54] dark:bg-[#202c33] text-white pt-8 pb-3 px-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="font-bold text-xs">Bot</span>
          </div>
          <h3 className="font-semibold text-sm truncate max-w-[150px]">
            {data.title}
          </h3>
        </div>
        {data.terminal && (
          <span className="text-[9px] bg-white/20 text-white/90 px-1.5 py-0.5 rounded-full font-medium tracking-wide">FIN</span>
        )}
      </div>
      
      {/* Realistic WhatsApp Background Area */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 relative scrollbar-hide">
        {/* Fake WhatsApp Message Bubble containing components */}
        <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-sm p-3 shadow-sm space-y-3 relative z-10 self-start w-11/12">
          {data.components && data.components.map((comp: any) => (
            <div 
              key={comp.id} 
              className="group relative cursor-pointer border border-transparent hover:border-[#10b981]/30 hover:bg-[#10b981]/5 p-1 -m-1 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                data.onSelectComponent(comp.id);
              }}
            >
              <ComponentPreview comp={comp} />
              
              {/* Overlay edit icon on hover */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 opacity-0 group-hover:opacity-100 bg-[#10b981] text-white p-1.5 rounded-md shadow-sm transition-opacity z-20">
                <Settings className="w-3 h-3" />
              </div>
            </div>
          ))}
          
          {(!data.components || data.components.length === 0) && (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              Aucun composant. Ajoutez-en un !
            </div>
          )}
        </div>
      </div>
      
      {/* Target handle for incoming navigation */}
      <Handle type="target" position={Position.Left} className="w-4 h-4 bg-slate-300 border-2 border-slate-800 rounded-full !left-[-10px]" />
      
      {/* Source handle for outgoing navigation (success/navigate) */}
      <Handle type="source" position={Position.Right} className="w-4 h-4 bg-emerald-500 border-2 border-emerald-900 rounded-full !right-[-10px]" />
    </div>
  );
};

const nodeTypes = {
  screen: ScreenNode,
};

export default function FlowCanvas({ screens, onScreensChange, selectedScreenId, onSelectScreen, selectedComponentId, onSelectComponent }: FlowCanvasProps) {
  
  // Convert our VisualScreen model to ReactFlow nodes
  const initialNodes: Node[] = screens.map((screen, idx) => ({
    id: screen.id,
    type: 'screen',
    position: { x: 100 + (idx * 350), y: 100 }, // Simple layout, can be improved with dagre
    data: { 
      title: screen.title, 
      components: screen.components,
      terminal: screen.terminal,
      onSelectComponent
    },
  }));

  // Infer edges from actions
  const initialEdges: Edge[] = [];
  screens.forEach(screen => {
     if (screen.successAction?.type === 'navigate') {
       initialEdges.push({
         id: `e-${screen.id}-${screen.successAction.nextScreenId}`,
         source: screen.id,
         target: screen.successAction.nextScreenId,
         type: 'smoothstep',
         animated: true,
         style: { stroke: '#10b981', strokeWidth: 2 }
       });
     }
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync back nodes to visual state if needed (mainly for position, though we don't save position in Meta JSON)
  // For now, ReactFlow drives the visual layout, but our `screens` state drives the content.

  // Update nodes when screens change
  React.useEffect(() => {
    setNodes(screens.map((screen, idx) => {
      const existingNode = nodes.find(n => n.id === screen.id);
      return {
        id: screen.id,
        type: 'screen',
        position: existingNode ? existingNode.position : { x: 100 + (idx * 350), y: 100 },
        data: { 
          title: screen.title, 
          components: screen.components,
          terminal: screen.terminal,
          onSelectComponent
        }
      };
    }));
    
    // Update edges
    const newEdges: Edge[] = [];
    screens.forEach(screen => {
       if (screen.successAction?.type === 'navigate') {
         newEdges.push({
           id: `e-${screen.id}-${screen.successAction.nextScreenId}`,
           source: screen.id,
           target: screen.successAction.nextScreenId,
           type: 'smoothstep',
           animated: true,
           style: { stroke: '#10b981', strokeWidth: 2 }
         });
       }
    });
    setEdges(newEdges);
  }, [screens, setNodes, setEdges]); // Removed 'nodes' from dependency array to prevent infinite loop


  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }, eds));
    
    // Update the underlying screen model
    const sourceScreen = screens.find(s => s.id === params.source);
    if (sourceScreen && params.target) {
      const updatedScreens = screens.map(s => {
        if (s.id === sourceScreen.id) {
          return {
            ...s,
            successAction: { type: 'navigate' as const, nextScreenId: params.target as string }
          };
        }
        return s;
      });
      onScreensChange(updatedScreens);
    }
  }, [screens, onScreensChange, setEdges]);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(e, node) => onSelectScreen(node.id)}
        onPaneClick={() => { onSelectScreen(''); onSelectComponent(''); }}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#94a3b8" gap={24} size={1.5} className="opacity-50 dark:opacity-30" />
        <Controls className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 fill-current" />
      </ReactFlow>
    </div>
  );
}
