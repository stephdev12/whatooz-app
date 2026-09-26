-- ============================================================
-- BROADCAST CAMPAIGNS
-- ============================================================

CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, completed, failed, paused
  scheduled_at TIMESTAMPTZ,
  target_type TEXT NOT NULL DEFAULT 'all', -- all, tags, contacts
  target_tags TEXT[],
  target_contacts UUID[], -- array of contact ids
  message_type TEXT NOT NULL, -- text, template, flow, media
  message_payload JSONB NOT NULL,
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "read": 0, "failed": 0}'::jsonb,
  recurrence TEXT DEFAULT 'once', -- once, daily, weekly, monthly
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_org_id ON broadcast_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_status ON broadcast_campaigns(status);

ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcast_campaigns_org_access" ON broadcast_campaigns;

CREATE POLICY "broadcast_campaigns_org_access" ON broadcast_campaigns
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
