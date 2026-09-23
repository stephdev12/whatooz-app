-- ============================================================
-- Migration 003: Multi-tenant Architecture (Organizations)
-- ============================================================

-- 1. PROFILES UPDATE (PLATFORM_ADMIN)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platform_role TEXT DEFAULT 'USER';
-- Role can be 'USER' or 'PLATFORM_ADMIN'

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'AGENT', 'VIEWER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 4. RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND platform_role = 'PLATFORM_ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. TRUNCATE EXISTING BUSINESS DATA (Approved by user to avoid NOT NULL violations)
TRUNCATE TABLE automations CASCADE;
TRUNCATE TABLE flow_responses CASCADE;
TRUNCATE TABLE whatsapp_flows CASCADE;
TRUNCATE TABLE message_templates CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE whatsapp_config CASCADE;

-- 6. ALTER EXISTING TABLES TO USE organization_id INSTEAD OF user_id
-- whatsapp_config
ALTER TABLE whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_user_id_key;
ALTER TABLE whatsapp_config RENAME COLUMN user_id TO organization_id;
ALTER TABLE whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_user_id_fkey;
ALTER TABLE whatsapp_config ADD CONSTRAINT whatsapp_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE whatsapp_config ADD CONSTRAINT whatsapp_config_organization_id_key UNIQUE (organization_id);

-- contacts
ALTER TABLE contacts RENAME COLUMN user_id TO organization_id;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
ALTER TABLE contacts ADD CONSTRAINT contacts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- conversations
ALTER TABLE conversations RENAME COLUMN user_id TO organization_id;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_team_id UUID; -- for later Phase 3
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags TEXT[];

-- messages
ALTER TABLE messages RENAME COLUMN user_id TO organization_id;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- message_templates
ALTER TABLE message_templates RENAME COLUMN user_id TO organization_id;
ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_user_id_fkey;
ALTER TABLE message_templates ADD CONSTRAINT message_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- whatsapp_flows
ALTER TABLE whatsapp_flows RENAME COLUMN user_id TO organization_id;
ALTER TABLE whatsapp_flows DROP CONSTRAINT IF EXISTS whatsapp_flows_user_id_fkey;
ALTER TABLE whatsapp_flows ADD CONSTRAINT whatsapp_flows_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- flow_responses
ALTER TABLE flow_responses RENAME COLUMN user_id TO organization_id;
ALTER TABLE flow_responses DROP CONSTRAINT IF EXISTS flow_responses_user_id_fkey;
ALTER TABLE flow_responses ADD CONSTRAINT flow_responses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- automations
ALTER TABLE automations RENAME COLUMN user_id TO organization_id;
ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_user_id_fkey;
ALTER TABLE automations ADD CONSTRAINT automations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 7. ENABLE RLS AND CREATE NEW POLICIES

-- organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_access" ON organizations;
CREATE POLICY "organizations_access" ON organizations 
  FOR ALL USING (
    id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organization_members_access" ON organization_members;
CREATE POLICY "organization_members_access" ON organization_members 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- whatsapp_config
DROP POLICY IF EXISTS "whatsapp_config_all" ON whatsapp_config;
-- Generally API only, but if needed:
CREATE POLICY "whatsapp_config_all" ON whatsapp_config 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- contacts
DROP POLICY IF EXISTS "contacts_all" ON contacts;
CREATE POLICY "contacts_all" ON contacts 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- conversations
DROP POLICY IF EXISTS "conversations_all" ON conversations;
CREATE POLICY "conversations_all" ON conversations 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- messages
DROP POLICY IF EXISTS "messages_all" ON messages;
CREATE POLICY "messages_all" ON messages 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- message_templates
DROP POLICY IF EXISTS "templates_all" ON message_templates;
CREATE POLICY "templates_all" ON message_templates 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- whatsapp_flows
DROP POLICY IF EXISTS "flows_all" ON whatsapp_flows;
CREATE POLICY "flows_all" ON whatsapp_flows 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- flow_responses
DROP POLICY IF EXISTS "flow_responses_all" ON flow_responses;
CREATE POLICY "flow_responses_all" ON flow_responses 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- automations
DROP POLICY IF EXISTS "automations_all" ON automations;
CREATE POLICY "automations_all" ON automations 
  FOR ALL USING (
    organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- 8. Add Realtime for new tables if needed
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
