import { supabaseAdmin } from '@/lib/supabase/admin'

export class AgentAssignmentResolver {
  static async resolveAgentForConversation(organizationId: string, contactId: string, conversationId: string): Promise<string | null> {
    const supabase = supabaseAdmin;


    // 1. Is conversation assigned to a human? 
    const { data: conv } = await supabase
      .from('conversations')
      .select('assigned_to, ai_agent_id')
      .eq('id', conversationId)
      .single();

    if (conv?.assigned_to) {
      // Human assigned. AI should not intervene unless in a specific hybrid mode.
      return null;
    }

    // 2. Conversation explicitly assigned to an AI agent?
    if (conv?.ai_agent_id) {
      return conv.ai_agent_id;
    }

    // 3. Contact assigned to an agent?
    const { data: contactAssignment } = await supabase
      .from('agent_assignments')
      .select('agent_id')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (contactAssignment) {
      return contactAssignment.agent_id;
    }

    // 4. Global active agent?
    const { data: globalAgent } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE')
      .eq('is_global', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (globalAgent) {
      return globalAgent.id;
    }

    return null; // No AI
  }
}
