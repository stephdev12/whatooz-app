-- Table: whatsapp_templates
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING, APPROVED, REJECTED, PAUSED, DISABLED
  definition_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Whatooz internal format
  compiled_payload JSONB, -- Final Meta JSON
  meta_template_id TEXT,
  meta_status TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name, language) -- Meta requires unique name + language per WABA
);

-- Table: template_media
CREATE TABLE template_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- IMAGE, VIDEO, DOCUMENT
  storage_path TEXT NOT NULL,
  meta_media_id TEXT,
  meta_media_handle TEXT,
  mime_type TEXT,
  size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_whatsapp_templates_org_id ON whatsapp_templates(organization_id);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_template_media_template_id ON template_media(template_id);

-- Triggers for updated_at
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: whatsapp_templates
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates of their active organization"
  ON whatsapp_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = whatsapp_templates.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates for their active organization"
  ON whatsapp_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = whatsapp_templates.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates of their active organization"
  ON whatsapp_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = whatsapp_templates.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates of their active organization"
  ON whatsapp_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = whatsapp_templates.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- RLS: template_media
ALTER TABLE template_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template media of their active organization"
  ON template_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = template_media.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create template media for their active organization"
  ON template_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = template_media.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update template media of their active organization"
  ON template_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = template_media.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete template media of their active organization"
  ON template_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = template_media.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );
