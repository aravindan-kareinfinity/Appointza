namespace appointza.Models
{
    public static class WhatsAppTemplateChannels
    {
        public const string WhatsApp = "whatsapp";
    }

    /// <summary>
    /// Local + provider status values. Never invent Meta approval — only map provider responses.
    /// </summary>
    public static class WhatsAppTemplateStatuses
    {
        public const string Draft = "draft";
        public const string Pending = "pending";
        public const string Approved = "approved";
        public const string Rejected = "rejected";
        public const string Paused = "paused";
        public const string Disabled = "disabled";
        public const string InAppeal = "in_appeal";
        public const string Archived = "archived";
    }

    public class WhatsAppTemplateDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long? whatsapp_connection_id { get; set; }
        public string channel { get; set; } = WhatsAppTemplateChannels.WhatsApp;
        public string template_name { get; set; } = string.Empty;
        public string language_code { get; set; } = string.Empty;
        public string category { get; set; } = string.Empty;
        public string header_type { get; set; } = string.Empty;
        public string content { get; set; } = string.Empty;
        public string components_json { get; set; } = "[]";
        public string provider_template_id { get; set; } = string.Empty;
        public string status { get; set; } = WhatsAppTemplateStatuses.Draft;
        public string provider_status { get; set; } = string.Empty;
        public string rejection_reason { get; set; } = string.Empty;
        public string variable_mappings_json { get; set; } = "[]";
        public string provider_quality_score { get; set; } = string.Empty;
        public bool is_provider_managed { get; set; }
        public bool is_archived { get; set; }
        public DateTime? last_synced_at { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public string business_phone { get; set; } = string.Empty;
        public string waba_id { get; set; } = string.Empty;
    }

    public class WhatsAppTemplateSelectReq
    {
        public string search { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string category { get; set; } = string.Empty;
        public int limit { get; set; } = 50;
        public int offset { get; set; }
        public bool include_archived { get; set; }
    }

    public class WhatsAppTemplateCreateReq
    {
        public long whatsapp_connection_id { get; set; }
        public string template_name { get; set; } = string.Empty;
        public string language_code { get; set; } = "en_US";
        public string category { get; set; } = "UTILITY";
        public string header_type { get; set; } = "NONE"; // NONE | TEXT | IMAGE | VIDEO | DOCUMENT
        public string header_text { get; set; } = string.Empty;
        public string body_text { get; set; } = string.Empty;
        public string footer_text { get; set; } = string.Empty;
        public List<string> body_examples { get; set; } = new();
        public string header_example { get; set; } = string.Empty;
        public List<WhatsAppTemplateButtonReq> buttons { get; set; } = new();
        public List<WhatsAppTemplateVariableMapping> variable_mappings { get; set; } = new();
        /// <summary>When true, submit to Meta immediately after local validation.</summary>
        public bool submit { get; set; } = true;
    }

    public class WhatsAppTemplateButtonReq
    {
        public string type { get; set; } = "QUICK_REPLY"; // QUICK_REPLY | URL | PHONE_NUMBER
        public string text { get; set; } = string.Empty;
        public string url { get; set; } = string.Empty;
        public string phone_number { get; set; } = string.Empty;
    }

    public class WhatsAppTemplateVariableMapping
    {
        public int index { get; set; }
        public string placeholder { get; set; } = string.Empty; // {{1}}
        public string mapping_key { get; set; } = string.Empty; // customer_name | organisation_name | booking_datetime | ...
        public string label { get; set; } = string.Empty;
    }

    public class WhatsAppTemplateSyncResult
    {
        public int upserted { get; set; }
        public int archived { get; set; }
        public int pages { get; set; }
        public string message { get; set; } = string.Empty;
        public List<WhatsAppTemplateDto> templates { get; set; } = new();
    }

    public class WhatsAppCloudTemplatePage
    {
        public bool success { get; set; }
        public string error { get; set; } = string.Empty;
        public bool is_auth_error { get; set; }
        public bool is_transient { get; set; }
        public List<WhatsAppCloudTemplateItem> items { get; set; } = new();
        public string? next_cursor { get; set; }
    }

    public class WhatsAppCloudTemplateItem
    {
        public string id { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public string language { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string category { get; set; } = string.Empty;
        public string rejected_reason { get; set; } = string.Empty;
        public string quality_score { get; set; } = string.Empty;
        public string components_json { get; set; } = "[]";
    }

    public class WhatsAppCloudTemplateCreateResult
    {
        public bool success { get; set; }
        public string error { get; set; } = string.Empty;
        public bool is_auth_error { get; set; }
        public bool is_transient { get; set; }
        public string provider_template_id { get; set; } = string.Empty;
        public string provider_status { get; set; } = string.Empty;
    }
}
