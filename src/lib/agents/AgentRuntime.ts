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

export interface ModelCandidate {
  provider: string;
  modelName: string;
  model: any;
}

export class AgentRuntime {
  static getModelCandidates(modelString: string, preferredProvider?: string): ModelCandidate[] {
    const isAdvanced = (modelString || '').toUpperCase() === 'ADVANCED';
    const isFast = (modelString || '').toUpperCase() === 'FAST';
    const provider = (preferredProvider || '').toLowerCase();
    const candidates: ModelCandidate[] = [];

    // Helper: OpenRouter candidates
    const addOpenRouterCandidates = (selectedModel?: string) => {
      if (!process.env.OPENROUTER_API_KEY) return;
      
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      let primary = selectedModel;
      if (!primary || ['FAST', 'BALANCED', 'ADVANCED'].includes(primary.toUpperCase())) {
        if (isAdvanced) {
          primary = process.env.OPENROUTER_MODEL_ADVANCED || 'anthropic/claude-3.5-sonnet';
        } else if (isFast) {
          primary = process.env.OPENROUTER_MODEL_FAST || 'google/gemini-flash-1.5';
        } else {
          primary = process.env.OPENROUTER_MODEL_BALANCED || 'openai/gpt-4o-mini';
        }
      }

      candidates.push({
        provider: 'openrouter',
        modelName: primary,
        model: openrouter.chat(primary)
      });
    };

    // Helper: OpenAI candidates
    const addOpenAICandidates = () => {
      if (!process.env.OPENAI_API_KEY) return;
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const primary = isAdvanced ? 'gpt-4o' : 'gpt-4o-mini';
      candidates.push({
        provider: 'openai',
        modelName: primary,
        model: openai(primary)
      });
      if (isAdvanced) {
        candidates.push({
          provider: 'openai',
          modelName: 'gpt-4o-mini',
          model: openai('gpt-4o-mini')
        });
      }
    };

    // Helper: Google Gemini candidates
    const addGoogleCandidates = () => {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) return;
      const google = createGoogleGenerativeAI({ apiKey });
      const primary = isAdvanced ? 'gemini-3.8-pro' : 'gemini-3.8-flash';
      candidates.push({
        provider: 'google',
        modelName: primary,
        model: google(primary)
      });
      if (isAdvanced) {
        candidates.push({
          provider: 'google',
          modelName: 'gemini-3.8-flash',
          model: google('gemini-3.8-flash')
        });
      }
    };

    // Helper: Anthropic candidates
    const addAnthropicCandidates = () => {
      if (!process.env.ANTHROPIC_API_KEY) return;
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const primary = isAdvanced ? 'claude-3-5-sonnet-latest' : 'claude-3-5-haiku-latest';
      candidates.push({
        provider: 'anthropic',
        modelName: primary,
        model: anthropic(primary)
      });
    };

    // Build the prioritized candidate fallback chain
    if (provider === 'openrouter') {
      addOpenRouterCandidates(modelString);
      addOpenAICandidates();
      addAnthropicCandidates();
      addGoogleCandidates();
    } else if (provider === 'openai') {
      addOpenAICandidates();
      addAnthropicCandidates();
      addGoogleCandidates();
      addOpenRouterCandidates();
    } else if (provider === 'anthropic') {
      addAnthropicCandidates();
      addOpenAICandidates();
      addGoogleCandidates();
      addOpenRouterCandidates();
    } else if (provider === 'google') {
      addGoogleCandidates();
      addOpenAICandidates();
      addAnthropicCandidates();
      addOpenRouterCandidates();
    } else {
      // Default fallback sequence
      addOpenAICandidates();
      addAnthropicCandidates();
      addGoogleCandidates();
      addOpenRouterCandidates(modelString);
    }

    return candidates;
  }

  static getModelProvider(modelString: string, preferredProvider?: string) {
    const candidates = this.getModelCandidates(modelString, preferredProvider);
    if (candidates.length > 0) return candidates[0].model;
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
    
    // We fetch recent messages for conversation context
    const previousMessages = await AgentConversationService.getRecentMessages(conversationId, 10);
    const messages: any[] = [
      ...previousMessages,
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

    // 4. Initialize candidate models with fallback
    const preferredProvider = (agent.agent_config as any)?.provider;
    const customModel = (agent.agent_config as any)?.custom_model;
    const modelLevel = customModel || (agent.agent_config as any)?.model || agent.model;
    const candidates = this.getModelCandidates(modelLevel, preferredProvider);

    if (candidates.length === 0) {
      console.error("[AgentRuntime] No available AI model providers configured.");
      return null;
    }

    // 5. Try candidate models in sequence with automatic fallback
    let lastError: any = null;
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      console.log(`[AgentRuntime] Attempting execution with candidate [${candidate.provider}:${candidate.modelName}] (${i + 1}/${candidates.length})`);

      try {
        const { text, usage, steps } = await generateText({
          model: candidate.model,
          messages: messages,
          system: (agent.agent_config as any)?.system_prompt || agent.system_prompt || '',
          tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
          stopWhen: stepCountIs(MAX_TOOL_CALLS_PER_TURN),
          maxRetries: 0, // Fallback quickly if a provider fails without waiting for built-in retries
          onStepFinish: (event: any) => {
            console.log(`[AgentRuntime] Step finished (${candidate.modelName}). Text: "${event.text?.substring(0, 100) || '(none)'}". Tool calls: ${event.toolCalls?.length || 0}. Finish reason: ${event.finishReason}`);
          },
        });

        // Record usage
        await supabase.from('ai_usage').insert({
          organization_id: organizationId,
          agent_id: agentId,
          conversation_id: conversationId,
          model: `${candidate.provider}:${candidate.modelName}`,
          tool_calls: steps.length - 1,
          input_tokens: (usage as any).promptTokens || 0,
          output_tokens: (usage as any).completionTokens || 0
        });

        return text;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AgentRuntime] Candidate [${candidate.provider}:${candidate.modelName}] failed: ${err.message}. Trying next fallback candidate...`);
      }
    }

    console.error("[AgentRuntime] All model candidates failed. Last error:", lastError);
    return null;
  }
}
