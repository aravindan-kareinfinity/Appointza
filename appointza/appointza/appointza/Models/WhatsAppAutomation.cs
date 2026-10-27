namespace appointza.Models
{
    public static class WhatsAppAutomationTriggers
    {
        public const string BookingCreated = "booking_created";
        public const string BookingConfirmed = "booking_confirmed";
        public const string BookingRescheduled = "booking_rescheduled";
        public const string BookingCancelled = "booking_cancelled";
        public const string BookingCompleted = "booking_completed";
        public const string BookingReminder = "booking_reminder";
        public const string PaymentConfirmed = "payment_confirmed";
        public const string EventRegistration = "event_registration";
        public const string EventStatusChanged = "event_status_changed";
        public const string EventCancelled = "event_cancelled";
        public const string EventReminder = "event_reminder";
        public const string FeedbackRequest = "feedback_request";
        public const string FollowUp = "follow_up";

        public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
        {
            BookingCreated, BookingConfirmed, BookingRescheduled, BookingCancelled,
            BookingCompleted, BookingReminder, PaymentConfirmed,
            EventRegistration, EventStatusChanged, EventCancelled, EventReminder,
            FeedbackRequest, FollowUp,
        };

        public static bool IsReminder(string? trigger) =>
            string.Equals(trigger, BookingReminder, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trigger, EventReminder, StringComparison.OrdinalIgnoreCase);

        public static bool IsMarketingPurposeTrigger(string? trigger) =>
            string.Equals(trigger, FeedbackRequest, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trigger, FollowUp, StringComparison.OrdinalIgnoreCase);
    }

    public static class WhatsAppAutomationExecutionStatuses
    {
        public const string Pending = "pending";
        public const string Scheduled = "scheduled";
        public const string Queued = "queued";
        public const string Processing = "processing";
        public const string Accepted = "accepted";
        public const string Delivered = "delivered";
        public const string Read = "read";
        public const string Skipped = "skipped";
        public const string Failed = "failed";
        public const string Cancelled = "cancelled";
        public const string Unknown = "unknown";
    }

    public static class WhatsAppAutomationEntityTypes
    {
        public const string Appointment = "appointment";
        public const string EventBooking = "event_booking";
        public const string Payment = "payment";
    }

    public class WhatsAppAutomationRuleDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string name { get; set; } = string.Empty;
        public string trigger_type { get; set; } = string.Empty;
        public long whatsapp_connection_id { get; set; }
        public long message_template_id { get; set; }
        public bool is_enabled { get; set; } = true;
        public string purpose { get; set; } = WhatsAppConsentPurposes.Utility;
        public int delay_minutes { get; set; }
        public int? reminder_offset_minutes { get; set; }
        public string timezone { get; set; } = "UTC";
        public string conditions_json { get; set; } = "{}";
        public string variable_mapping { get; set; } = "[]";
        public int version { get; set; } = 1;
        public long? created_by { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public string template_name { get; set; } = string.Empty;
        public string template_status { get; set; } = string.Empty;
        public string business_phone { get; set; } = string.Empty;
    }

    public class WhatsAppAutomationRuleUpsertReq
    {
        public long id { get; set; }
        public string name { get; set; } = string.Empty;
        public string trigger_type { get; set; } = string.Empty;
        public long whatsapp_connection_id { get; set; }
        public long message_template_id { get; set; }
        public bool is_enabled { get; set; } = true;
        public string purpose { get; set; } = WhatsAppConsentPurposes.Utility;
        public int delay_minutes { get; set; }
        public int? reminder_offset_minutes { get; set; }
        public string timezone { get; set; } = "UTC";
        public string conditions_json { get; set; } = "{}";
        public List<WhatsAppCampaignVariableMap>? variable_mapping { get; set; }
        public int? expected_version { get; set; }
    }

    public class WhatsAppAutomationSelectReq
    {
        public string search { get; set; } = string.Empty;
        public string trigger_type { get; set; } = string.Empty;
        public bool? is_enabled { get; set; }
        public int limit { get; set; } = 50;
        public int offset { get; set; }
    }

    public class WhatsAppAutomationExecutionDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long automation_rule_id { get; set; }
        public string rule_name { get; set; } = string.Empty;
        public string business_event_type { get; set; } = string.Empty;
        public string business_entity_type { get; set; } = string.Empty;
        public long business_entity_id { get; set; }
        public string recipient_phone_normalized { get; set; } = string.Empty;
        public string recipient_display_name { get; set; } = string.Empty;
        public string idempotency_key { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public DateTime? scheduled_at { get; set; }
        public DateTime? processed_at { get; set; }
        public int attempt_count { get; set; }
        public string provider_message_id { get; set; } = string.Empty;
        public string provider_status { get; set; } = string.Empty;
        public string failure_category { get; set; } = string.Empty;
        public string failure_reason { get; set; } = string.Empty;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    public class WhatsAppAutomationExecutionSelectReq
    {
        public long? automation_rule_id { get; set; }
        public string status { get; set; } = string.Empty;
        public string search { get; set; } = string.Empty;
        public int limit { get; set; } = 50;
        public int offset { get; set; }
    }

    /// <summary>Domain hook payload — organisation_id must be trusted from the DB entity, not the client.</summary>
    public class WhatsAppAutomationBusinessEvent
    {
        public long organisation_id { get; set; }
        public string trigger_type { get; set; } = string.Empty;
        public string business_entity_type { get; set; } = string.Empty;
        public long business_entity_id { get; set; }
        public string recipient_phone { get; set; } = string.Empty;
        public string recipient_display_name { get; set; } = string.Empty;
        public DateTime? occurrence_at_utc { get; set; }
        public Dictionary<string, string> variables { get; set; } = new();
        public string context_json { get; set; } = "{}";
    }
}
