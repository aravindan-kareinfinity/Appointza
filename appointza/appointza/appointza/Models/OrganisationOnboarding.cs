using System.Text.Json.Serialization;

namespace appointza.Models
{
    public static class OnboardingOfferingKeys
    {
        public const string Stay = "stay";
        public const string Services = "services";
        public const string Events = "events";
        public const string Facilities = "facilities";
        public const string Classes = "classes";
        public const string Other = "other";

        public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
        {
            Stay, Services, Events, Facilities, Classes, Other,
        };

        public static readonly HashSet<string> SupportedCreate = new(StringComparer.OrdinalIgnoreCase)
        {
            Stay, Services, Events, Facilities, Classes, Other,
        };
    }

    public static class OnboardingStepKeys
    {
        public const string Offerings = "offerings";
        public const string CreateItems = "create_items";
        public const string Website = "website";
        public const string Timing = "timing";
        public const string Complete = "complete";
    }

    public class OrganisationOnboardingState
    {
        public long organisation_id { get; set; }
        public string current_step { get; set; } = OnboardingStepKeys.Offerings;
        public List<string> selected_offerings { get; set; } = new();
        public List<string> configured_offerings { get; set; } = new();
        public List<string> skipped_offerings { get; set; } = new();
        public bool profile_complete { get; set; }
        public bool location_complete { get; set; }
        public bool website_skipped { get; set; }
        public bool is_complete { get; set; }
        public DateTime? completed_at { get; set; }

        /// <summary>Live derived flags from existing tables (not stored).</summary>
        public OrganisationOnboardingDerived derived { get; set; } = new();

        /// <summary>Next actionable create-item offering, if any.</summary>
        public string? next_create_offering { get; set; }

        /// <summary>Human-readable gaps for unsupported or deferred types.</summary>
        public List<string> notes { get; set; } = new();
    }

    public class OrganisationOnboardingDerived
    {
        public bool has_location { get; set; }
        public bool has_custom_domain { get; set; }
        public bool has_website { get; set; }
        public bool has_timing { get; set; }
        public bool has_services { get; set; }
        public bool has_events { get; set; }
        public bool has_rooms { get; set; }
        public bool has_facilities { get; set; }
        public string? primary_location_customurl { get; set; }
        public long primary_location_id { get; set; }
    }

    public class OrganisationOnboardingSaveReq
    {
        public string? current_step { get; set; }
        public List<string>? selected_offerings { get; set; }
        public List<string>? configured_offerings { get; set; }
        public List<string>? skipped_offerings { get; set; }
        public bool? profile_complete { get; set; }
        public bool? location_complete { get; set; }
        public bool? website_skipped { get; set; }
        public bool? is_complete { get; set; }
    }

    public class OrganisationOnboardingMarkOfferingReq
    {
        public string offering { get; set; } = "";
        /// <summary>configured | skipped</summary>
        public string action { get; set; } = "configured";
    }

    public class OrganisationReferralVerifyReq
    {
        public string referral_code { get; set; } = "";
    }

    public class OrganisationReferralVerifyRes
    {
        public bool valid { get; set; }
        public string message { get; set; } = "";
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public string normalized_code { get; set; } = "";
    }
}
