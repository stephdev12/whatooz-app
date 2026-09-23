-- ============================================================
-- Migration 004: Team Inbox (Agents, Assignment, Routing)
-- ============================================================

-- 1. EXTEND PROFILES RLS POLICY
-- Enable organization members to see each other's profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles 
FOR SELECT USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.user_id
  )
  OR is_platform_admin()
);

-- 2. CREATE A SECURE VIEW FOR ORGANIZATION MEMBERS (Optional but helpful for client-side)
-- By making it SECURITY INVOKER, it applies the RLS policies of the underlying tables.
CREATE OR REPLACE VIEW organization_members_view WITH (security_invoker = true) AS
SELECT 
  om.id as member_id,
  om.organization_id,
  om.user_id,
  om.role,
  om.created_at as joined_at,
  p.full_name,
  p.email,
  p.avatar_url
FROM organization_members om
JOIN profiles p ON om.user_id = p.user_id;

-- 3. ENSURE CONVERSATIONS TABLE HAS PROPER INDEXES FOR INBOX FILTERS
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_user_id ON conversations(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON conversations(organization_id, status);

-- 4. ADD RLS POLICIES FOR INBOX ASSIGNMENT & STATUS UPDATE
-- Ensure agents can update the assigned_user_id and status of conversations within their organization
-- The existing policy "conversations_all" on conversations in 001 was using `auth.uid() = user_id`.
-- Wait, in 003 we renamed user_id to organization_id but we didn't update the RLS policy!
-- Let's fix the Conversations RLS policy properly for multi-tenant:

DROP POLICY IF EXISTS "conversations_all" ON conversations;
CREATE POLICY "conversations_access" ON conversations 
FOR ALL USING (
  organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
);

-- Let's also make sure Messages, Contacts, and other tables have their policies fixed if they weren't in 003.
DROP POLICY IF EXISTS "messages_all" ON messages;
CREATE POLICY "messages_access" ON messages
FOR ALL USING (
  organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
);

DROP POLICY IF EXISTS "contacts_all" ON contacts;
CREATE POLICY "contacts_access" ON contacts
FOR ALL USING (
  organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
);

DROP POLICY IF EXISTS "templates_all" ON message_templates;
CREATE POLICY "templates_access" ON message_templates
FOR ALL USING (
  organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
);

-- End of Migration 004
