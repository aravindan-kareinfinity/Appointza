-- Communication integrations (WhatsApp + Email) per organisation.
-- Secrets live only in integration_secrets (encrypted). Do not store tokens in UI or organisation table.

CREATE TABLE IF NOT EXISTS organization_integrations (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    provider VARCHAR(40) NOT NULL,           -- whatsapp | email
    connection_name VARCHAR(160) NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'disconnected', -- connected | expired | disconnected | error | authorization_expired
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_integrations_org_provider_name UNIQUE (organisation_id, provider, connection_name)
);

CREATE INDEX IF NOT EXISTS idx_org_integrations_org
    ON organization_integrations (organisation_id);
CREATE INDEX IF NOT EXISTS idx_org_integrations_provider
    ON organization_integrations (organisation_id, provider);

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id BIGSERIAL PRIMARY KEY,
    integration_id BIGINT NOT NULL REFERENCES organization_integrations(id) ON DELETE CASCADE,
    waba_id VARCHAR(120) NOT NULL DEFAULT '',
    phone_number_id VARCHAR(120) NOT NULL DEFAULT '',
    business_phone VARCHAR(40) NOT NULL DEFAULT '',
    meta_business_id VARCHAR(120) NOT NULL DEFAULT '',
    webhook_status VARCHAR(40) NOT NULL DEFAULT 'not_subscribed', -- subscribed | not_subscribed | error
    default_template_booking VARCHAR(120) NOT NULL DEFAULT '',
    default_template_reminder VARCHAR(120) NOT NULL DEFAULT '',
    notify_booking_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
    notify_booking_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    notify_event_registration BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_whatsapp_connections_integration UNIQUE (integration_id)
);

CREATE TABLE IF NOT EXISTS email_connections (
    id BIGSERIAL PRIMARY KEY,
    integration_id BIGINT NOT NULL REFERENCES organization_integrations(id) ON DELETE CASCADE,
    email_provider VARCHAR(40) NOT NULL DEFAULT 'gmail', -- gmail | google_workspace | microsoft365 | smtp
    email_address VARCHAR(255) NOT NULL DEFAULT '',
    sender_name VARCHAR(160) NOT NULL DEFAULT '',
    reply_to VARCHAR(255) NOT NULL DEFAULT '',
    oauth_connection_id VARCHAR(255) NOT NULL DEFAULT '',
    smtp_host VARCHAR(255) NOT NULL DEFAULT '',
    smtp_port INT NOT NULL DEFAULT 587,
    smtp_tls_mode VARCHAR(40) NOT NULL DEFAULT 'starttls', -- none | starttls | ssl
    smtp_username VARCHAR(255) NOT NULL DEFAULT '',
    last_sync_at TIMESTAMPTZ NULL,
    notify_booking BOOLEAN NOT NULL DEFAULT TRUE,
    notify_event BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_email_connections_integration UNIQUE (integration_id)
);

CREATE TABLE IF NOT EXISTS integration_secrets (
    id BIGSERIAL PRIMARY KEY,
    integration_id BIGINT NOT NULL REFERENCES organization_integrations(id) ON DELETE CASCADE,
    secret_type VARCHAR(60) NOT NULL, -- access_token | refresh_token | smtp_password | webhook_verify_token
    encrypted_value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NULL,
    rotated_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_integration_secrets_type UNIQUE (integration_id, secret_type)
);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_integration
    ON integration_secrets (integration_id);

CREATE TABLE IF NOT EXISTS message_templates (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    channel VARCHAR(20) NOT NULL, -- whatsapp | email
    template_name VARCHAR(160) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    provider_template_id VARCHAR(160) NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'draft', -- draft | approved | rejected | active
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_templates_org
    ON message_templates (organisation_id, channel);

CREATE TABLE IF NOT EXISTS message_logs (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    integration_id BIGINT NULL REFERENCES organization_integrations(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL, -- whatsapp | email
    recipient VARCHAR(255) NOT NULL DEFAULT '',
    provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
    delivery_status VARCHAR(40) NOT NULL DEFAULT 'queued', -- queued | sent | delivered | bounced | failed
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_logs_org
    ON message_logs (organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_integration
    ON message_logs (integration_id);

COMMENT ON TABLE organization_integrations IS 'Org-owned WhatsApp/email connection shell (status + name).';
COMMENT ON TABLE integration_secrets IS 'Encrypted credentials only; never return plaintext to the browser.';
COMMENT ON TABLE whatsapp_connections IS 'Public WhatsApp Business connection metadata (no tokens).';
COMMENT ON TABLE email_connections IS 'Public email connection metadata (no tokens/passwords).';
