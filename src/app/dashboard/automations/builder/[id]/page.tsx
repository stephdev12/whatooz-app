'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Canvas } from '@/components/automations/builder/canvas'
import { BuilderNode, BuilderEdge } from '@/components/automations/builder/types'
import { ArrowLeft, Loader2, Save, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { toast } from 'sonner'

export default function AutomationBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const { activeOrganization } = useOrganization()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [automationName, setAutomationName] = useState('Nouvelle Automation')
  const [nodes, setNodes] = useState<BuilderNode[]>([])
  const [edges, setEdges] = useState<BuilderEdge[]>([])

  const isNew = params.id === 'new'
  const automationId = isNew ? null : (params.id as string)

  useEffect(() => {
    if (!activeOrganization) return

    if (isNew) {
      // Default starter workflow for new automation
      const initialTrigger: BuilderNode = {
        id: 'node-trigger-init',
        type: 'triggerNode',
        position: { x: 120, y: 180 },
        data: {
          label: 'Déclencheur',
          triggerType: 'keyword',
          triggerValue: '',
        },
      }
      const initialAction: BuilderNode = {
        id: 'node-action-init',
        type: 'actionNode',
        position: { x: 440, y: 180 },
        data: {
          label: 'Envoyer un message',
          actionType: 'send_message',
          actionPayload: { text: 'Bonjour {{contact.name}} ! Comment pouvons-nous vous aider ?' },
        },
      }
      const initialEdge: BuilderEdge = {
        id: 'edge-init',
        source: 'node-trigger-init',
        target: 'node-action-init',
        type: 'smoothstep',
      }
      setNodes([initialTrigger, initialAction])
      setEdges([initialEdge])
      setLoading(false)
      return
    }

    const fetchAutomation = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('organization_id', activeOrganization.id)
        .single()

      if (data) {
        setAutomationName(data.name || 'Workflow sans titre')
        
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setNodes(data.nodes)
          setEdges(data.edges || [])
        } else {
          // Synthesize visual nodes for legacy automations
          const synthesizedTrigger: BuilderNode = {
            id: 'legacy-trigger',
            type: 'triggerNode',
            position: { x: 120, y: 180 },
            data: {
              label: 'Déclencheur',
              triggerType: (data.trigger_type || 'keyword') as any,
              triggerValue: data.trigger_value || '',
            },
          }
          const synthesizedAction: BuilderNode = {
            id: 'legacy-action',
            type: 'actionNode',
            position: { x: 440, y: 180 },
            data: {
              label: data.name || 'Action',
              actionType: (data.action_type === 'send_text' ? 'send_message' : data.action_type || 'send_message') as any,
              actionPayload: data.action_payload || {},
              templateId: data.action_payload?.template_name || data.action_payload?.templateId,
              flowId: data.action_payload?.flow_id,
            },
          }
          const synthesizedEdge: BuilderEdge = {
            id: 'legacy-edge',
            source: 'legacy-trigger',
            target: 'legacy-action',
            type: 'smoothstep',
          }
          setNodes([synthesizedTrigger, synthesizedAction])
          setEdges([synthesizedEdge])
        }
      }
      setLoading(false)
    }

    fetchAutomation()
  }, [activeOrganization, automationId, isNew])

  const handleSave = async (updatedNodes: BuilderNode[], updatedEdges: BuilderEdge[]) => {
    if (!activeOrganization) return
    setSaving(true)

    try {
      const supabase = createClient()

      // Calculate legacy automation fields from graph
      let trigger_type = 'custom'
      let trigger_value = null
      let action_type = 'custom'
      let action_payload: any = {}

      const triggerNode = updatedNodes.find(n => n.type === 'triggerNode')
      const actionNode = updatedNodes.find(n => n.type === 'actionNode')

      if (triggerNode?.data) {
        if (triggerNode.data.triggerType === 'keyword') {
          trigger_type = 'keyword'
          trigger_value = triggerNode.data.triggerValue
        } else if (triggerNode.data.triggerType === 'first_message') {
          trigger_type = 'first_message'
        } else if (triggerNode.data.triggerType === 'flow_completed') {
          trigger_type = 'flow_completed'
          trigger_value = triggerNode.data.triggerValue || null
        } else {
          trigger_type = triggerNode.data.triggerType as string
          trigger_value = triggerNode.data.triggerValue || null
        }
      }

      if (actionNode?.data) {
        if (actionNode.data.actionType === 'send_template') {
          action_type = 'send_template'
          
          let body_variables: string[] = []
          const mapping = (actionNode.data.actionPayload as any)?.templateVariablesMapping
          if (mapping) {
            const keys = Object.keys(mapping).filter(k => k.trim() !== '').sort((a, b) => parseInt(a) - parseInt(b))
            body_variables = keys.map(k => mapping[k])
          }

          action_payload = { 
            template_name: actionNode.data.templateId, // Backend uses this name or ID
            language_code: actionNode.data.actionLanguage || 'fr',
            body_variables,
            header_image_url: (actionNode.data.actionPayload as any)?.headerImageUrl || undefined
          }
        } else if (actionNode.data.actionType === 'send_flow') {
          action_type = 'send_flow'
          action_payload = { 
            flow_id: actionNode.data.flowId, 
            flow_cta: actionNode.data.buttonText || 'Ouvrir', 
            body_text: actionNode.data.ctaMessage || 'Veuillez remplir' 
          }
        } else if (actionNode.data.actionType === 'send_message') {
          action_type = 'send_text'
          action_payload = { text: (actionNode.data.actionPayload as any)?.text || '' }
        } else if (actionNode.data.actionType === 'http_request') {
          action_type = 'http_request'
          const p = actionNode.data.actionPayload as any || {}
          action_payload = {
            method: p.method || 'POST',
            url: p.url || '',
            body: p.body || ''
          }
        } else if (actionNode.data.actionType === 'send_product') {
          action_type = 'send_product'
          action_payload = { 
            text: (actionNode.data.actionPayload as any)?.text || '',
            catalogId: (actionNode.data.actionPayload as any)?.catalogId || '',
            productRetailerId: (actionNode.data.actionPayload as any)?.productRetailerId || ''
          }
        } else if (actionNode.data.actionType === 'send_product_list') {
          action_type = 'send_product_list'
          action_payload = { 
            text: (actionNode.data.actionPayload as any)?.text || '',
            catalogId: (actionNode.data.actionPayload as any)?.catalogId || '',
            productRetailerIds: (actionNode.data.actionPayload as any)?.productRetailerIds || ''
          }
        } else if (actionNode.data.actionType === 'send_product_carousel') {
          action_type = 'send_product_carousel'
          action_payload = { 
            text: (actionNode.data.actionPayload as any)?.text || '',
            catalogId: (actionNode.data.actionPayload as any)?.catalogId || '',
            productRetailerIds: (actionNode.data.actionPayload as any)?.productRetailerIds || ''
          }
        } else if (actionNode.data.actionType === 'send_catalog') {
          action_type = 'send_catalog'
          action_payload = {
            message: (actionNode.data as any).catalogMessage || '',
            catalogId: (actionNode.data.actionPayload as any)?.catalogId || ''
          }
        } else if (actionNode.data.actionType === 'create_saspay_payment') {
          action_type = 'create_saspay_payment'
          action_payload = {
            message: (actionNode.data as any).paymentMessage || (actionNode.data.actionPayload as any)?.paymentMessage || '',
            amount: (actionNode.data as any).paymentAmount || (actionNode.data.actionPayload as any)?.paymentAmount || null,
            ...((actionNode.data.actionPayload as any) || {})
          }
        } else if (actionNode.data.actionType === 'telegram_message' ||
                   actionNode.data.actionType === 'google_sheets' ||
                   actionNode.data.actionType === 'google_calendar' ||
                   actionNode.data.actionType === 'notion') {
          action_type = actionNode.data.actionType
          action_payload = actionNode.data.actionPayload || {}
        } else if (actionNode.data.actionType === 'add_tag' || actionNode.data.actionType === 'remove_tag') {
          action_type = actionNode.data.actionType
          action_payload = {
            tagName: (actionNode.data.actionPayload as any)?.tagName || ''
          }
        } else if (actionNode.data.actionType === 'assign_agent') {
          action_type = 'assign_agent'
          action_payload = {
            agentId: (actionNode.data.actionPayload as any)?.agentId || ''
          }
        } else if (actionNode.data.actionType === 'ai_agent') {
          action_type = 'ai_agent'
          action_payload = {
            prompt: (actionNode.data.actionPayload as any)?.prompt || ''
          }
        }
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('automations')
          .insert({
            organization_id: activeOrganization.id,
            name: automationName,
            nodes: updatedNodes,
            edges: updatedEdges,
            is_active: true,
            trigger_type,
            trigger_value,
            action_type,
            action_payload,
          })
          .select()
          .single()
        
        if (error) throw error
        toast.success('Workflow créé avec succès !')
        if (data) {
          router.replace(`/dashboard/automations/builder/${data.id}`)
        }
      } else {
        const { error } = await supabase
          .from('automations')
          .update({
            name: automationName,
            nodes: updatedNodes,
            edges: updatedEdges,
            trigger_type,
            trigger_value,
            action_type,
            action_payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', automationId)

        if (error) throw error
        toast.success('Workflow sauvegardé avec succès !')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la sauvegarde du workflow')
    } finally {
      setSaving(false)
    }
  }

  const [headerVisible, setHeaderVisible] = useState(true)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background relative">
      {/* Header */}
      <div className={`transition-all duration-300 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full absolute w-full z-50'}`}>
        <header className="flex h-auto min-h-14 shrink-0 items-center gap-2 sm:gap-4 border-b border-border bg-card px-2 sm:px-6 shadow-sm overflow-x-auto whitespace-nowrap py-2 sm:py-0">
          <button
            onClick={() => router.push('/dashboard/automations')}
            className="p-1 sm:p-1.5 hover:bg-secondary rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
          <div className="flex-1 shrink-0">
            <input
              type="text"
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              className="text-sm font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 placeholder-muted-foreground min-w-[150px]"
              placeholder="Nom du workflow"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {saving && <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2"><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> <span className="hidden sm:inline">Enregistrement...</span></span>}
          </div>
          <button
            onClick={() => setHeaderVisible(false)}
            className="p-1 sm:p-1.5 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-colors shrink-0"
            title="Masquer la barre"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
        </header>
      </div>

      {/* Show header toggle when hidden */}
      {!headerVisible && (
        <button
          onClick={() => setHeaderVisible(true)}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 p-1.5 bg-card border border-border shadow-md text-muted-foreground hover:text-foreground rounded-full transition-all hover:scale-105"
          title="Afficher la barre"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden relative">
        <Canvas 
          initialNodes={nodes} 
          initialEdges={edges} 
          onSave={handleSave} 
        />
      </div>
    </div>
  )
}
