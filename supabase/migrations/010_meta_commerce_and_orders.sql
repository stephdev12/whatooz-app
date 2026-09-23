-- 010_meta_commerce_and_orders.sql

-- ============================================================
-- 1. CLEANUP OLD COMMERCE TABLES
-- ============================================================
-- Drop order_items and products from 006_commerce_and_payments.sql
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS products;

-- ============================================================
-- 2. META COMMERCE CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS meta_catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meta_catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  vertical TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, meta_catalog_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_catalogs_org ON meta_catalogs(organization_id);

ALTER TABLE meta_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_catalogs_all" ON meta_catalogs 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());

CREATE TABLE IF NOT EXISTS meta_catalog_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  catalog_id UUID NOT NULL REFERENCES meta_catalogs(id) ON DELETE CASCADE,
  meta_product_id TEXT NOT NULL,
  retailer_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  currency TEXT,
  image_url TEXT,
  availability TEXT,
  url TEXT,
  raw_data JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(catalog_id, retailer_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_catalog_products_catalog ON meta_catalog_products(catalog_id);
CREATE INDEX IF NOT EXISTS idx_meta_catalog_products_retailer ON meta_catalog_products(retailer_id);

ALTER TABLE meta_catalog_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_catalog_products_all" ON meta_catalog_products 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());


-- ============================================================
-- 3. META WEBHOOK EVENTS (RAW STORAGE)
-- ============================================================
CREATE TABLE IF NOT EXISTS meta_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'meta',
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received', -- received, processed, failed
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_org ON meta_webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_status ON meta_webhook_events(status);

ALTER TABLE meta_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_webhook_events_all" ON meta_webhook_events 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());


-- ============================================================
-- 4. ORDERS & ORDER ITEMS (RE-CREATE/ALTER)
-- ============================================================
-- Add new fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catalog_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING'; -- PENDING, PAID, FAILED, EXPIRED

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  retailer_id TEXT NOT NULL,
  meta_product_id UUID REFERENCES meta_catalog_products(id) ON DELETE SET NULL, -- Optional link to cache
  name TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  currency TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_all" ON order_items 
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders WHERE organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
    )
  );

-- ============================================================
-- 5. SASPAY CREDENTIALS & WALLET
-- ============================================================
-- Store SasPay integration credentials per organization
CREATE TABLE IF NOT EXISTS saspay_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  api_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  merchant_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saspay_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saspay_credentials_all" ON saspay_credentials 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());

-- Virtual Wallet for Organizations to track SasPay balances locally
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_all" ON wallets 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());

-- Withdrawals from the Wallet
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, REJECTED
  withdrawal_method TEXT, -- e.g. Mobile Money, Bank Transfer
  method_details JSONB,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_withdrawals_all" ON wallet_withdrawals 
  FOR ALL USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
    )
  );
