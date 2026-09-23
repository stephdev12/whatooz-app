'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Canvas } from '@/components/automations/builder/canvas'
import { BuilderNode, BuilderEdge } from '@/components/automations/builder/types'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'

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
        setAutomationName(data.name)
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
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
      const firstEdge = updatedEdges.find(e => e.source === triggerNode?.id)
      const actionNode = updatedNodes.find(n => n.id === firstEdge?.target && n.type === 'actionNode')

      if (triggerNode?.data) {
        if (triggerNode.data.triggerType === 'keyword') {
          trigger_type = 'keyword'
          trigger_value = triggerNode.data.triggerValue
        } else if (triggerNode.data.triggerType === 'first_message') {
          trigger_type = 'first_message'
        } else if (triggerNode.data.triggerType === 'flow_completed') {
          trigger_type = 'flow_completed'
          trigger_value = triggerNode.data.triggerValue || null
        }
      }

      if (actionNode?.data) {
        if (actionNode.data.actionType === 'send_template') {
          action_type = 'send_template'
          action_payload = { 
            template_name: actionNode.data.templateId, // Backend uses this name or ID
            language_code: actionNode.data.actionLanguage || 'fr' 
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
        
        if (data) {
          router.replace(`/dashboard/automations/builder/${data.id}`)
        }
      } else {
        await supabase
          .from('automations')
          .update({
            name: automationName,
            nodes: updatedNodes,
            edges: updatedEdges,
            trigger_type,
            trigger_value,
            action_type,
            action_payload,
          })
          .eq('id', automationId)
      }
    } catch (err) {
      console.error(err)
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
