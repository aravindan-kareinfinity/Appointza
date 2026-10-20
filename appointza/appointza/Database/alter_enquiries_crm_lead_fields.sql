-- CRM lead fields on enquiries (manual Add Lead + business details)
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS website VARCHAR(500),
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS pin_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS area VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lead_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags TEXT;

COMMENT ON COLUMN enquiries.business_name IS 'Business / venue name for CRM leads';
COMMENT ON COLUMN enquiries.owner_name IS 'Business owner name';
COMMENT ON COLUMN enquiries.category IS 'Business category (from LEADCATEGORY reference values)';
COMMENT ON COLUMN enquiries.lead_type IS 'CRM type e.g. Customer / Lead (from LEADTYPE reference values)';
COMMENT ON COLUMN enquiries.tags IS 'Comma-separated tags';
COMMENT ON COLUMN enquiries.source IS 'Lead source (from LEADSOURCE reference values or contact form)';
