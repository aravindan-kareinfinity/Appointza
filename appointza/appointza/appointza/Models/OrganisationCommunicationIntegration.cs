using System;

namespace appointza.Models
{
    public static class IntegrationProviders
    {
        public const string WhatsApp = "whatsapp";
        public const string Email = "email";
    }

    public static class IntegrationStatuses
    {
        public const string Connected = "connected";
        public const string Expired = "expired";
        public const string Disconnected = "disconnected";
        public const string Error = "error";
        public const string AuthorizationExpired = "authorization_expired";
    }

    public static class IntegrationSecretTypes
    {
        public const string AccessToken = "access_token";
        public const string RefreshToken = "refresh_token";
        public const string SmtpPassword = "smtp_password";
    }

    /// <summary>Safe response for Account UI — never includes raw tokens.</summary>
    public class OrganisationIntegrationSafe
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string provider { get; set; } = string.Empty;
        public string connection_name { get; set; } = string.Empty;
        public string status { get; set; } = IntegrationStatuses.Disconnected;
        public bool is_active { get; set; } = true;
        public bool has_access_token { get; set; }
        public bool has_refresh_token { get; set; }
        public bool has_smtp_password { get; set; }
        public DateTime? secret_expires_at { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public WhatsAppConnectionSafe? whatsapp { get; set; }
        public EmailConnectionSafe? email { get; set; }
    }

    public class WhatsAppConnectionSafe
    {
        public long id { get; set; }
        public long integration_id { get; set; }
        public string waba_id { get; set; } = string.Empty;
        public string phone_number_id { get; set; } = string.Empty;
        public string business_phone { get; set; } = string.Empty;
        public string meta_business_id { get; set; } = string.Empty;
        public string webhook_status { get; set; } = "not_subscribed";
        public string default_template_booking { get; set; } = string.Empty;
        public string default_template_reminder { get; set; } = string.Empty;
        public bool notify_booking_confirmation { get; set; } = true;
        public bool notify_booking_reminder { get; set; } = true;
        public bool notify_event_registration { get; set; } = true;
    }

    public class EmailConnectionSafe
    {
        public long id { get; set; }
        public long integration_id { get; set; }
        public string email_provider { get; set; } = "gmail";
        public string email_address { get; set; } = string.Empty;
        public string sender_name { get; set; } = string.Empty;
        public string reply_to { get; set; } = string.Empty;
        public string oauth_connection_id { get; set; } = string.Empty;
        public string smtp_host { get; set; } = string.Empty;
        public int smtp_port { get; set; } = 587;
        public string smtp_tls_mode { get; set; } = "starttls";
        public string smtp_username { get; set; } = string.Empty;
        public DateTime? last_sync_at { get; set; }
        public bool notify_booking { get; set; } = true;
        public bool notify_event { get; set; } = true;
    }

    public class OrganisationIntegrationSelectReq
    {
        public long? organisation_id { get; set; }
        public string? provider { get; set; }
        public long? id { get; set; }
    }

    public class WhatsAppIntegrationUpsertReq
    {
        public long? id { get; set; }
        public long organisation_id { get; set; }
        public string connection_name { get; set; } = string.Empty;
        public string status { get; set; } = IntegrationStatuses.Connected;
        public string waba_id { get; set; } = string.Empty;
        public string phone_number_id { get; set; } = string.Empty;
        public string business_phone { get; set; } = string.Empty;
        public string meta_business_id { get; set; } = string.Empty;
        public string webhook_status { get; set; } = "not_subscribed";
        public string default_template_booking { get; set; } = string.Empty;
        public string default_template_reminder { get; set; } = string.Empty;
        public bool notify_booking_confirmation { get; set; } = true;
        public bool notify_booking_reminder { get; set; } = true;
        public bool notify_event_registration { get; set; } = true;
        /// <summary>Write-only. Empty means keep existing encrypted token.</summary>
        public string? access_token { get; set; }
        public DateTime? access_token_expires_at { get; set; }
    }

    public class EmailIntegrationUpsertReq
    {
        public long? id { get; set; }
        public long organisation_id { get; set; }
        public string connection_name { get; set; } = string.Empty;
        public string status { get; set; } = IntegrationStatuses.Connected;
        public string email_provider { get; set; } = "gmail";
        public string email_address { get; set; } = string.Empty;
        public string sender_name { get; set; } = string.Empty;
        public string reply_to { get; set; } = string.Empty;
        public string oauth_connection_id { get; set; } = string.Empty;
        public string smtp_host { get; set; } = string.Empty;
        public int smtp_port { get; set; } = 587;
        public string smtp_tls_mode { get; set; } = "starttls";
        public string smtp_username { get; set; } = string.Empty;
        public bool notify_booking { get; set; } = true;
        public bool notify_event { get; set; } = true;
        /// <summary>Write-only. Empty means keep existing.</summary>
        public string? access_token { get; set; }
        public string? refresh_token { get; set; }
        public string? smtp_password { get; set; }
        public DateTime? access_token_expires_at { get; set; }
    }

    public class OrganisationIntegrationDisconnectReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
    }
}
