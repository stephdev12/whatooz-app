import { AgentService } from "./AgentService";
import { AgentConversationService } from "./AgentConversationService";
import { toolRegistry } from "./AgentToolRegistry";
import { supabaseAdmin } from '@/lib/supabase/admin';

// Vercel AI SDK
import { generateText, tool as aiTool, jsonSchema, stepCountIs } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

const MAX_TOOL_CALLS_PER_TURN = 8;

export class AgentRuntime {
  static getModelProvider(modelString: string, preferredProvider?: string) {
    const isAdvanced = (modelString || '').toUpperCase() === 'ADVANCED';
    const provider = (preferredProvider || '').toLowerCase();

    // 1. If preferred provider is OpenAI and key exists
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(isAdvanced ? 'gpt-4o' : 'gpt-4o-mini');
    }

    // 2. If preferred provider is Anthropic and key exists
    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic(isAdvanced ? 'claude-3-5-sonnet-latest' : 'claude-3-5-haiku-latest');
    }

    // 3. If preferred provider is Google and key exists
    if (provider === 'google' && (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const google = createGoogleGenerativeAI({ apiKey });
      return google(isAdvanced ? 'gemini-3.8-pro' : 'gemini-3.8-flash');
    }

    // Fallbacks if preferred provider is not configured with an API key:
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const google = createGoogleGenerativeAI({ apiKey });
      return google(isAdvanced ? 'gemini-3.8-pro' : 'gemini-3.8-flash');
    }

    if (process.env.OPENAI_API_KEY) {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(isAdvanced ? 'gpt-4o' : 'gpt-4o-mini');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic(isAdvanced ? 'claude-3-5-sonnet-latest' : 'claude-3-5-haiku-latest');
    }

    throw new Error("No available AI providers configured.");
  }

  static async handleMessage(organizationId: string, agentId: string, conversationId: string, contactId: string, userMessage: string, customerPhone?: string) {
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
        execute: async (args: any) => {
          console.log(`[AgentRuntime] Executing tool ${t.name}`, args);
          const startTime = Date.now();
          let result: any;
          let status: 'SUCCESS' | 'ERROR' = 'SUCCESS';
          try {
            result = await t.execute(args, { agentId, organizationId, conversationId, contactId, customerPhone });
          } catch (err: any) {
             result = { error: err.message };
             status = 'ERROR';
          }
          const duration = Date.now() - startTime;
          await AgentConversationService.logToolCall(agentId, conversationId, t.name, args, result, status, duration);
          return result;
        }
      } as any);
    }

    // 4. Initialize model
    const preferredProvider = (agent.agent_config as any)?.provider;
    const modelLevel = (agent.agent_config as any)?.model || agent.model;
    const model = this.getModelProvider(modelLevel, preferredProvider);

    // 5. Generate Text with Tools
    try {
      const { text, usage, steps } = await generateText({
        model: model,
        messages: messages,
        system: (agent.agent_config as any)?.system_prompt || agent.system_prompt || '',
        tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
        stopWhen: stepCountIs(MAX_TOOL_CALLS_PER_TURN),
        onStepFinish: (event: any) => {
          console.log(`[AgentRuntime] Step finished. Text: "${event.text?.substring(0, 100) || '(none)'}". Tool calls: ${event.toolCalls?.length || 0}. Finish reason: ${event.finishReason}`);
        },
      });

      // Record usage
      await supabase.from('ai_usage').insert({
        organization_id: organizationId,
        agent_id: agentId,
        conversation_id: conversationId,
        model: agent.model,
        tool_calls: steps.length - 1,
        input_tokens: (usage as any).promptTokens || 0,
        output_tokens: (usage as any).completionTokens || 0
      });

      return text;
    } catch (err) {
      console.error("[AgentRuntime] Error during model execution:", err);
      return null;
    }
  }
}
