-- Ajouter whatsapp_number aux profils
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Table pour les codes de vérification OTP
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
-- Seul le serveur (via service_role) peut lire/écrire
CREATE POLICY "Service role can do all on verification_codes" ON verification_codes FOR ALL USING (auth.role() = 'service_role');
