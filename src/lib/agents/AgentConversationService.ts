import { supabaseAdmin } from '@/lib/supabase/admin';

export interface ConversationState {
  id: string;
  conversation_id: string;
  agent_id: string;
  summary: string | null;
  important_facts: any[];
  current_intent: string | null;
  current_product: any | null;
  current_order_id: string | null;
  last_tool_calls: any[];
  updated_at: string;
}

export class AgentConversationService {
  static async getState(conversationId: string, agentId: string): Promise<ConversationState> {
    const supabase = supabaseAdmin;
    
    // Attempt to fetch
    const { data, error } = await supabase
      .from('agent_conversation_state')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('agent_id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        // Create initial state
        const { data: newState, error: createError } = await supabase
          .from('agent_conversation_state')
          .insert({
            conversation_id: conversationId,
            agent_id: agentId,
            important_facts: [],
            last_tool_calls: []
          })
          .select()
          .single();
          
        if (createError) throw createError;
        return newState as ConversationState;
      }
      throw error;
    }

    return data as ConversationState;
  }

  static async updateState(conversationId: string, agentId: string, updates: Partial<ConversationState>): Promise<void> {
    const supabase = supabaseAdmin;
    const { error } = await supabase
      .from('agent_conversation_state')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('agent_id', agentId);

    if (error) throw error;
  }

  static async getRecentMessages(conversationId: string, limit: number = 10): Promise<{ role: string, content: string }[]> {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('messages')
      .select('direction, content_text')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AgentConversationService] Failed to fetch recent messages:', error);
      return [];
    }

    // Convert to AI SDK format (oldest first)
    const reversed = (data || []).reverse();
    return reversed.map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content_text || '[Contenu multimédia ou non pris en charge]'
    }));
  }

  static async logToolCall(agentId: string, conversationId: string, toolName: string, args: any, result: any, status: 'PENDING'|'SUCCESS'|'ERROR', durationMs: number): Promise<void> {
    const supabase = supabaseAdmin;
    await supabase.from('agent_tool_calls').insert({
      agent_id: agentId,
      conversation_id: conversationId,
      tool_name: toolName,
      arguments: args,
      result: result,
      status: status,
      duration_ms: durationMs
    });
  }
}
