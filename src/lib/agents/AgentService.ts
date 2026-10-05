import { supabaseAdmin } from '@/lib/supabase/admin';
import { AIAgent, AgentConfig, AgentPromptVersion } from "./types";

export class AgentService {
  static async getAgents(organizationId: string): Promise<AIAgent[]> {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AIAgent[];
  }

  static async getAgent(agentId: string): Promise<AIAgent> {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) throw error;
    return data as AIAgent;
  }

  static async createAgent(organizationId: string, name: string, description: string | null, config: AgentConfig): Promise<AIAgent> {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        organization_id: organizationId,
        name,
        description,
        agent_config: config,
        status: 'DRAFT'
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIAgent;
  }

  static async updateAgentConfig(agentId: string, config: AgentConfig): Promise<AIAgent> {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        agent_config: config,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data as AIAgent;
  }

  static async savePromptVersion(agentId: string, systemPrompt: string, config: AgentConfig): Promise<AgentPromptVersion> {
    const supabase = supabaseAdmin;
    
    // Get the latest version
    const { data: latest } = await supabase
      .from('agent_prompt_versions')
      .select('version')
      .eq('agent_id', agentId)
      .order('version', { ascending: false })
      .limit(1)
      .single();
      
    const nextVersion = latest ? latest.version + 1 : 1;

    // Create the new version
    const { data: versionData, error: versionError } = await supabase
      .from('agent_prompt_versions')
      .insert({
        agent_id: agentId,
        version: nextVersion,
        system_prompt: systemPrompt,
        config_snapshot: config
      })
      .select()
      .single();

    if (versionError) throw versionError;

    // Update the agent to point to this new version
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        system_prompt: systemPrompt,
        active_prompt_version_id: versionData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (updateError) throw updateError;

    return versionData as AgentPromptVersion;
  }
}
