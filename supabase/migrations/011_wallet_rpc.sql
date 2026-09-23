-- 011_wallet_rpc.sql

CREATE OR REPLACE FUNCTION increment_wallet_balance(org_id UUID, amount_to_add DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the wallet if it doesn't exist
  INSERT INTO wallets (organization_id, balance)
  VALUES (org_id, amount_to_add)
  ON CONFLICT (organization_id)
  DO UPDATE SET 
    balance = wallets.balance + amount_to_add,
    updated_at = NOW();
END;
$$;
