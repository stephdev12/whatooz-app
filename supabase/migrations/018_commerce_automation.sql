-- 018_commerce_automation.sql

-- ============================================================
-- 1. UPDATE META CATALOGS
-- ============================================================
ALTER TABLE meta_catalogs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- active, inactive, error
ALTER TABLE meta_catalogs ADD COLUMN IF NOT EXISTS waba_id TEXT;

-- ============================================================
-- 2. UPDATE ORDERS FOR COMMERCE AUTOMATION
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- We keep total_amount instead of renaming it to total to preserve existing frontend code.

-- ============================================================
-- 3. PAYMENT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'saspay',
  provider_transaction_id TEXT,
  payment_link TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed, expired
  customer_phone TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_org ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON payment_transactions(provider_transaction_id);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_transactions_all" ON payment_transactions 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());

-- ============================================================
-- 4. UPDATE AUTOMATION BUILDER ACTIONS
-- ============================================================
-- Event bus table for commerce events
CREATE TABLE IF NOT EXISTS commerce_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- PRODUCT_SELECTED, ORDER_CREATED, PAYMENT_PAID...
  customer_phone TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
  product_retailer_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_events_org ON commerce_events(organization_id);

ALTER TABLE commerce_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commerce_events_all" ON commerce_events 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());
