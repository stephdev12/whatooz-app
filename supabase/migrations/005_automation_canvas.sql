-- ============================================================
-- Migration 005: Automation Engine Canvas
-- ============================================================

-- Add new columns for React Flow nodes and edges
ALTER TABLE automations
ADD COLUMN IF NOT EXISTS nodes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS edges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Let's also make sure we can distinguish if an automation is legacy or canvas-based (if needed)
-- We'll assume if nodes is empty, it might be legacy or just an empty canvas.

-- Ensure RLS is properly set on automations (multi-tenant check)
DROP POLICY IF EXISTS "automations_all" ON automations;
CREATE POLICY "automations_access" ON automations 
FOR ALL USING (
  organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
);


