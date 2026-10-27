import type { WhatsAppCampaignVariableMap } from "./whatsappCampaign.model";

export const AUTOMATION_TRIGGERS = [
  { value: "booking_created", label: "Booking created" },
  { value: "booking_confirmed", label: "Booking confirmed" },
  { value: "booking_rescheduled", label: "Booking rescheduled" },
  { value: "booking_cancelled", label: "Booking cancelled" },
  { value: "booking_completed", label: "Booking completed" },
  { value: "booking_reminder", label: "Booking reminder" },
  { value: "payment_confirmed", label: "Payment confirmed" },
  { value: "event_registration", label: "Event registration" },
  { value: "event_status_changed", label: "Event status changed" },
  { value: "event_cancelled", label: "Event cancelled" },
  { value: "event_reminder", label: "Event reminder" },
  { value: "feedback_request", label: "Feedback request (marketing)" },
  { value: "follow_up", label: "Follow-up (marketing)" },
] as const;

export interface WhatsAppAutomationRuleDto {
  id: number;
  organisation_id: number;
  name: string;
  trigger_type: string;
  whatsapp_connection_id: number;
  message_template_id: number;
  is_enabled: boolean;
  purpose: string;
  delay_minutes: number;
  reminder_offset_minutes?: number | null;
  timezone: string;
  conditions_json: string;
  variable_mapping: string;
  version: number;
  created_at: string;
  updated_at: string;
  template_name?: string;
  template_status?: string;
  business_phone?: string;
}

export interface WhatsAppAutomationRuleUpsertReq {
  id?: number;
  name: string;
  trigger_type: string;
  whatsapp_connection_id: number;
  message_template_id: number;
  is_enabled?: boolean;
  purpose?: string;
  delay_minutes?: number;
  reminder_offset_minutes?: number | null;
  timezone?: string;
  conditions_json?: string;
  variable_mapping?: WhatsAppCampaignVariableMap[];
  expected_version?: number;
}

export interface WhatsAppAutomationExecutionDto {
  id: number;
  organisation_id: number;
  automation_rule_id: number;
  rule_name: string;
  business_event_type: string;
  business_entity_type: string;
  business_entity_id: number;
  recipient_phone_normalized: string;
  recipient_display_name: string;
  status: string;
  scheduled_at?: string | null;
  processed_at?: string | null;
  attempt_count: number;
  provider_message_id: string;
  provider_status: string;
  failure_category: string;
  failure_reason: string;
  created_at: string;
  updated_at: string;
}
