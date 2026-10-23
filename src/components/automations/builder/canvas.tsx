'use client'

import React, { useCallback, useRef, useState, useEffect, DragEvent } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'
import { Menu, X, Save, Maximize, Plus, Trash2 } from 'lucide-react'

import { Sidebar } from './sidebar'
import { PropertiesPanel } from './properties-panel'
import { TriggerNode } from './nodes/trigger-node'
import { ActionNode } from './nodes/action-node'
import { ConditionNode } from './nodes/condition-node'
import { DelayNode } from './nodes/delay-node'
import { BuilderNode, BuilderEdge } from './types'

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
}

interface CanvasProps {
  initialNodes?: BuilderNode[]
  initialEdges?: BuilderEdge[]
  onSave?: (nodes: BuilderNode[], edges: BuilderEdge[]) => void
}

export function Canvas({ initialNodes = [], initialEdges = [], onSave }: CanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const { resolvedTheme } = useTheme()

  // Sync initial nodes and edges when loaded asynchronously from parent
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      setNodes(initialNodes)
    }
  }, [initialNodes])

  useEffect(() => {
    if (initialEdges && initialEdges.length > 0) {
      setEdges(initialEdges)
    }
  }, [initialEdges])

  // Selected node state for properties panel
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
          },
          eds
        )
      ),
    []
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const rawData = event.dataTransfer.getData('application/reactflow')
      if (!rawData) return

      let dragData: any = {}
      try {
        dragData = JSON.parse(rawData)
      } catch (e) {
        dragData = { nodeType: rawData }
      }

      const { nodeType: type, label, subType: subtype } = dragData

      if (typeof type === 'undefined' || !type) return
      if (!reactFlowInstance || !reactFlowWrapper.current) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: BuilderNode = {
        id: uuidv4(),
        type,
        position,
        data: { label: label || `${type} node` },
      }

      // Populate rich default data based on type
      if (type === 'triggerNode') {
        newNode.data = {
          ...newNode.data,
          triggerType: subtype || 'keyword',
          triggerValue: '',
        }
      } else if (type === 'actionNode') {
        if (subtype === 'send_template') {
          newNode.data = {
            ...newNode.data,
            actionType: 'send_template',
            templateId: '',
            actionLanguage: 'fr',
            actionPayload: { templateVariablesMapping: {} },
          }
        } else if (subtype === 'send_flow') {
          newNode.data = {
            ...newNode.data,
            actionType: 'send_flow',
            flowId: '',
            buttonText: 'Ouvrir',
            ctaMessage: 'Veuillez remplir le formulaire :',
          }
        } else if (subtype === 'create_saspay_payment') {
          newNode.data = {
            ...newNode.data,
            actionType: 'create_saspay_payment',
            actionPayload: {
              paymentMessage: 'Veuillez régler votre commande via SasPay :',
              paymentAmount: '',
            },
          }
        } else if (subtype === 'add_tag' || subtype === 'remove_tag') {
          newNode.data = {
            ...newNode.data,
            actionType: subtype,
            actionPayload: { tagName: '' },
          }
        } else if (subtype === 'assign_agent') {
          newNode.data = {
            ...newNode.data,
            actionType: 'assign_agent',
            actionPayload: { agentId: '' },
          }
        } else if (subtype === 'ai_agent') {
          newNode.data = {
            ...newNode.data,
            actionType: 'ai_agent',
            actionPayload: {
              prompt: 'Réponds au client de façon professionnelle et concise.',
            },
          }
        } else if (subtype === 'http_request') {
          newNode.data = {
            ...newNode.data,
            actionType: 'http_request',
            actionPayload: { method: 'POST', url: '', body: '' },
          }
        } else {
          newNode.data = {
            ...newNode.data,
            actionType: subtype || 'send_message',
            actionPayload: { text: '' },
          }
        }
      } else if (type === 'conditionNode') {
        newNode.data = {
          ...newNode.data,
          conditionField: 'message.text',
          conditionType: 'equals',
          conditionValue: '',
        }
      } else if (type === 'delayNode') {
        newNode.data = { ...newNode.data, delayMinutes: 1 }
      }

      setNodes((nds) => nds.concat(newNode))
      setSelectedNodeId(newNode.id)
    },
    [reactFlowInstance]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          }
        }
        return node
      })
    )
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNodeId((curr) => (curr === nodeId ? null : curr))
  }, [])

  // Keyboard shortcut for deleting selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        const activeTag = document.activeElement?.tagName?.toLowerCase()
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
          return
        }
        deleteNode(selectedNodeId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, deleteNode])

  const handleSave = () => {
    if (onSave) {
      onSave(nodes as BuilderNode[], edges as BuilderEdge[])
    }
  }

  return (
    <div className="flex w-full h-[calc(100vh-56px)] bg-background relative overflow-hidden select-none">
      <ReactFlowProvider>
        {/* Sidebar palette */}
        <div
          className={`absolute inset-y-0 left-0 z-40 h-full transform transition-transform duration-300 md:relative md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
          <button
            className="absolute top-4 right-4 md:hidden p-1.5 bg-background rounded-md text-muted-foreground hover:text-foreground border border-border"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overlay when sidebar is open on mobile */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-30 md:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Canvas Area */}
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <div className="absolute top-4 left-4 z-10 md:hidden flex gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-card text-foreground border border-border p-2 rounded-md shadow-sm hover:bg-muted"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Top Bar */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {selectedNodeId && (
              <button
                onClick={() => deleteNode(selectedNodeId)}
                className="flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-500/20 transition-all shadow-xs"
                title="Supprimer le bloc sélectionné"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Sauvegarder</span>
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { strokeWidth: 2, stroke: '#94a3b8' },
            }}
            fitView
            colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
            className="bg-background"
          >
            <Controls className="!bg-card !border-border !shadow-sm !rounded-lg" />
            <Background
              variant={BackgroundVariant.Dots}
              color="var(--border)"
              gap={20}
              size={1.2}
            />
          </ReactFlow>
        </div>

        {/* Properties Inspector Panel on the Right */}
        {selectedNodeId && nodes.find((n) => n.id === selectedNodeId) && (
          <div className="absolute inset-y-0 right-0 z-40 md:relative bg-card h-full w-full md:w-88 shadow-xl md:shadow-none border-l border-border">
            <PropertiesPanel
              selectedNode={nodes.find((n) => n.id === selectedNodeId) as BuilderNode}
              onUpdateNode={updateNodeData}
              onDeleteNode={deleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </ReactFlowProvider>
    </div>
  )
}
