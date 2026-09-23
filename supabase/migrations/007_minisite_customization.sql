-- 007_minisite_customization.sql

-- 1. ADD VISUAL IDENTITY COLUMNS TO ORGANIZATIONS
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#4f46e5',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. ENABLE PUBLIC READ ACCESS TO ORGANIZATIONS
-- Since the public mini site needs to fetch the organization details by slug
-- We need to ensure anyone can read organizations.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_organizations" ON organizations;
CREATE POLICY "public_read_organizations" ON organizations 
  FOR SELECT USING (true);

-- Ensure the existing policies for updates/deletes remain tight (if they were defined)
-- If no other policies existed for organizations, we should probably ensure owners can update.
-- In our schema, we usually relied on get_user_organizations() for RLS.
DROP POLICY IF EXISTS "orgs_update" ON organizations;
CREATE POLICY "orgs_update" ON organizations 
  FOR UPDATE USING (
    id IN (SELECT get_user_organizations()) OR is_platform_admin()
  );

-- 3. ENABLE PUBLIC READ ACCESS TO PRODUCTS
-- We want the public to be able to see active products on the mini site.
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products 
  FOR SELECT USING (is_active = true);

-- Note: The existing "products_all" policy already covers ALL (including SELECT, INSERT, UPDATE, DELETE) for members.
-- This new policy adds public SELECT for active products.
