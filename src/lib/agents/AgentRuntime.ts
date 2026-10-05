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

const agentRouterFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const headers = new Headers(options?.headers || {});
  headers.set('User-Agent', 'claude-cli/0.2.29 (external, cli)');
  headers.set('X-Stainless-Lang', 'js');
  headers.set('X-Stainless-Package-Version', '0.38.0');
  headers.set('X-Stainless-OS', 'Linux');
  headers.set('X-Stainless-Arch', 'x64');
  headers.set('X-Stainless-Runtime', 'node');
  headers.set('X-Stainless-Runtime-Version', 'v20.18.0');

  let response = await fetch(url, { ...options, headers });
  let contentType = response.headers.get('content-type') || '';

  // If Aliyun WAF captcha or HTML is returned, transparently retry via the ps.air-outer.com API mirror
  if (contentType.includes('text/html') && url.toString().includes('agentrouter.org')) {
    const mirrorUrl = url.toString().replace('agentrouter.org', 'ps.air-outer.com');
    console.log(`[AgentRouter] WAF/HTML detected from ${url.toString()}, retrying via mirror ${mirrorUrl}`);
    response = await fetch(mirrorUrl, { ...options, headers });
    contentType = response.headers.get('content-type') || '';
  }

  // Guard against any remaining HTML error pages (e.g. if invalid path or proxy error returns HTML 200/404)
  if (contentType.includes('text/html')) {
    const status = response.status >= 400 ? response.status : 502;
    return new Response(
      JSON.stringify({
        error: {
          message: `AgentRouter returned HTML instead of JSON (Status ${response.status}). URL called: ${url.toString()}. Ensure AGENTROUTER_BASE_URL is 'https://ps.air-outer.com/v1'.`,
          type: 'invalid_response_format',
        }
      }),
      {
        status,
        statusText: 'Bad Gateway',
        headers: { 'content-type': 'application/json; charset=utf-8' }
      }
    );
  }

  // Some AgentRouter endpoints return text/plain with JSON body; normalize to application/json
  if (contentType.includes('text/plain')) {
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-type': 'application/json; charset=utf-8'
      }
    });
  }

  return response;
};

export class AgentRuntime {
  static AGENTROUTER_DEFAULT_MODELS = [
    'claude-opus-4-8',
    'claude-opus-5',
    'gpt-6-astra',
    'deepseek-v4-flash'
  ];

  static getModelCandidates(modelString: string, preferredProvider?: string): ModelCandidate[] {
    const isAdvanced = (modelString || '').toUpperCase() === 'ADVANCED';
    const isFast = (modelString || '').toUpperCase() === 'FAST';
    const provider = (preferredProvider || '').toLowerCase();
    const candidates: ModelCandidate[] = [];

    // Helper: AgentRouter candidates with internal model fallback
    const addAgentRouterCandidates = (selectedModel?: string) => {
      if (!process.env.AGENTROUTER_API_KEY) return;

      // Auto-normalize baseURL: use the direct API gateway mirror ps.air-outer.com to bypass Aliyun WAF captcha
      let rawBaseUrl = (process.env.AGENTROUTER_BASE_URL || 'https://ps.air-outer.com/v1').trim();
      rawBaseUrl = rawBaseUrl.replace('co.agentrouter.org', 'ps.air-outer.com');
      rawBaseUrl = rawBaseUrl.replace('agentrouter.org', 'ps.air-outer.com');
      rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
      if (!rawBaseUrl.endsWith('/v1')) {
        rawBaseUrl = `${rawBaseUrl}/v1`;
      }

      const agentRouter = createOpenAI({
        baseURL: rawBaseUrl,
        apiKey: process.env.AGENTROUTER_API_KEY,
        fetch: agentRouterFetch,
      });

      let primary = selectedModel;
      if (!primary || ['FAST', 'BALANCED', 'ADVANCED'].includes(primary.toUpperCase())) {
        if (isAdvanced) {
          primary = process.env.AGENTROUTER_MODEL_ADVANCED || 'claude-opus-5';
        } else if (isFast) {
          primary = process.env.AGENTROUTER_MODEL_FAST || 'deepseek-v4-flash';
        } else {
          primary = process.env.AGENTROUTER_MODEL_BALANCED || 'claude-opus-4-8';
        }
      }

      // Add primary model first
      candidates.push({
        provider: 'agentrouter',
        modelName: primary,
        model: agentRouter.chat(primary)
      });

      // Add remaining AgentRouter models as sequential fallbacks
      for (const fallbackModel of this.AGENTROUTER_DEFAULT_MODELS) {
        if (fallbackModel !== primary) {
          candidates.push({
            provider: 'agentrouter',
            modelName: fallbackModel,
            model: agentRouter.chat(fallbackModel)
          });
        }
      }
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
    if (provider === 'agentrouter') {
      addAgentRouterCandidates(modelString);
      addGoogleCandidates();
      addOpenAICandidates();
      addAnthropicCandidates();
    } else if (provider === 'openai') {
      addOpenAICandidates();
      addAgentRouterCandidates();
      addGoogleCandidates();
      addAnthropicCandidates();
    } else if (provider === 'anthropic') {
      addAnthropicCandidates();
      addAgentRouterCandidates();
      addOpenAICandidates();
      addGoogleCandidates();
    } else if (provider === 'google') {
      addGoogleCandidates();
      addAgentRouterCandidates();
      addOpenAICandidates();
      addAnthropicCandidates();
    } else {
      // Default: AgentRouter first if key present, else Google / OpenAI
      addAgentRouterCandidates(modelString);
      addGoogleCandidates();
      addOpenAICandidates();
      addAnthropicCandidates();
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
