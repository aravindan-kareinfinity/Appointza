-- Resumable organisation onboarding state (Appointza numeric organisation_id).
-- Safe to re-run on existing deployments.

CREATE TABLE IF NOT EXISTS organisation_onboarding (
    organisation_id BIGINT PRIMARY KEY,
    current_step VARCHAR(64) NOT NULL DEFAULT 'offerings',
    selected_offerings JSONB NOT NULL DEFAULT '[]'::jsonb,
    configured_offerings JSONB NOT NULL DEFAULT '[]'::jsonb,
    skipped_offerings JSONB NOT NULL DEFAULT '[]'::jsonb,
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    location_complete BOOLEAN NOT NULL DEFAULT FALSE,
    website_skipped BOOLEAN NOT NULL DEFAULT FALSE,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS idx_organisation_onboarding_incomplete
    ON organisation_onboarding (organisation_id)
    WHERE is_complete = FALSE;

COMMENT ON TABLE organisation_onboarding IS
    'Guided org setup progress: offerings selection, first-item creation, website skip/complete.';
COMMENT ON COLUMN organisation_onboarding.selected_offerings IS
    'JSON array of offering keys: stay, services, events, facilities, classes, other';
COMMENT ON COLUMN organisation_onboarding.configured_offerings IS
    'Offerings that already have a persisted first item (or explicitly marked done).';
COMMENT ON COLUMN organisation_onboarding.skipped_offerings IS
    'Offerings the owner chose to configure later.';
