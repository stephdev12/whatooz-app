import { Node, Edge } from '@xyflow/react'

export type BuilderNodeType = 'triggerNode' | 'actionNode' | 'conditionNode' | 'delayNode'

export interface BaseNodeData extends Record<string, unknown> {
  label: string
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: 'keyword' | 'new_contact' | 'menu_click' | 'order_created' | 'payment_confirmed' | 'payment_failed' | 'api_request'
  triggerValue?: string
  webhookConfig?: {
    expectedFields?: string[] // e.g. ['phone', 'code_2fa']
  }
}

export interface ActionNodeData extends BaseNodeData {
  actionType: 'send_message' | 'send_template' | 'send_flow' | 'send_product' | 'send_product_list' | 'send_catalog' | 'create_saspay_payment'
  actionPayload?: {
    text?: string
    templateName?: string
    flowId?: string
    catalogId?: string
    productRetailerId?: string
    sections?: any[]
    thumbnailProductRetailerId?: string
    templateVariablesMapping?: Record<string, string> // e.g. { '1': 'code_2fa' }
  }
}

export interface ConditionNodeData extends BaseNodeData {
  conditionType: 'contains' | 'equals' | 'not_equals' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'empty'
  conditionValue: string
}

export interface DelayNodeData extends BaseNodeData {
  delayMinutes: number
}

export type BuilderNode = Node<BaseNodeData, BuilderNodeType>
export type BuilderEdge = Edge
