export type WhatsAppCampaignStatus =
  | "draft"
  | "validating"
  | "ready"
  | "scheduled"
  | "queued"
  | "dispatching"
  | "paused"
  | "cancelling"
  | "cancelled"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | string;

export interface WhatsAppCampaignDto {
  id: number;
  organisation_id: number;
  whatsapp_connection_id: number;
  message_template_id?: number | null;
  name: string;
  description: string;
  category: string;
  audience_configuration: string;
  variable_mapping: string;
  status: WhatsAppCampaignStatus;
  scheduled_at?: string | null;
  timezone: string;
  selected_count: number;
  eligible_count: number;
  excluded_count: number;
  accepted_count?: number;
  delivered_count?: number;
  read_count?: number;
  failed_count?: number;
  cancelled_count?: number;
  unknown_count?: number;
  validation_summary: string;
  validated_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  paused_at?: string | null;
  version: number;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  template_name?: string;
  template_status?: string;
  business_phone?: string;
  waba_id?: string;
}

export interface WhatsAppCampaignReportDto {
  campaign: WhatsAppCampaignDto;
  processing_status_counts: Record<string, number>;
  provider_status_counts: Record<string, number>;
  exclusion_reasons: Record<string, number>;
}

export interface WhatsAppCampaignRecipientDto {
  id: number;
  campaign_id: number;
  source_type: string;
  display_name: string;
  phone_normalized: string;
  eligibility_status: string;
  exclusion_reason: string;
  processing_status: string;
  provider_status: string;
  provider_message_id: string;
  attempt_count: number;
  error_category: string;
  error_code: string;
  error_message: string;
  accepted_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
  last_attempt_at?: string | null;
  next_attempt_at?: string | null;
}

export interface WhatsAppCampaignAudienceConfig {
  sources: string[];
  search?: string;
  lead_status?: string;
  lead_tag?: string;
  booking_from?: string | null;
  booking_to?: string | null;
  event_id?: number | null;
  service_id?: number | null;
  limit?: number;
}

export interface WhatsAppCampaignVariableMap {
  placeholder: string;
  source_type: "field" | "fixed" | string;
  source_key: string;
  fixed_value?: string;
  fallback_value?: string;
  allow_empty?: boolean;
}

export interface WhatsAppCampaignUpsertReq {
  id?: number;
  whatsapp_connection_id: number;
  message_template_id?: number | null;
  name: string;
  description?: string;
  category?: string;
  audience?: WhatsAppCampaignAudienceConfig;
  variable_mapping?: WhatsAppCampaignVariableMap[];
  expected_version?: number;
}

export interface WhatsAppCampaignAudiencePreviewResult {
  selected_count: number;
  eligible_count: number;
  excluded_count: number;
  exclusion_reasons: Record<string, number>;
  samples: Array<{
    display_name: string;
    phone_normalized: string;
    source_type: string;
    eligibility_status: string;
    exclusion_reason: string;
  }>;
}

export interface WhatsAppCampaignValidateResult {
  is_valid: boolean;
  errors: string[];
  campaign?: WhatsAppCampaignDto | null;
  audience?: WhatsAppCampaignAudiencePreviewResult | null;
}

export interface WhatsAppCampaignPreviewResult {
  campaign: WhatsAppCampaignDto;
  template?: {
    id: number;
    template_name: string;
    language_code: string;
    category: string;
    components_json: string;
    status: string;
  } | null;
  samples: Array<{
    display_name: string;
    phone_normalized: string;
    header: string;
    body: string;
    footer: string;
    resolved_variables: Record<string, string>;
    unresolved_required: string[];
  }>;
  note: string;
}

export const CAMPAIGN_FIELD_OPTIONS = [
  { key: "customer_name", label: "Customer name" },
  { key: "organisation_name", label: "Organization name" },
  { key: "booking_datetime", label: "Booking date & time" },
  { key: "service_name", label: "Service name" },
  { key: "event_name", label: "Event name" },
  { key: "booking_reference", label: "Booking reference" },
  { key: "phone", label: "Phone number" },
] as const;
