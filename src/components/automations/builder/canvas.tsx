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
import {
  Menu,
  X,
  Save,
  Maximize,
  Plus,
  Trash2,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'
import { toast } from 'sonner'

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

  // Test Runner state
  const { activeOrganization } = useOrganization()
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testingWorkflow, setTestingWorkflow] = useState(false)
  const [testResults, setTestResults] = useState<any[] | null>(null)
  const [testContactName, setTestContactName] = useState('Stephane')
  const [testContactPhone, setTestContactPhone] = useState('22501020304')
  const [testMessageText, setTestMessageText] = useState('Bonjour')

  const handleRunWorkflowTest = async () => {
    if (!activeOrganization) {
      toast.error('Aucune organisation active sélectionnée')
      return
    }
    setTestingWorkflow(true)
    setTestResults(null)
    try {
      const res = await fetch('/api/whatsapp/automations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({
          nodes,
          edges,
          testContact: { name: testContactName, phone: testContactPhone },
          testMessage: { text: testMessageText },
        }),
      })

      const data = await res.json()
      if (data.logs) {
        setTestResults(data.logs)
      }

      if (data.success) {
        toast.success('Test du workflow terminé avec succès !')
      } else {
        toast.error(data.error || 'Des étapes ont échoué lors de l’exécution.')
      }
    } catch (e: any) {
      toast.error(`Erreur réseau : ${e.message}`)
    } finally {
      setTestingWorkflow(false)
    }
  }

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
            actionPayload: {
              method: 'POST',
              url: '',
              authType: 'none',
              contentType: 'json',
              body: '',
              queryParams: [],
              headersList: [],
            },
          }
        } else if (subtype === 'telegram_message') {
          newNode.data = {
            ...newNode.data,
            actionType: 'telegram_message',
            actionPayload: {
              telegramOperation: 'send_message',
              telegramBotToken: '',
              telegramChatId: '',
              telegramText: 'Notification Whatooz: Nouveau prospect {{ contact.name }} ({{ contact.phone }})',
              telegramParseMode: 'HTML',
            },
          }
        } else if (subtype === 'google_sheets') {
          newNode.data = {
            ...newNode.data,
            actionType: 'google_sheets',
            actionPayload: {
              sheetsOperation: 'append_row',
              sheetsAuthMode: 'webhook_url',
              sheetsSpreadsheetId: '',
              sheetsSheetName: 'Feuille 1',
              sheetsRowData: '{\n  "Date": "{{ now }}",\n  "Nom": "{{ contact.name }}",\n  "Telephone": "{{ contact.phone }}"\n}',
            },
          }
        } else if (subtype === 'google_calendar') {
          newNode.data = {
            ...newNode.data,
            actionType: 'google_calendar',
            actionPayload: {
              calendarOperation: 'create_event',
              calendarId: 'primary',
              calendarSummary: 'Rendez-vous Whatooz: {{ contact.name }}',
              calendarDescription: 'Rendez-vous automatique planifié via WhatsApp pour {{ contact.phone }}',
              calendarStartTime: '',
              calendarEndTime: '',
              calendarAttendeeEmail: '',
            },
          }
        } else if (subtype === 'notion') {
          newNode.data = {
            ...newNode.data,
            actionType: 'notion',
            actionPayload: {
              notionOperation: 'create_page',
              notionApiKey: '',
              notionDatabaseId: '',
              notionPageTitle: 'Lead: {{ contact.name }}',
              notionPropertiesJson: '{\n  "Téléphone": "{{ contact.phone }}",\n  "Origine": "WhatsApp"\n}',
            },
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
              onClick={() => {
                setTestModalOpen(true)
                setTestResults(null)
              }}
              className="flex items-center gap-1.5 bg-secondary text-secondary-foreground border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-secondary/80 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 text-primary" />
              <span>Tester le flux</span>
            </button>

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

        {/* Workflow Test Modal */}
        {testModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Play className="w-4 h-4 fill-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Tester le Workflow</h3>
                    <p className="text-xs text-muted-foreground">Simulez l'exécution du flux avec des données tests</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* Simulated Input Variables */}
                <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Paramètres de la simulation
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Nom du contact</label>
                      <input
                        type="text"
                        value={testContactName}
                        onChange={(e) => setTestContactName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Numéro WhatsApp</label>
                      <input
                        type="text"
                        value={testContactPhone}
                        onChange={(e) => setTestContactPhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Message entrant simulé</label>
                    <input
                      type="text"
                      value={testMessageText}
                      onChange={(e) => setTestMessageText(e.target.value)}
                      placeholder="Ex: Bonjour, PRIX, COMMANDE..."
                      className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Execution Results */}
                {testResults && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                        Journal d'exécution ({testResults.length} étapes)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {testResults.map((log: any, idx: number) => {
                        const isSuccess = log.status === 'success'
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              isSuccess
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-foreground'
                                : 'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-semibold">
                                {isSuccess ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                )}
                                <span>Étape {idx + 1} : {log.action || log.nodeType}</span>
                              </div>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                  isSuccess
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                                }`}
                              >
                                {isSuccess ? 'SUCCÈS' : 'ÉCHEC'}
                              </span>
                            </div>

                            {log.error && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg break-words">
                                {log.error}
                              </p>
                            )}

                            {/* Special view for SasPay link */}
                            {log.output?.checkoutUrl && (
                              <div className="pt-1">
                                <a
                                  href={log.output.checkoutUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                                >
                                  <span>Tester le lien SasPay généré</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            {/* Special view for Telegram */}
                            {log.output?.result?.message_id && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                ✅ Telegram Message ID : {log.output.result.message_id}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleRunWorkflowTest}
                  disabled={testingWorkflow}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {testingWorkflow ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>Lancer la simulation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </ReactFlowProvider>
    </div>
  )
}
