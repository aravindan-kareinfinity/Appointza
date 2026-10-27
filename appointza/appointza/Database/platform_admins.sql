-- Platform superadmin accounts (Appointza ops console — not organisation users).

CREATE TABLE IF NOT EXISTS platform_admins (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(160) NOT NULL DEFAULT '',
    password_hash VARCHAR(128) NOT NULL,
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_platform_admins_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_email_lower
    ON platform_admins (LOWER(email));

-- Seed superadmin: aravindan9302@gmail.com
-- Temporary password: ChangeMe@2026  (change after first login)
-- Hash = SHA256("appointza-platform-admin:" + password) hex lowercase
INSERT INTO platform_admins (email, name, password_hash, isactive)
VALUES (
    'aravindan9302@gmail.com',
    'Aravindan Superadmin',
    'efbc931f0b2ae0bb61b4185595cdbaf25784cd3b7599113abaea7a07bcfc07c3',
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    isactive = TRUE,
    updated_at = CURRENT_TIMESTAMP;
