-- Phase 9: optional enquiry link on WhatsApp conversations (inbound auto-lead).
-- customer_id remains users.id (booked clients). enquiry_id is CRM lead (enquiries.id).

ALTER TABLE whatsapp_conversations
    ADD COLUMN IF NOT EXISTS enquiry_id BIGINT NULL;

CREATE INDEX IF NOT EXISTS idx_wa_conversations_org_enquiry
    ON whatsapp_conversations (organisation_id, enquiry_id)
    WHERE enquiry_id IS NOT NULL;

COMMENT ON COLUMN whatsapp_conversations.enquiry_id IS
    'CRM lead (enquiries.id) auto-linked on first inbound WhatsApp message; org-scoped.';
