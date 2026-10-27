-- Phase 4: Extend message_templates for Meta WhatsApp Business template sync/create.
-- Reuses existing message_templates + whatsapp_connections. Do not create a duplicate table.

ALTER TABLE message_templates
    ADD COLUMN IF NOT EXISTS whatsapp_connection_id BIGINT NULL REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS language_code VARCHAR(20) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS category VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS header_type VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS components_json TEXT NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS provider_status VARCHAR(60) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS variable_mappings_json TEXT NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS provider_quality_score VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_provider_managed BOOLEAN NOT NULL DEFAULT FALSE;

-- Soft-mark templates removed from Meta without deleting historical rows.
ALTER TABLE message_templates
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_templates_org_connection_provider
    ON message_templates (organisation_id, whatsapp_connection_id, provider_template_id)
    WHERE provider_template_id IS NOT NULL AND btrim(provider_template_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_templates_org_connection_name_lang
    ON message_templates (organisation_id, whatsapp_connection_id, lower(template_name), lower(language_code))
    WHERE channel = 'whatsapp'
      AND template_name IS NOT NULL AND btrim(template_name) <> ''
      AND language_code IS NOT NULL AND btrim(language_code) <> '';

CREATE INDEX IF NOT EXISTS idx_message_templates_org_status
    ON message_templates (organisation_id, channel, status);

CREATE INDEX IF NOT EXISTS idx_message_templates_connection
    ON message_templates (whatsapp_connection_id);

COMMENT ON TABLE message_templates IS 'Org WhatsApp/email templates; WhatsApp rows sync from Meta WABA and never expose tokens.';
