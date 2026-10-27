-- Phase 6: Durable campaign dispatch, leases, retries, reporting counters.
-- Extends Phase 5 whatsapp_campaigns / whatsapp_campaign_recipients.
-- Reuses whatsapp_messages + webhook status pipeline.

ALTER TABLE whatsapp_campaigns
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS dispatch_lease_owner VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS dispatch_lease_until TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS accepted_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivered_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS read_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failed_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cancelled_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unknown_count INT NOT NULL DEFAULT 0;

-- Claim index for scheduled → queued promotion and dispatching work.
CREATE INDEX IF NOT EXISTS idx_wa_campaigns_dispatch_claim
    ON whatsapp_campaigns (status, scheduled_at NULLS FIRST, dispatch_lease_until NULLS FIRST);

ALTER TABLE whatsapp_campaign_recipients
    ADD COLUMN IF NOT EXISTS processing_status VARCHAR(40) NOT NULL DEFAULT 'pending',
    -- pending | queued | processing | accepted | failed | cancelled | unknown | skipped
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS lease_owner VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS whatsapp_message_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS error_category VARCHAR(60) NOT NULL DEFAULT '',
    -- transient | permanent | rate_limit | unknown
    ADD COLUMN IF NOT EXISTS error_code VARCHAR(80) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS error_message TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS provider_status VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Promote eligible Phase-5 rows into the dispatch queue once.
UPDATE whatsapp_campaign_recipients
SET processing_status = 'queued',
    updated_at = CURRENT_TIMESTAMP
WHERE eligibility_status = 'eligible'
  AND processing_status = 'pending'
  AND COALESCE(provider_message_id, '') = '';

UPDATE whatsapp_campaign_recipients
SET processing_status = 'skipped',
    updated_at = CURRENT_TIMESTAMP
WHERE eligibility_status = 'excluded'
  AND processing_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_wa_campaign_recipients_claim
    ON whatsapp_campaign_recipients (campaign_id, processing_status, next_attempt_at NULLS FIRST, id)
    WHERE processing_status IN ('queued', 'processing', 'unknown');

CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_campaign_recipients_provider_message_id
    ON whatsapp_campaign_recipients (provider_message_id)
    WHERE provider_message_id IS NOT NULL AND btrim(provider_message_id) <> '';

-- Link inbox messages to campaigns when sent via dispatch.
ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS campaign_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS campaign_recipient_id BIGINT NULL;

CREATE INDEX IF NOT EXISTS idx_wa_messages_campaign
    ON whatsapp_messages (campaign_id)
    WHERE campaign_id IS NOT NULL;

COMMENT ON COLUMN whatsapp_campaign_recipients.processing_status IS 'Internal queue status; provider_status holds Meta delivery/read/failed.';
COMMENT ON COLUMN whatsapp_messages.campaign_id IS 'Optional campaign reference for Phase 6 outbound template sends.';
