-- 019_wallet_centralise.sql

-- ============================================================
-- 1. DROP UNWANTED TABLES (SASPAY PER ORG)
-- ============================================================
-- The PRD specifies Whatooz uses a SINGLE SasPay Master account.
-- Organizations do not have their own SasPay credentials.
DROP TABLE IF EXISTS saspay_credentials;

-- ============================================================
-- 2. UPDATE WALLETS TABLE
-- ============================================================
-- Rename balance to available_balance and add pending_balance
ALTER TABLE wallets RENAME COLUMN balance TO available_balance;
ALTER TABLE wallets ADD COLUMN pending_balance DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- ============================================================
-- 3. WALLET TRANSACTIONS LEDGER
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- SALE, PAYMENT, WITHDRAWAL, WITHDRAWAL_REVERSED, REFUND, FEE, ADJUSTMENT
  amount DECIMAL(15, 2) NOT NULL,
  direction TEXT NOT NULL, -- CREDIT, DEBIT
  reference_type TEXT,
  reference_id UUID,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  idempotency_key TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_transactions_all" ON wallet_transactions 
  FOR ALL USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE organization_id IN (SELECT get_user_organizations()) OR is_platform_admin()
    )
  );

-- ============================================================
-- 4. WITHDRAWALS
-- ============================================================
-- Create new withdrawals table conforming exactly to PRD
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  provider TEXT NOT NULL DEFAULT 'saspay',
  destination_phone TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REVERSED
  provider_transaction_id TEXT,
  provider_reference TEXT,
  fee DECIMAL(15, 2) DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  failure_reason TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_org ON withdrawals(organization_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals_all" ON withdrawals 
  FOR ALL USING (organization_id IN (SELECT get_user_organizations()) OR is_platform_admin());

-- Drop old wallet_withdrawals table
DROP TABLE IF EXISTS wallet_withdrawals;
