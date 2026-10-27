-- Phase 5: WhatsApp campaign builder (audience, eligibility, schedule metadata).
-- Dispatch workers and delivery reporting are Phase 6 — do not invent sent/delivered here.

-- Minimal auditable WhatsApp communication consent / opt-out (per org + phone).
CREATE TABLE IF NOT EXISTS whatsapp_communication_consent (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    phone_normalized VARCHAR(40) NOT NULL,
    purpose VARCHAR(60) NOT NULL DEFAULT 'marketing', -- marketing | utility | transactional
    status VARCHAR(40) NOT NULL DEFAULT 'unknown', -- unknown | opted_in | opted_out
    source VARCHAR(80) NOT NULL DEFAULT '', -- manual | import | webhook_stop | booking | lead_form
    consented_at TIMESTAMPTZ NULL,
    withdrawn_at TIMESTAMPTZ NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wa_consent_org_phone_purpose UNIQUE (organisation_id, phone_normalized, purpose)
);

CREATE INDEX IF NOT EXISTS idx_wa_consent_org_status
    ON whatsapp_communication_consent (organisation_id, purpose, status);

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    whatsapp_connection_id BIGINT NOT NULL REFERENCES whatsapp_connections(id) ON DELETE RESTRICT,
    message_template_id BIGINT NULL REFERENCES message_templates(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(60) NOT NULL DEFAULT 'marketing',
    audience_configuration TEXT NOT NULL DEFAULT '{}',
    variable_mapping TEXT NOT NULL DEFAULT '[]',
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    -- draft | validating | ready | scheduled | cancelled | dispatching | completed | completed_with_errors | failed
    scheduled_at TIMESTAMPTZ NULL,
    timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    selected_count INT NOT NULL DEFAULT 0,
    eligible_count INT NOT NULL DEFAULT 0,
    excluded_count INT NOT NULL DEFAULT 0,
    validation_summary TEXT NOT NULL DEFAULT '',
    validated_at TIMESTAMPTZ NULL,
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_campaigns_org_status
    ON whatsapp_campaigns (organisation_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_campaigns_org_scheduled
    ON whatsapp_campaigns (organisation_id, scheduled_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    campaign_id BIGINT NOT NULL REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
    source_type VARCHAR(40) NOT NULL DEFAULT '', -- client | lead | conversation | event
    source_id BIGINT NULL,
    customer_id BIGINT NULL,
    enquiry_id BIGINT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    phone_normalized VARCHAR(40) NOT NULL,
    eligibility_status VARCHAR(40) NOT NULL DEFAULT 'pending', -- eligible | excluded
    exclusion_reason VARCHAR(200) NOT NULL DEFAULT '',
    resolved_variables_json TEXT NOT NULL DEFAULT '{}',
    provider_message_id VARCHAR(160) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_campaign_recipients_phone
    ON whatsapp_campaign_recipients (campaign_id, phone_normalized)
    WHERE phone_normalized IS NOT NULL AND btrim(phone_normalized) <> '';

CREATE INDEX IF NOT EXISTS idx_wa_campaign_recipients_campaign
    ON whatsapp_campaign_recipients (campaign_id, eligibility_status);

CREATE INDEX IF NOT EXISTS idx_wa_campaign_recipients_org
    ON whatsapp_campaign_recipients (organisation_id, campaign_id);

COMMENT ON TABLE whatsapp_campaigns IS 'Phase 5 campaign definitions + schedule metadata; dispatch is Phase 6.';
COMMENT ON TABLE whatsapp_campaign_recipients IS 'Stable campaign membership and eligibility audit; not proof of send.';
COMMENT ON TABLE whatsapp_communication_consent IS 'Explicit WhatsApp consent/opt-out; phone alone is not consent.';
