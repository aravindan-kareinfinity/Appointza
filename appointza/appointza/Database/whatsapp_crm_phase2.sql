-- Phase 2: WhatsApp CRM inbox foundation (conversations, messages, webhook events).
-- Reuses organization_integrations / whatsapp_connections / integration_secrets.
--
-- BEFORE applying the unique phone_number_id index, inspect duplicates:
--   SELECT phone_number_id, COUNT(*) AS cnt
--   FROM whatsapp_connections
--   WHERE phone_number_id IS NOT NULL AND btrim(phone_number_id) <> ''
--   GROUP BY phone_number_id
--   HAVING COUNT(*) > 1;
-- Do NOT auto-delete live organisation credentials. Resolve ownership manually, then create the index.

-- One Meta phone_number_id maps to at most one connection (tenant isolation).
CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_connections_phone_number_id
    ON whatsapp_connections (phone_number_id)
    WHERE phone_number_id IS NOT NULL AND btrim(phone_number_id) <> '';

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    whatsapp_connection_id BIGINT NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    customer_id BIGINT NULL,
    customer_wa_id VARCHAR(40) NOT NULL,
    customer_name VARCHAR(160) NOT NULL DEFAULT '',
    assigned_user_id BIGINT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'open', -- open | pending | closed
    last_message_at TIMESTAMPTZ NULL,
    last_message_preview TEXT NOT NULL DEFAULT '',
    unread_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wa_conversations_connection_customer
        UNIQUE (whatsapp_connection_id, customer_wa_id)
);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_org_last
    ON whatsapp_conversations (organisation_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    whatsapp_connection_id BIGINT NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    conversation_id BIGINT NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    provider_message_id VARCHAR(120) NOT NULL DEFAULT '',
    direction VARCHAR(20) NOT NULL, -- inbound | outbound
    message_type VARCHAR(40) NOT NULL DEFAULT 'text', -- text | image | document | audio | video | template | interactive | unknown
    text_content TEXT NOT NULL DEFAULT '',
    media_id VARCHAR(120) NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'queued', -- queued | sent | delivered | read | failed | received
    failure_reason TEXT NOT NULL DEFAULT '',
    provider_timestamp TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_messages_provider_message_id
    ON whatsapp_messages (provider_message_id)
    WHERE provider_message_id IS NOT NULL AND btrim(provider_message_id) <> '';

CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation
    ON whatsapp_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_wa_messages_org
    ON whatsapp_messages (organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    provider_event_key VARCHAR(255) NOT NULL DEFAULT '',
    phone_number_id VARCHAR(120) NOT NULL DEFAULT '',
    organisation_id BIGINT NULL,
    payload TEXT NOT NULL,
    processing_status VARCHAR(40) NOT NULL DEFAULT 'received', -- received | processing | processed | failed | ignored
    retry_count INT NOT NULL DEFAULT 0,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ NULL,
    last_error TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_wa_webhook_events_status
    ON whatsapp_webhook_events (processing_status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_webhook_events_provider_key
    ON whatsapp_webhook_events (provider_event_key)
    WHERE provider_event_key IS NOT NULL AND btrim(provider_event_key) <> '';

COMMENT ON TABLE whatsapp_conversations IS 'Tenant-scoped WhatsApp threads keyed by customer WA id.';
COMMENT ON TABLE whatsapp_messages IS 'Inbound/outbound WhatsApp messages; provider_message_id is unique when present.';
COMMENT ON TABLE whatsapp_webhook_events IS 'Durable Meta webhook accept log for async/idempotent processing.';
