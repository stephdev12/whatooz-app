import { AgentService } from "./AgentService";
import { AgentConversationService } from "./AgentConversationService";
import { toolRegistry } from "./AgentToolRegistry";
import { supabaseAdmin } from '@/lib/supabase/admin';

// Vercel AI SDK
import { generateText, tool as aiTool, jsonSchema } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

const MAX_TOOL_CALLS_PER_TURN = 8;

export class AgentRuntime {
  static getModelProvider(modelString: string) {
    // Map Agent Model to actual provider models
    // E.g. 'Advanced' -> Claude 3.5 Sonnet, 'Balanced' -> GPT-4o-mini, 'Fast' -> Gemini 2.5 Flash
    // We can allow rotation by picking the active one based on env variables or config
    
    if (modelString === 'Advanced' && process.env.ANTHROPIC_API_KEY) {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic('claude-3-5-sonnet-latest');
    }
    
    if (modelString === 'Advanced' && process.env.OPENAI_API_KEY) {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai('gpt-4o');
    }

    if (process.env.GEMINI_API_KEY) {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
      return google(modelString === 'Advanced' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');
    }

    // Fallback to OpenAI if Gemini is not present but OpenAI is
    if (process.env.OPENAI_API_KEY) {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai('gpt-4o-mini');
    }

    throw new Error("No available AI providers configured.");
  }

  static async handleMessage(organizationId: string, agentId: string, conversationId: string, contactId: string, userMessage: string) {
    console.log(`[AgentRuntime] Starting run for agent ${agentId} on conv ${conversationId}`);
    
    // 1. Load agent
    const agent = await AgentService.getAgent(agentId);
    if (!agent || agent.status !== 'ACTIVE') {
      console.log(`[AgentRuntime] Agent not found or not active.`);
      return null;
    }

    // 2. Load context
    const state = await AgentConversationService.getState(conversationId, agentId);
    
    // We would normally fetch recent messages here
    const messages: any[] = [
      { role: "user", content: userMessage }
    ];

    // 3. Load permitted tools
    const supabase = supabaseAdmin;
    const { data: permissions } = await supabase
      .from('agent_tool_permissions')
      .select('tool_name')
      .eq('agent_id', agentId)
      .eq('can_execute', true);

    const permittedToolNames = permissions?.map(p => p.tool_name) || [];
    const availableTools = toolRegistry.getPermittedTools(permittedToolNames);
    
    // Convert to Vercel AI SDK tools format
    const aiTools: Record<string, any> = {};
    for (const t of availableTools) {
      aiTools[t.name] = aiTool({
        description: t.description,
        parameters: jsonSchema(t.parameters as any), // Use jsonSchema wrapper
        execute: async (args) => {
          console.log(`[AgentRuntime] Executing tool ${t.name}`, args);
          const startTime = Date.now();
          let result: any;
          let status: 'SUCCESS' | 'ERROR' = 'SUCCESS';
          try {
            result = await t.execute(args, { agentId, organizationId, conversationId, contactId });
          } catch (err: any) {
             result = { error: err.message };
             status = 'ERROR';
          }
          const duration = Date.now() - startTime;
          await AgentConversationService.logToolCall(agentId, conversationId, t.name, args, result, status, duration);
          return result;
        }
      });
    }

    // 4. Initialize model
    const model = this.getModelProvider(agent.model);

    // 5. Generate Text with Tools
    try {
      const { text, usage, steps } = await generateText({
        model: model,
        messages: messages,
        system: agent.system_prompt || '',
        tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
        maxSteps: MAX_TOOL_CALLS_PER_TURN, // Handles the looping automatically
      });

      // Record usage
      await supabase.from('ai_usage').insert({
        organization_id: organizationId,
        agent_id: agentId,
        conversation_id: conversationId,
        model: agent.model,
        tool_calls: steps.length - 1,
        input_tokens: usage.promptTokens,
        output_tokens: usage.completionTokens
      });

      return text;
    } catch (err) {
      console.error("[AgentRuntime] Error during model execution:", err);
      return null;
    }
  }
}
