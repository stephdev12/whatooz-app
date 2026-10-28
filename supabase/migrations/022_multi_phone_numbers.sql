-- ============================================================
-- Migration 022: Multi-Phone Numbers & Modern Inbox Schema (Idempotent & Safe)
-- Supports multiple WhatsApp phone numbers per organization,
-- phone-specific conversation routing, contextual message replies,
-- response status tracking, and automation routing.
-- ============================================================

-- 1. WHATSAPP_CONFIG: Multi-numbers support
ALTER TABLE whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_organization_id_key;
ALTER TABLE whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_phone_number_id_key;
ALTER TABLE whatsapp_config ADD CONSTRAINT whatsapp_config_phone_number_id_key UNIQUE (phone_number_id);

ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS phone_label TEXT DEFAULT 'Principal';
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Safe dynamic execution for existing rows update (avoids parse-time 42703 column does not exist error)
DO $$
BEGIN
    EXECUTE 'UPDATE whatsapp_config SET is_default = true WHERE is_default IS NULL';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 2. CONVERSATIONS: Multi-number & response tracking
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS phone_number_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS has_replied BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_org_phone ON conversations(organization_id, phone_number_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phone_number_id ON conversations(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_conversations_has_replied ON conversations(has_replied);

-- Safe dynamic update for existing conversations
DO $$
BEGIN
    EXECUTE '
        UPDATE conversations c
        SET phone_number_id = wc.phone_number_id
        FROM whatsapp_config wc
        WHERE c.organization_id = wc.organization_id
          AND c.phone_number_id IS NULL
    ';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. MESSAGES: Multi-number & Contextual reply (Quote)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS phone_number_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS context_wamid TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS quoted_content JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_duration INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_caption TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_phone_number_id ON messages(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);

-- 4. AUTOMATIONS: Phone number assignment
ALTER TABLE automations ADD COLUMN IF NOT EXISTS phone_number_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_automations_phone_number_id ON automations(phone_number_id);
