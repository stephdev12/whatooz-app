import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/whatsapp/encryption'
import { executeActionNode, executeAutomationWorkflow } from '@/lib/automations/workflow-engine'
import { BuilderNode, BuilderEdge, WorkflowExecutionContext } from '@/components/automations/builder/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/whatsapp/automations/test
 * Test execution of an entire workflow DAG or a single action node.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID requis' }, { status: 400 })
    }

    const body = await request.json()
    const {
      nodes = [],
      edges = [],
      singleNode,
      testContact = { name: 'Client Test', phone: '22501020304' },
      testMessage = { text: 'Test automation' },
    } = body

    // Fetch WhatsApp config if available for sending WhatsApp messages
    const { data: userConfig } = await supabaseAdmin
      .from('whatsapp_config')
      .select('access_token_encrypted, phone_number_id, waba_id')
      .eq('organization_id', organizationId)
      .maybeSingle()

    const accessToken = userConfig?.access_token_encrypted
      ? decrypt(userConfig.access_token_encrypted)
      : ''
    const phoneNumberId = userConfig?.phone_number_id || ''
    const wabaId = userConfig?.waba_id || ''

    const context: WorkflowExecutionContext = {
      organizationId,
      automationId: 'test-execution',
      contact: {
        id: 'test-contact',
        name: testContact.name || 'Client Test',
        phone: testContact.phone || '22501020304',
        tags: ['Test'],
      },
      message: {
        id: 'test-msg-id',
        text: testMessage.text || 'Test message',
      },
      flowResponse: {
        nom: testContact.name || 'Client Test',
        phone: testContact.phone || '22501020304',
        email: 'test@whatooz.com',
        montant: '2500',
        date: new Date().toISOString(),
      },
      order: {
        id: 'CMD-TEST-101',
        total: 2500,
        total_amount: 2500,
      },
      variables: {},
      steps: {},
      logs: [],
    }

    const config = {
      accessToken,
      phoneNumberId,
      wabaId,
    }

    // 1. Single Node Test
    if (singleNode) {
      try {
        const output = await executeActionNode(singleNode as BuilderNode, context, config)
        return NextResponse.json({
          success: true,
          mode: 'single_node',
          nodeId: singleNode.id,
          output,
        })
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          mode: 'single_node',
          nodeId: singleNode.id,
          error: err.message || 'Erreur lors du test du nœud',
        })
      }
    }

    // 2. Full Workflow Test
    const mockAutomation = {
      id: 'test-auto',
      name: 'Test de Workflow',
      nodes: nodes as BuilderNode[],
      edges: edges as BuilderEdge[],
    }

    const result = await executeAutomationWorkflow(mockAutomation, context, config)

    const hasFailed = result.logs.some((l) => l.status === 'failed')

    return NextResponse.json({
      success: !hasFailed,
      logs: result.logs,
      steps: result.steps,
      variables: result.variables,
    })
  } catch (error: any) {
    console.error('[Automation Test API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne lors de l’exécution du test' },
      { status: 500 }
    )
  }
}
