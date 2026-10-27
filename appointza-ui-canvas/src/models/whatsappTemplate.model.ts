export type WhatsAppTemplateStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paused"
  | "disabled"
  | "in_appeal"
  | "archived"
  | string;

export interface WhatsAppTemplateDto {
  id: number;
  organisation_id: number;
  whatsapp_connection_id?: number | null;
  channel: string;
  template_name: string;
  language_code: string;
  category: string;
  header_type: string;
  content: string;
  components_json: string;
  provider_template_id: string;
  status: WhatsAppTemplateStatus;
  provider_status: string;
  rejection_reason: string;
  variable_mappings_json: string;
  provider_quality_score: string;
  is_provider_managed: boolean;
  is_archived: boolean;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
  business_phone?: string;
  waba_id?: string;
}

export interface WhatsAppTemplateButtonReq {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | string;
  text: string;
  url?: string;
  phone_number?: string;
}

export interface WhatsAppTemplateVariableMapping {
  index: number;
  placeholder: string;
  mapping_key: string;
  label: string;
}

export interface WhatsAppTemplateCreateReq {
  whatsapp_connection_id?: number;
  template_name: string;
  language_code: string;
  category: string;
  header_type: string;
  header_text?: string;
  body_text: string;
  footer_text?: string;
  body_examples?: string[];
  header_example?: string;
  buttons?: WhatsAppTemplateButtonReq[];
  variable_mappings?: WhatsAppTemplateVariableMapping[];
  submit?: boolean;
}

export interface WhatsAppTemplateSyncResult {
  upserted: number;
  archived: number;
  pages: number;
  message: string;
  templates: WhatsAppTemplateDto[];
}

export const TEMPLATE_VARIABLE_OPTIONS = [
  { key: "customer_name", label: "Customer name" },
  { key: "organisation_name", label: "Organization name" },
  { key: "booking_datetime", label: "Booking date & time" },
  { key: "service_name", label: "Service name" },
  { key: "event_name", label: "Event name" },
  { key: "booking_reference", label: "Booking / payment reference" },
] as const;

export type WhatsAppTemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type?: string; text?: string; url?: string; phone_number?: string }>;
  example?: unknown;
};
