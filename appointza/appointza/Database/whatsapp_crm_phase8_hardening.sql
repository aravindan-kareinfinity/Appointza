-- Phase 8: Production hardening — webhook idempotency, operational flags.
-- Safe to re-run. Does not drop historical data.
-- Apply before deploying AcceptWebhookEvent ON CONFLICT logic.

-- Deduplicate provider keys (keep lowest id) so the unique index can be created.
DELETE FROM whatsapp_webhook_events a
    USING whatsapp_webhook_events b
WHERE a.id > b.id
  AND a.provider_event_key = b.provider_event_key
  AND a.provider_event_key IS NOT NULL
  AND btrim(a.provider_event_key) <> '';

-- Unique provider event key so Meta redeliveries do not create duplicate durable events.
CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_webhook_events_provider_event_key
    ON whatsapp_webhook_events (provider_event_key)
    WHERE provider_event_key IS NOT NULL AND btrim(provider_event_key) <> '';

-- Global outbound kill-switch (single-row config). Workers/APIs check this before Meta sends.
CREATE TABLE IF NOT EXISTS whatsapp_outbound_control (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    outbound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pause_reason TEXT NOT NULL DEFAULT '',
    updated_by BIGINT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO whatsapp_outbound_control (id, outbound_enabled, pause_reason)
VALUES (1, TRUE, '')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE whatsapp_outbound_control IS 'Phase 8 global WhatsApp outbound pause; does not delete pending jobs.';
