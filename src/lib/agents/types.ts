export interface AgentConfig {
  identity: {
    name: string;
    role: string;
    description: string;
  };

  personality: {
    tone: string;
    language: string;
    style: string;
    greetingStyle: string;
  };

  business: {
    objectives: string[];
    companyDescription?: string;
    policies?: string[];
  };

  sales: {
    canRecommendProducts: boolean;
    canDiscussPrices: boolean;
    canNegotiatePrices: boolean;
    maxDiscount?: number;
    canCreateOrders: boolean;
    canCreatePayments: boolean;
  };

  escalation: {
    enabled: boolean;
    conditions: string[];
    target?: string;
  };

  tools: {
    products: boolean;
    catalog: boolean;
    orders: boolean;
    payments: boolean;
    automations: boolean;
    handoff: boolean;
  };

  assignment: {
    mode: "global" | "assigned";
  };
}

export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface AIAgent {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: AgentStatus;
  model: string;
  language: string;
  agent_config: AgentConfig;
  system_prompt: string | null;
  active_prompt_version_id: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentPromptVersion {
  id: string;
  agent_id: string;
  version: number;
  system_prompt: string;
  config_snapshot: AgentConfig;
  created_by: string | null;
  created_at: string;
}
