import { Node, Edge } from '@xyflow/react'

export type BuilderNodeType = 'triggerNode' | 'actionNode' | 'conditionNode' | 'delayNode'

export type TriggerType =
  | 'keyword'
  | 'first_message'
  | 'new_contact'
  | 'menu_click'
  | 'flow_completed'
  | 'order_created'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'api_request'

export type ActionType =
  | 'send_message'
  | 'send_template'
  | 'send_flow'
  | 'send_product'
  | 'send_product_list'
  | 'send_product_carousel'
  | 'send_catalog'
  | 'create_saspay_payment'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_agent'
  | 'ai_agent'
  | 'http_request'

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'exists'
  | 'empty'
  | 'not_empty'

export interface BaseNodeData extends Record<string, unknown> {
  label: string
  executionStatus?: 'idle' | 'running' | 'success' | 'error'
  executionError?: string
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: TriggerType
  triggerValue?: string
  webhookConfig?: {
    expectedFields?: string[] // e.g. ['phone', 'name', 'amount']
  }
}

export interface ActionNodeData extends BaseNodeData {
  actionType: ActionType
  templateId?: string
  templateName?: string
  actionLanguage?: string
  flowId?: string
  buttonText?: string
  ctaMessage?: string
  catalogMessage?: string
  paymentMessage?: string
  paymentAmount?: number | string
  tagName?: string
  assignedUserId?: string
  agentPrompt?: string
  actionPayload?: {
    text?: string
    templateName?: string
    templateId?: string
    languageCode?: string
    headerImageUrl?: string
    flowId?: string
    flowCta?: string
    bodyText?: string
    catalogId?: string
    productRetailerId?: string
    productRetailerIds?: string[] | string
    sections?: any[]
    thumbnailProductRetailerId?: string
    templateVariablesMapping?: Record<string, string> // e.g. { '1': 'contact.name' }
    amount?: number | string
    tagName?: string
    assignedUserId?: string
    agentPrompt?: string
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    url?: string
    headers?: Record<string, string>
    body?: string
  }
}

export interface ConditionNodeData extends BaseNodeData {
  conditionField?: string // e.g. 'message.text', 'contact.name', 'flow.response.choice'
  conditionType: ConditionOperator
  conditionValue: string
}

export interface DelayNodeData extends BaseNodeData {
  delayMinutes: number
  delaySeconds?: number
}

export type BuilderNode = Node<BaseNodeData, BuilderNodeType>
export type BuilderEdge = Edge

export interface WorkflowExecutionContext {
  organizationId: string
  automationId?: string
  conversationId?: string
  contact: {
    id?: string
    name?: string
    phone: string
    tags?: string[]
  }
  message?: {
    id?: string
    text?: string
    type?: string
  }
  flowResponse?: Record<string, any>
  order?: Record<string, any>
  payment?: Record<string, any>
  variables?: Record<string, any>
  steps: Record<string, any>
  logs: Array<{
    nodeId: string
    nodeType: string
    action: string
    status: 'success' | 'failed' | 'skipped'
    output?: any
    error?: string
    timestamp: string
  }>
}
