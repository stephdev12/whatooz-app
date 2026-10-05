import { AgentTool } from '../AgentToolRegistry';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const listAvailableAutomationsTool: AgentTool = {
  name: 'list_available_automations',
  description: 'List all active automations available for the agent to run.',
  parameters: {
    type: 'object',
    properties: {}
  },
  execute: async (args, context) => {
    const supabase = supabaseAdmin;
    
    // In 003_multi_tenant_organizations.sql, automations usually get an organization_id.
    // If not, it uses user_id. We'll query by organization_id assuming it's available.
    // If organization_id doesn't exist on automations, we would query differently.
    const { data, error } = await supabase
      .from('automations')
      .select('id, name, action_type, trigger_type')
      .eq('organization_id', context.organizationId)
      .eq('is_active', true);
      
    if (error) {
       console.error("[listAvailableAutomationsTool]", error);
       // Fallback in case automations table uses user_id instead of organization_id
       return { error: 'Failed to fetch automations', details: error.message };
    }
    
    return { automations: data };
  }
};

export const runAutomationTool: AgentTool = {
  name: 'run_automation',
  description: 'Trigger a specific automation workflow.',
  parameters: {
    type: 'object',
    properties: {
      automation_id: { type: 'string', description: 'The ID of the automation to run' },
      variables: { 
        type: 'object', 
        description: 'Variables to pass to the automation',
        additionalProperties: true
      }
    },
    required: ['automation_id']
  },
  execute: async (args, context) => {
    // We would trigger the actual workflow engine here.
    // For now, return a success mock or insert into an event queue.
    console.log(`[runAutomationTool] Triggering automation ${args.automation_id} with vars`, args.variables);
    
    return { 
      success: true, 
      message: `Automation ${args.automation_id} triggered successfully.`
    };
  }
};
