'use client'

import React, { useCallback, useRef, useState, DragEvent } from 'react'
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'

import { Sidebar } from './sidebar'
import { PropertiesPanel } from './properties-panel'
import { TriggerNode } from './nodes/trigger-node'
import { ActionNode } from './nodes/action-node'
import { ConditionNode } from './nodes/condition-node'
import { DelayNode } from './nodes/delay-node'
import { BuilderNode, BuilderEdge, BuilderNodeType } from './types'

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
  
  // Selected node state for properties panel
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
        dragData = { nodeType: rawData } // fallback
      }

      const { nodeType: type, label, subType: subtype } = dragData

      if (typeof type === 'undefined' || !type) {
        return
      }

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

      // Populate default data based on type
      if (type === 'triggerNode') {
        newNode.data = { ...newNode.data, triggerType: 'keyword', triggerValue: '' }
      } else if (type === 'actionNode') {
        newNode.data = { 
          ...newNode.data, 
          actionType: subtype || 'send_message', 
          actionPayload: { text: '' } 
        }
      } else if (type === 'conditionNode') {
        newNode.data = { ...newNode.data, conditionType: 'equals', conditionValue: '' }
      } else if (type === 'delayNode') {
        newNode.data = { ...newNode.data, delayMinutes: 1 }
      }

      setNodes((nds) => nds.concat(newNode))
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
            data: { ...node.data, ...newData }
          }
        }
        return node
      })
    )
  }, [])

  const handleSave = () => {
    if (onSave) {
      // Cast to custom types
      onSave(nodes as BuilderNode[], edges as BuilderEdge[])
    }
  }

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-background">
      <ReactFlowProvider>
        <Sidebar />
        
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={handleSave}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-primary/90"
            >
              Sauvegarder
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
            defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2 } }}
            fitView
            colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
            className="bg-background"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} color="var(--border)" gap={24} size={1.5} />
          </ReactFlow>
        </div>

        {selectedNodeId && nodes.find(n => n.id === selectedNodeId) && (
          <PropertiesPanel 
            selectedNode={nodes.find(n => n.id === selectedNodeId) as BuilderNode} 
            onUpdateNode={updateNodeData} 
          />
        )}
      </ReactFlowProvider>
    </div>
  )
}
