export type IntegrationProvider = "whatsapp" | "email";

export type IntegrationStatus =
  | "connected"
  | "expired"
  | "disconnected"
  | "error"
  | "authorization_expired";

export type WebhookStatus = "subscribed" | "not_subscribed" | "error";

export type EmailProvider = "gmail" | "google_workspace" | "microsoft365" | "smtp";

export interface WhatsAppConnectionSafe {
  id: number;
  integration_id: number;
  waba_id: string;
  phone_number_id: string;
  business_phone: string;
  meta_business_id: string;
  webhook_status: WebhookStatus | string;
  default_template_booking: string;
  default_template_reminder: string;
  notify_booking_confirmation: boolean;
  notify_booking_reminder: boolean;
  notify_event_registration: boolean;
}

export interface EmailConnectionSafe {
  id: number;
  integration_id: number;
  email_provider: EmailProvider | string;
  email_address: string;
  sender_name: string;
  reply_to: string;
  oauth_connection_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_tls_mode: string;
  smtp_username: string;
  last_sync_at?: string | null;
  notify_booking: boolean;
  notify_event: boolean;
}

export interface OrganisationIntegrationSafe {
  id: number;
  organisation_id: number;
  provider: IntegrationProvider | string;
  connection_name: string;
  status: IntegrationStatus | string;
  is_active: boolean;
  has_access_token: boolean;
  has_refresh_token: boolean;
  has_smtp_password: boolean;
  secret_expires_at?: string | null;
  created_at: string;
  updated_at: string;
  whatsapp?: WhatsAppConnectionSafe | null;
  email?: EmailConnectionSafe | null;
}

export interface OrganisationIntegrationSelectReq {
  organisation_id?: number;
  provider?: string;
  id?: number;
}

export interface WhatsAppIntegrationUpsertReq {
  id?: number;
  organisation_id: number;
  connection_name: string;
  status?: string;
  waba_id: string;
  phone_number_id: string;
  business_phone: string;
  meta_business_id: string;
  webhook_status?: string;
  default_template_booking?: string;
  default_template_reminder?: string;
  notify_booking_confirmation?: boolean;
  notify_booking_reminder?: boolean;
  notify_event_registration?: boolean;
  /** Write-only; leave empty to keep existing encrypted token. */
  access_token?: string;
  access_token_expires_at?: string | null;
}

export interface EmailIntegrationUpsertReq {
  id?: number;
  organisation_id: number;
  connection_name: string;
  status?: string;
  email_provider: EmailProvider | string;
  email_address: string;
  sender_name: string;
  reply_to?: string;
  oauth_connection_id?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_tls_mode?: string;
  smtp_username?: string;
  notify_booking?: boolean;
  notify_event?: boolean;
  /** Write-only secrets — never echoed back by the API. */
  access_token?: string;
  refresh_token?: string;
  smtp_password?: string;
  access_token_expires_at?: string | null;
}

export interface OrganisationIntegrationDisconnectReq {
  id: number;
  organisation_id: number;
}
