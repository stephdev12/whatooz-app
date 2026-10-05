-- ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED')),
    model TEXT NOT NULL DEFAULT 'Balanced',
    language TEXT DEFAULT 'fr',
    agent_config JSONB NOT NULL DEFAULT '{}',
    system_prompt TEXT,
    active_prompt_version_id UUID,
    is_global BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agent_prompt_versions
CREATE TABLE IF NOT EXISTS agent_prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    system_prompt TEXT NOT NULL,
    config_snapshot JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self-referencing constraint for ai_agents
ALTER TABLE ai_agents ADD CONSTRAINT fk_active_prompt_version 
    FOREIGN KEY (active_prompt_version_id) 
    REFERENCES agent_prompt_versions(id) 
    ON DELETE SET NULL;

-- agent_assignments
CREATE TABLE IF NOT EXISTS agent_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agent_tool_permissions
CREATE TABLE IF NOT EXISTS agent_tool_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    can_execute BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_id, tool_name)
);

-- agent_conversation_state
CREATE TABLE IF NOT EXISTS agent_conversation_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    summary TEXT,
    important_facts JSONB DEFAULT '[]',
    current_intent TEXT,
    current_product JSONB,
    current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    last_tool_calls JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agent_tool_calls
CREATE TABLE IF NOT EXISTS agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    arguments JSONB,
    result JSONB,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'ERROR')),
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ai_usage
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    tool_calls INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attach agent to conversation and orders
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL;

-- RLS policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ai_agents of their org" ON ai_agents FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage ai_agents of their org" ON ai_agents FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Users can view agent_prompt_versions of their org" ON agent_prompt_versions FOR SELECT USING (agent_id IN (SELECT id FROM ai_agents WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can manage agent_prompt_versions of their org" ON agent_prompt_versions FOR ALL USING (agent_id IN (SELECT id FROM ai_agents WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))));

CREATE POLICY "Users can view agent_assignments of their org" ON agent_assignments FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage agent_assignments of their org" ON agent_assignments FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Users can view agent_tool_permissions of their org" ON agent_tool_permissions FOR SELECT USING (agent_id IN (SELECT id FROM ai_agents WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can manage agent_tool_permissions of their org" ON agent_tool_permissions FOR ALL USING (agent_id IN (SELECT id FROM ai_agents WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))));

CREATE POLICY "Users can view agent_conversation_state" ON agent_conversation_state FOR ALL USING (agent_id IN (SELECT id FROM ai_agents WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can view agent_tool_calls" ON agent_tool_calls FOR ALL USING (agent_id IN (SELECT id FROM ai_agents WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can view ai_usage" ON ai_usage FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
