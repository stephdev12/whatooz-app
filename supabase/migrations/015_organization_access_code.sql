-- ============================================================
-- Migration 015: Organization Access Codes
-- ============================================================

-- Add access_code to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Generate access_code for existing organizations
UPDATE organizations SET access_code = upper(substring(md5(random()::text) from 1 for 8)) WHERE access_code IS NULL;

-- Trigger to auto-generate access_code on new organizations
CREATE OR REPLACE FUNCTION generate_organization_access_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_code IS NULL THEN
    NEW.access_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_organization_before_insert ON organizations;
CREATE TRIGGER on_organization_before_insert
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION generate_organization_access_code();

-- RPC function to join an organization by code
CREATE OR REPLACE FUNCTION join_organization_by_code(p_access_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Find the organization
  SELECT id INTO v_org_id FROM organizations WHERE access_code = p_access_code;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Code d''accès invalide ou expiré';
  END IF;

  -- Insert the member (default role AGENT or VIEWER)
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'AGENT')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
