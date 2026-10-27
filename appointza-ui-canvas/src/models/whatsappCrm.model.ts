export type WhatsAppConversationStatus = "open" | "pending" | "closed" | string;

export interface WhatsAppConversationDto {
  id: number;
  organisation_id: number;
  whatsapp_connection_id: number;
  customer_id?: number | null;
  enquiry_id?: number | null;
  customer_wa_id: string;
  customer_name: string;
  assigned_user_id?: number | null;
  status: WhatsAppConversationStatus;
  last_message_at?: string | null;
  last_message_preview: string;
  unread_count: number;
  last_message_direction?: string;
  last_message_status?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessageDto {
  id: number;
  organisation_id: number;
  whatsapp_connection_id: number;
  conversation_id: number;
  provider_message_id: string;
  direction: "inbound" | "outbound" | string;
  message_type: string;
  text_content: string;
  media_id: string;
  status: string;
  failure_reason: string;
  provider_timestamp?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversationSelectReq {
  organisation_id?: number;
  search?: string;
  status?: string;
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface WhatsAppMessageSelectReq {
  organisation_id?: number;
  conversation_id: number;
  limit?: number;
}

export interface WhatsAppSendTextReq {
  organisation_id?: number;
  conversation_id: number;
  text: string;
}

export interface WhatsAppConversationPatchReq {
  organisation_id?: number;
  conversation_id: number;
  status?: string;
  assigned_user_id?: number | null;
  mark_read?: boolean;
}

export type WhatsAppInboxFilter = "all" | "unread" | "open" | "pending" | "closed";

/** Meta webhook setup (verify token / password) from server config. */
export interface WhatsAppWebhookSetupDto {
  verify_token: string;
  callback_path: string;
  verify_token_configured: boolean;
  app_secret_configured: boolean;
}

export type WhatsAppMessagingContactSource = "lead" | "client" | string;

export interface WhatsAppMessagingContactDto {
  source_type: WhatsAppMessagingContactSource;
  source_id: number;
  customer_id?: number | null;
  enquiry_id?: number | null;
  display_name: string;
  phone: string;
  conversation_id?: number | null;
}

export interface WhatsAppEnsureConversationReq {
  phone?: string;
  customer_id?: number;
  enquiry_id?: number;
  display_name?: string;
}

export interface WhatsAppSendTemplateReq {
  message_template_id: number;
  header_parameters?: string[];
  body_parameters?: string[];
}

export type WhatsAppInboxListMode = "conversations" | "contacts";
