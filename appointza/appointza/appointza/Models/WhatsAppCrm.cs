namespace appointza.Models
{
    public static class WhatsAppMessageDirections
    {
        public const string Inbound = "inbound";
        public const string Outbound = "outbound";
    }

    public static class WhatsAppMessageStatuses
    {
        public const string Queued = "queued";
        public const string Sent = "sent";
        public const string Delivered = "delivered";
        public const string Read = "read";
        public const string Failed = "failed";
        public const string Received = "received";
    }

    public static class WhatsAppConversationStatuses
    {
        public const string Open = "open";
        public const string Pending = "pending";
        public const string Closed = "closed";
    }

    public class WhatsAppOrgConnectionContext
    {
        public long organisation_id { get; set; }
        public long integration_id { get; set; }
        public long whatsapp_connection_id { get; set; }
        public string phone_number_id { get; set; } = string.Empty;
        public string waba_id { get; set; } = string.Empty;
        public string business_phone { get; set; } = string.Empty;
        public string access_token { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public bool is_active { get; set; }
    }

    public class WhatsAppConversationDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long whatsapp_connection_id { get; set; }
        public long? customer_id { get; set; }
        /// <summary>CRM lead (enquiries.id) when linked from inbound WhatsApp.</summary>
        public long? enquiry_id { get; set; }
        public string customer_wa_id { get; set; } = string.Empty;
        public string customer_name { get; set; } = string.Empty;
        public long? assigned_user_id { get; set; }
        public string status { get; set; } = WhatsAppConversationStatuses.Open;
        public DateTime? last_message_at { get; set; }
        public string last_message_preview { get; set; } = string.Empty;
        public int unread_count { get; set; }
        /// <summary>Direction of the most recent message, when available.</summary>
        public string last_message_direction { get; set; } = string.Empty;
        /// <summary>Provider/app status of the most recent message, when available.</summary>
        public string last_message_status { get; set; } = string.Empty;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class WhatsAppMessageDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long whatsapp_connection_id { get; set; }
        public long conversation_id { get; set; }
        public string provider_message_id { get; set; } = string.Empty;
        public string direction { get; set; } = string.Empty;
        public string message_type { get; set; } = "text";
        public string text_content { get; set; } = string.Empty;
        public string media_id { get; set; } = string.Empty;
        public string status { get; set; } = WhatsAppMessageStatuses.Queued;
        public string failure_reason { get; set; } = string.Empty;
        public DateTime? provider_timestamp { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class WhatsAppConversationSelectReq
    {
        public long organisation_id { get; set; }
        public string search { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        /// <summary>When true, only conversations with unread_count &gt; 0.</summary>
        public bool unread_only { get; set; }
        public int limit { get; set; } = 50;
        /// <summary>Offset for pagination (most-recent-first).</summary>
        public int offset { get; set; }
    }

    public class WhatsAppMessageSelectReq
    {
        public long organisation_id { get; set; }
        public long conversation_id { get; set; }
        public int limit { get; set; } = 100;
    }

    public class WhatsAppSendTextReq
    {
        public long organisation_id { get; set; }
        public long conversation_id { get; set; }
        public string text { get; set; } = string.Empty;
    }

    public class WhatsAppConversationPatchReq
    {
        public long organisation_id { get; set; }
        public long conversation_id { get; set; }
        public string? status { get; set; }
        public long? assigned_user_id { get; set; }
        public bool? mark_read { get; set; }
    }

    /// <summary>Lead or booked client contact eligible for WhatsApp inbox outreach.</summary>
    public class WhatsAppMessagingContactDto
    {
        public string source_type { get; set; } = string.Empty;
        public long source_id { get; set; }
        public long? customer_id { get; set; }
        public long? enquiry_id { get; set; }
        public string display_name { get; set; } = string.Empty;
        public string phone { get; set; } = string.Empty;
        public long? conversation_id { get; set; }
    }

    public class WhatsAppMessagingContactSelectReq
    {
        public long organisation_id { get; set; }
        public string search { get; set; } = string.Empty;
        public int limit { get; set; } = 50;
        public int offset { get; set; }
    }

    public class WhatsAppEnsureConversationReq
    {
        public long organisation_id { get; set; }
        public string phone { get; set; } = string.Empty;
        public long customer_id { get; set; }
        public long enquiry_id { get; set; }
        public string display_name { get; set; } = string.Empty;
    }

    public class WhatsAppSendTemplateReq
    {
        public long organisation_id { get; set; }
        public long conversation_id { get; set; }
        public long message_template_id { get; set; }
        public List<string>? header_parameters { get; set; }
        public List<string>? body_parameters { get; set; }
    }

    /// <summary>Safe webhook setup values for org admins (Profile → WhatsApp).</summary>
    public class WhatsAppWebhookSetupDto
    {
        public string verify_token { get; set; } = "";
        public string callback_path { get; set; } = "/api/webhooks/whatsapp";
        public bool verify_token_configured { get; set; }
        public bool app_secret_configured { get; set; }
    }

    public class WhatsAppCloudSendResult
    {
        public bool success { get; set; }
        public string provider_message_id { get; set; } = string.Empty;
        public string error { get; set; } = string.Empty;
        public string error_code { get; set; } = string.Empty;
        public int http_status { get; set; }
        public bool is_rate_limited { get; set; }
        public bool is_transient { get; set; }
        /// <summary>
        /// True when the HTTP outcome is ambiguous (e.g. network failure after a possible accept).
        /// Do not blindly resend.
        /// </summary>
        public bool outcome_uncertain { get; set; }
    }
}
