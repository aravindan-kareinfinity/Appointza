namespace appointza.Models
{
    public static class WhatsAppCampaignStatuses
    {
        public const string Draft = "draft";
        public const string Validating = "validating";
        public const string Ready = "ready";
        public const string Scheduled = "scheduled";
        public const string Queued = "queued";
        public const string Dispatching = "dispatching";
        public const string Paused = "paused";
        public const string Cancelling = "cancelling";
        public const string Cancelled = "cancelled";
        public const string Completed = "completed";
        public const string CompletedWithErrors = "completed_with_errors";
        public const string Failed = "failed";
    }

    public static class WhatsAppCampaignRecipientProcessingStatuses
    {
        public const string Pending = "pending";
        public const string Queued = "queued";
        public const string Processing = "processing";
        public const string Accepted = "accepted";
        public const string Failed = "failed";
        public const string Cancelled = "cancelled";
        public const string Unknown = "unknown";
        public const string Skipped = "skipped";
    }

    public static class WhatsAppCampaignErrorCategories
    {
        public const string Transient = "transient";
        public const string Permanent = "permanent";
        public const string RateLimit = "rate_limit";
        public const string Unknown = "unknown";
    }

    public static class WhatsAppConsentStatuses
    {
        public const string Unknown = "unknown";
        public const string OptedIn = "opted_in";
        public const string OptedOut = "opted_out";
    }

    public static class WhatsAppConsentPurposes
    {
        public const string Marketing = "marketing";
        public const string Utility = "utility";
        public const string Transactional = "transactional";
    }

    public class WhatsAppCampaignDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long whatsapp_connection_id { get; set; }
        public long? message_template_id { get; set; }
        public string name { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public string category { get; set; } = WhatsAppConsentPurposes.Marketing;
        public string audience_configuration { get; set; } = "{}";
        public string variable_mapping { get; set; } = "[]";
        public string status { get; set; } = WhatsAppCampaignStatuses.Draft;
        public DateTime? scheduled_at { get; set; }
        public string timezone { get; set; } = "UTC";
        public int selected_count { get; set; }
        public int eligible_count { get; set; }
        public int excluded_count { get; set; }
        public int accepted_count { get; set; }
        public int delivered_count { get; set; }
        public int read_count { get; set; }
        public int failed_count { get; set; }
        public int cancelled_count { get; set; }
        public int unknown_count { get; set; }
        public string validation_summary { get; set; } = string.Empty;
        public DateTime? validated_at { get; set; }
        public DateTime? started_at { get; set; }
        public DateTime? completed_at { get; set; }
        public DateTime? paused_at { get; set; }
        public int version { get; set; } = 1;
        public long? created_by { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public string template_name { get; set; } = string.Empty;
        public string template_status { get; set; } = string.Empty;
        public string business_phone { get; set; } = string.Empty;
        public string waba_id { get; set; } = string.Empty;
    }

    public class WhatsAppCampaignReportDto
    {
        public WhatsAppCampaignDto campaign { get; set; } = new();
        public Dictionary<string, int> processing_status_counts { get; set; } = new();
        public Dictionary<string, int> provider_status_counts { get; set; } = new();
        public Dictionary<string, int> exclusion_reasons { get; set; } = new();
    }

    public class WhatsAppCampaignRecipientSelectReq
    {
        public long campaign_id { get; set; }
        public string processing_status { get; set; } = string.Empty;
        public string search { get; set; } = string.Empty;
        public int limit { get; set; } = 50;
        public int offset { get; set; }
    }

    public class WhatsAppCampaignSelectReq
    {
        public string search { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public int limit { get; set; } = 50;
        public int offset { get; set; }
    }

    public class WhatsAppCampaignUpsertReq
    {
        public long id { get; set; }
        public long whatsapp_connection_id { get; set; }
        public long? message_template_id { get; set; }
        public string name { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public string category { get; set; } = WhatsAppConsentPurposes.Marketing;
        public WhatsAppCampaignAudienceConfig? audience { get; set; }
        public List<WhatsAppCampaignVariableMap>? variable_mapping { get; set; }
        public int? expected_version { get; set; }
    }

    public class WhatsAppCampaignAudienceConfig
    {
        /// <summary>client | lead | conversation | event | booking</summary>
        public List<string> sources { get; set; } = new() { "client", "lead" };
        public string search { get; set; } = string.Empty;
        public string lead_status { get; set; } = string.Empty;
        public string lead_tag { get; set; } = string.Empty;
        public DateTime? booking_from { get; set; }
        public DateTime? booking_to { get; set; }
        public long? event_id { get; set; }
        public long? service_id { get; set; }
        public int limit { get; set; } = 5000;
    }

    public class WhatsAppCampaignVariableMap
    {
        public string placeholder { get; set; } = string.Empty; // {{1}}
        public string source_type { get; set; } = "field"; // field | fixed
        public string source_key { get; set; } = string.Empty; // customer_name | organisation_name | ...
        public string fixed_value { get; set; } = string.Empty;
        public string fallback_value { get; set; } = string.Empty;
        public bool allow_empty { get; set; }
    }

    public class WhatsAppCampaignAudiencePreviewReq
    {
        public long whatsapp_connection_id { get; set; }
        public string category { get; set; } = WhatsAppConsentPurposes.Marketing;
        public WhatsAppCampaignAudienceConfig? audience { get; set; }
        public int sample_limit { get; set; } = 20;
    }

    public class WhatsAppCampaignAudiencePreviewResult
    {
        public int selected_count { get; set; }
        public int eligible_count { get; set; }
        public int excluded_count { get; set; }
        public Dictionary<string, int> exclusion_reasons { get; set; } = new();
        public List<WhatsAppCampaignRecipientSample> samples { get; set; } = new();
    }

    public class WhatsAppCampaignRecipientSample
    {
        public string display_name { get; set; } = string.Empty;
        public string phone_normalized { get; set; } = string.Empty;
        public string source_type { get; set; } = string.Empty;
        public string eligibility_status { get; set; } = string.Empty;
        public string exclusion_reason { get; set; } = string.Empty;
    }

    public class WhatsAppCampaignValidateResult
    {
        public bool is_valid { get; set; }
        public List<string> errors { get; set; } = new();
        public WhatsAppCampaignDto? campaign { get; set; }
        public WhatsAppCampaignAudiencePreviewResult? audience { get; set; }
    }

    public class WhatsAppCampaignPreviewReq
    {
        public int sample_count { get; set; } = 3;
    }

    public class WhatsAppCampaignPreviewResult
    {
        public WhatsAppCampaignDto campaign { get; set; } = new();
        public WhatsAppTemplateDto? template { get; set; }
        public List<WhatsAppCampaignMessagePreview> samples { get; set; } = new();
        public string note { get; set; } = "Sample preview only — no WhatsApp message was sent.";
    }

    public class WhatsAppCampaignMessagePreview
    {
        public string display_name { get; set; } = string.Empty;
        public string phone_normalized { get; set; } = string.Empty;
        public string header { get; set; } = string.Empty;
        public string body { get; set; } = string.Empty;
        public string footer { get; set; } = string.Empty;
        public Dictionary<string, string> resolved_variables { get; set; } = new();
        public List<string> unresolved_required { get; set; } = new();
    }

    public class WhatsAppCampaignScheduleReq
    {
        public DateTime scheduled_at_utc { get; set; }
        public string timezone { get; set; } = "UTC";
        public int? expected_version { get; set; }
    }

    public class WhatsAppCampaignRecipientDto
    {
        public long id { get; set; }
        public long campaign_id { get; set; }
        public string source_type { get; set; } = string.Empty;
        public string display_name { get; set; } = string.Empty;
        public string phone_normalized { get; set; } = string.Empty;
        public string eligibility_status { get; set; } = string.Empty;
        public string exclusion_reason { get; set; } = string.Empty;
        public string processing_status { get; set; } = string.Empty;
        public string provider_status { get; set; } = string.Empty;
        public string provider_message_id { get; set; } = string.Empty;
        public int attempt_count { get; set; }
        public string error_category { get; set; } = string.Empty;
        public string error_code { get; set; } = string.Empty;
        public string error_message { get; set; } = string.Empty;
        public DateTime? accepted_at { get; set; }
        public DateTime? delivered_at { get; set; }
        public DateTime? read_at { get; set; }
        public DateTime? failed_at { get; set; }
        public DateTime? last_attempt_at { get; set; }
        public DateTime? next_attempt_at { get; set; }
    }
}
