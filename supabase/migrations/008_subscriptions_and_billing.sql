-- ============================================================
-- Migration 008: Subscriptions and Plans (Billing)
-- ============================================================

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,  
  price_fcfa INTEGER NOT NULL,
  max_agents INTEGER NOT NULL,
  max_automations INTEGER NOT NULL,
  max_messages_per_month INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Plans
INSERT INTO plans (name, price_fcfa, max_agents, max_automations, max_messages_per_month)
VALUES 
  ('Pro', 15000, 3, 5, 5000),
  ('Entreprise', 45000, 10, 20, 50000)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_select_all" ON plans;
CREATE POLICY "plans_select_all" ON plans FOR SELECT USING (true); -- Publicly viewable plans

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_access" ON subscriptions;
CREATE POLICY "subscriptions_access" ON subscriptions FOR ALL USING (
  organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
);

-- FUNCTION to handle new organization subscription
CREATE OR REPLACE FUNCTION handle_new_organization_subscription() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (organization_id, status, trial_ends_at)
  VALUES (NEW.id, 'trialing', NOW() + INTERVAL '1 month');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER on organization creation
DROP TRIGGER IF EXISTS on_organization_created_subscription ON organizations;
CREATE TRIGGER on_organization_created_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION handle_new_organization_subscription();

-- Backfill subscriptions for existing organizations (granting them a 1 month trial from today)
INSERT INTO subscriptions (organization_id, status, trial_ends_at)
SELECT id, 'trialing', NOW() + INTERVAL '1 month'
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM subscriptions)
ON CONFLICT (organization_id) DO NOTHING;
