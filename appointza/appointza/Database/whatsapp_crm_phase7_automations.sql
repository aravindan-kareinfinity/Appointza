-- Phase 7: Organization WhatsApp automations (rules + durable executions).
-- Reuses message_templates, whatsapp_connections, whatsapp_messages, consent, Cloud API send.

CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    trigger_type VARCHAR(80) NOT NULL,
    -- booking_created | booking_confirmed | booking_rescheduled | booking_cancelled
    -- booking_completed | booking_reminder | payment_confirmed
    -- event_registration | event_status_changed | event_cancelled | event_reminder
    -- feedback_request | follow_up
    whatsapp_connection_id BIGINT NOT NULL REFERENCES whatsapp_connections(id) ON DELETE RESTRICT,
    message_template_id BIGINT NOT NULL REFERENCES message_templates(id) ON DELETE RESTRICT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    purpose VARCHAR(60) NOT NULL DEFAULT 'utility', -- marketing | utility | transactional
    delay_minutes INT NOT NULL DEFAULT 0,
    reminder_offset_minutes INT NULL, -- for *_reminder triggers; minutes before start
    timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    conditions_json TEXT NOT NULL DEFAULT '{}',
    variable_mapping TEXT NOT NULL DEFAULT '[]',
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_auto_rules_org_trigger
    ON whatsapp_automation_rules (organisation_id, trigger_type, is_enabled);

CREATE TABLE IF NOT EXISTS whatsapp_automation_executions (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    automation_rule_id BIGINT NOT NULL REFERENCES whatsapp_automation_rules(id) ON DELETE CASCADE,
    business_event_type VARCHAR(80) NOT NULL,
    business_entity_type VARCHAR(40) NOT NULL DEFAULT '', -- appointment | event_booking | payment
    business_entity_id BIGINT NOT NULL DEFAULT 0,
    recipient_phone_normalized VARCHAR(40) NOT NULL DEFAULT '',
    recipient_display_name VARCHAR(200) NOT NULL DEFAULT '',
    idempotency_key VARCHAR(240) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    -- pending | scheduled | queued | processing | accepted | delivered | read | skipped | failed | cancelled | unknown
    scheduled_at TIMESTAMPTZ NULL,
    processed_at TIMESTAMPTZ NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMPTZ NULL,
    lease_owner VARCHAR(120) NOT NULL DEFAULT '',
    lease_until TIMESTAMPTZ NULL,
    whatsapp_message_id BIGINT NULL,
    provider_message_id VARCHAR(160) NOT NULL DEFAULT '',
    provider_status VARCHAR(40) NOT NULL DEFAULT '',
    failure_category VARCHAR(60) NOT NULL DEFAULT '',
    failure_reason TEXT NOT NULL DEFAULT '',
    context_json TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wa_auto_exec_idempotency UNIQUE (organisation_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_wa_auto_exec_claim
    ON whatsapp_automation_executions (status, scheduled_at NULLS FIRST, next_attempt_at NULLS FIRST, id)
    WHERE status IN ('pending', 'scheduled', 'queued', 'processing');

CREATE INDEX IF NOT EXISTS idx_wa_auto_exec_org_rule
    ON whatsapp_automation_executions (organisation_id, automation_rule_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_auto_exec_entity
    ON whatsapp_automation_executions (organisation_id, business_entity_type, business_entity_id);

CREATE INDEX IF NOT EXISTS idx_wa_auto_exec_provider_message
    ON whatsapp_automation_executions (provider_message_id)
    WHERE provider_message_id IS NOT NULL AND btrim(provider_message_id) <> '';

COMMENT ON TABLE whatsapp_automation_rules IS 'Phase 7 org-scoped WhatsApp automation rules; connection stays under Profile → WhatsApp.';
COMMENT ON TABLE whatsapp_automation_executions IS 'Durable outbox for automation sends; uses Cloud API + whatsapp_messages.';
