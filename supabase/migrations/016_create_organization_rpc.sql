-- ============================================================
-- Migration 016: Create Organization RPC
-- ============================================================

-- Function to create an organization and assign the creator as OWNER
CREATE OR REPLACE FUNCTION create_organization(org_name TEXT, org_slug TEXT)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- 1. Insert into organizations
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO v_org_id;

  -- 2. Insert the current user as OWNER
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'OWNER');

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
