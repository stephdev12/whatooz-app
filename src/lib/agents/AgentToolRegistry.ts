import { searchProductsTool, getProductTool, calculateNegotiatedPriceTool, sendProductToUserTool, sendCatalogToUserTool } from './tools/productTools';
import { listAvailableAutomationsTool, runAutomationTool } from './tools/automationTools';
import { createOrderTool, createPaymentTool } from './tools/commerceTools';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context: AgentContext) => Promise<any>;
}

export interface AgentContext {
  agentId: string;
  organizationId: string;
  conversationId: string;
  contactId?: string;
  customerPhone?: string;
}

export class AgentToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  register(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  getPermittedTools(permittedToolNames: string[]): AgentTool[] {
    return permittedToolNames
      .map(name => this.tools.get(name))
      .filter((t): t is AgentTool => t !== undefined);
  }

  async executeTool(name: string, args: any, context: AgentContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    try {
      return await tool.execute(args, context);
    } catch (error: any) {
      console.error(`Error executing tool ${name}:`, error);
      return { error: error.message || 'Unknown error during tool execution' };
    }
  }
}

// Global registry instance
export const toolRegistry = new AgentToolRegistry();

// Phase 2: Product Intelligence
toolRegistry.register(searchProductsTool);
toolRegistry.register(getProductTool);
toolRegistry.register(calculateNegotiatedPriceTool);
toolRegistry.register(sendProductToUserTool);
toolRegistry.register(sendCatalogToUserTool);

// Phase 3: Automation Tools
toolRegistry.register(listAvailableAutomationsTool);
toolRegistry.register(runAutomationTool);

// Phase 4: Commerce Tools
toolRegistry.register(createOrderTool);
toolRegistry.register(createPaymentTool);

// Phase 5: Handoff
toolRegistry.register({
  name: 'handoff_to_human',
  description: 'Transfer the conversation to a human team member. Use this when the customer requests to speak to a human or when you encounter an issue you cannot resolve.',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: 'The reason for handing off the conversation.'
      },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high'],
        description: 'The priority of the handoff.'
      }
    },
    required: ['reason']
  },
  execute: async (args, context) => {
    // Phase 5 implementation: Pause AI, assign human
    return { success: true, message: 'Conversation handed off to human.' };
  }
});
