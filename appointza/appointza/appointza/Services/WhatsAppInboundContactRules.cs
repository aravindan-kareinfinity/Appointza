namespace appointza.Services
{
    /// <summary>
    /// Pure helpers for inbound WhatsApp → CRM lead/client resolution (unit-testable).
    /// </summary>
    public static class WhatsAppInboundContactRules
    {
        public const string LeadSourceWhatsApp = "whatsapp";

        /// <summary>Digits-only WA id; 10-digit Indian numbers get 91 prefix.</summary>
        public static string NormalizePhoneDigits(string? value)
        {
            var digits = new string((value ?? "").Where(char.IsDigit).ToArray());
            if (digits.Length == 10)
            {
                digits = "91" + digits;
            }
            return digits;
        }

        /// <summary>Variants used when matching enquiries/users.mobile (org-scoped).</summary>
        public static IReadOnlyList<string> PhoneLookupVariants(string? waOrMobile)
        {
            var primary = NormalizePhoneDigits(waOrMobile);
            if (string.IsNullOrEmpty(primary))
            {
                return Array.Empty<string>();
            }

            var set = new HashSet<string>(StringComparer.Ordinal) { primary };
            if (primary.Length > 10)
            {
                set.Add(primary[^10..]);
            }
            if (primary.StartsWith("91", StringComparison.Ordinal) && primary.Length == 12)
            {
                set.Add(primary[2..]);
            }
            return set.ToList();
        }

        /// <summary>
        /// Prefer existing CRM name; only fill from WhatsApp profile when CRM name is empty.
        /// </summary>
        public static string PreferDisplayName(string? existingCrmName, string? whatsappProfileName, string? fallbackPhone)
        {
            var existing = (existingCrmName ?? "").Trim();
            if (!string.IsNullOrEmpty(existing))
            {
                return existing;
            }
            var profile = (whatsappProfileName ?? "").Trim();
            if (!string.IsNullOrEmpty(profile))
            {
                return profile;
            }
            var phone = NormalizePhoneDigits(fallbackPhone);
            return string.IsNullOrEmpty(phone) ? "WhatsApp contact" : phone;
        }

        public static bool HasValidSender(string? fromWaId) =>
            !string.IsNullOrWhiteSpace(NormalizePhoneDigits(fromWaId));
    }
}
