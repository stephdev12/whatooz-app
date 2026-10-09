-- ============================================================
-- Migration 021: Real African Pricing Tiers for Whatooz
-- Plans: Free (0), Starter (5 000), Growth (15 000), Business (35 000)
-- ============================================================

-- 1. Ensure extra columns exist on plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_whatsapp_numbers INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_ai_agents INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ai_budget_fcfa INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- 2. Upsert the official 4 plans into the plans table
INSERT INTO plans (
  code,
  name,
  badge,
  price_fcfa,
  max_agents,
  max_whatsapp_numbers,
  max_ai_agents,
  max_automations,
  ai_budget_fcfa,
  max_messages_per_month,
  features
)
VALUES 
  (
    'free',
    'Free',
    'Découverte',
    0,
    1,
    1,
    1,
    2,
    0,
    1000,
    '{"campaigns": false, "external_integrations": 0, "advanced_analytics": false, "ai_routing": false}'::jsonb
  ),
  (
    'starter',
    'Starter',
    'Indépendants',
    5000,
    2,
    1,
    2,
    10,
    1000,
    5000,
    '{"campaigns": "basic", "external_integrations": 1, "advanced_analytics": false, "ai_routing": false}'::jsonb
  ),
  (
    'growth',
    'Growth',
    'Recommandé',
    15000,
    5,
    3,
    5,
    50,
    3000,
    25000,
    '{"campaigns": "advanced", "external_integrations": 999, "advanced_analytics": true, "ai_routing": false}'::jsonb
  ),
  (
    'business',
    'Business',
    'PME & Équipes',
    35000,
    15,
    10,
    10,
    9999,
    8000,
    100000,
    '{"campaigns": "advanced", "external_integrations": 999, "advanced_analytics": true, "ai_routing": true}'::jsonb
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  badge = EXCLUDED.badge,
  price_fcfa = EXCLUDED.price_fcfa,
  max_agents = EXCLUDED.max_agents,
  max_whatsapp_numbers = EXCLUDED.max_whatsapp_numbers,
  max_ai_agents = EXCLUDED.max_ai_agents,
  max_automations = EXCLUDED.max_automations,
  ai_budget_fcfa = EXCLUDED.ai_budget_fcfa,
  max_messages_per_month = EXCLUDED.max_messages_per_month,
  features = EXCLUDED.features;
