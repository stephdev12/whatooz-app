-- ============================================================
-- Migration 002: WhatsApp Flows & Automations
-- ============================================================

-- 1. WHATSAPP_FLOWS (Meta Native WhatsApp Flows)
CREATE TABLE IF NOT EXISTS whatsapp_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_flow_id TEXT,
  name TEXT NOT NULL,
  categories TEXT[] DEFAULT '{"OTHER"}',
  status TEXT DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, DEPRECATED
  flow_json JSONB NOT NULL DEFAULT '{"version":"6.0","screens":[]}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_flows_user ON whatsapp_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_flows_meta_id ON whatsapp_flows(meta_flow_id);

ALTER TABLE whatsapp_flows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flows_all" ON whatsapp_flows;
CREATE POLICY "flows_all" ON whatsapp_flows FOR ALL USING (auth.uid() = user_id);

-- 2. FLOW_RESPONSES (Responses submitted by users on WhatsApp)
CREATE TABLE IF NOT EXISTS flow_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES whatsapp_flows(id) ON DELETE SET NULL,
  meta_flow_id TEXT,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  response_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_responses_user ON flow_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_responses_phone ON flow_responses(contact_phone);

ALTER TABLE flow_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flow_responses_all" ON flow_responses;
CREATE POLICY "flow_responses_all" ON flow_responses FOR ALL USING (auth.uid() = user_id);

-- 3. AUTOMATIONS (Chatbot scenarios & triggers)
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'keyword', -- 'keyword', 'first_message'
  trigger_value TEXT,                          -- e.g. 'DEVIS', 'MENU', 'RESERVER'
  action_type TEXT NOT NULL,                  -- 'send_flow', 'send_template', 'send_text'
  action_payload JSONB NOT NULL DEFAULT '{}',  -- { flow_id, template_name, language_code, text, header_image_url }
  is_active BOOLEAN DEFAULT true,
  executions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automations_user ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(user_id, trigger_type, is_active);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "automations_all" ON automations;
CREATE POLICY "automations_all" ON automations FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for flow_responses and automations
ALTER PUBLICATION supabase_realtime ADD TABLE flow_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE automations;

-- Optional columns on whatsapp_flows for message customization
ALTER TABLE whatsapp_flows ADD COLUMN IF NOT EXISTS flow_cta TEXT DEFAULT 'Ouvrir le formulaire';
ALTER TABLE whatsapp_flows ADD COLUMN IF NOT EXISTS body_text TEXT DEFAULT 'Veuillez remplir le formulaire ci-dessous :';
ALTER TABLE whatsapp_flows ADD COLUMN IF NOT EXISTS header_text TEXT;
ALTER TABLE whatsapp_flows ADD COLUMN IF NOT EXISTS footer_text TEXT;
