using System.Text.RegularExpressions;
using appointza.Models;

namespace appointza.Services
{
    /// <summary>
    /// Centralized Meta WhatsApp template draft validation for the configured Graph API surface.
    /// Limits mirror Meta Cloud API conventions used with ApplicationSettings:whatsapp:api_version.
    /// </summary>
    public static class WhatsAppTemplateValidation
    {
        private static readonly HashSet<string> Categories = new(StringComparer.OrdinalIgnoreCase)
        {
            "MARKETING", "UTILITY", "AUTHENTICATION",
        };

        private static readonly HashSet<string> HeaderTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT",
        };

        private static readonly Regex NameRegex = new(@"^[a-z0-9_]+$", RegexOptions.Compiled);
        private static readonly Regex PlaceholderRegex = new(@"\{\{(\d+)\}\}", RegexOptions.Compiled);

        public static List<string> ValidateCreate(WhatsAppTemplateCreateReq req)
        {
            var errors = new List<string>();
            if (req == null)
            {
                errors.Add("Request is required.");
                return errors;
            }

            var name = (req.template_name ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(name))
            {
                errors.Add("Template name is required.");
            }
            else if (name.Length > 512)
            {
                errors.Add("Template name is too long.");
            }
            else if (!NameRegex.IsMatch(name))
            {
                errors.Add("Template name must use lowercase letters, numbers, and underscores only.");
            }

            var language = (req.language_code ?? "").Trim();
            if (string.IsNullOrEmpty(language))
            {
                errors.Add("Language is required.");
            }

            var category = (req.category ?? "").Trim().ToUpperInvariant();
            if (!Categories.Contains(category))
            {
                errors.Add("Category must be MARKETING, UTILITY, or AUTHENTICATION.");
            }

            var headerType = string.IsNullOrWhiteSpace(req.header_type) ? "NONE" : req.header_type.Trim().ToUpperInvariant();
            if (!HeaderTypes.Contains(headerType))
            {
                errors.Add("Header type is not supported.");
            }

            if (headerType == "TEXT")
            {
                if (string.IsNullOrWhiteSpace(req.header_text))
                {
                    errors.Add("Header text is required when header type is TEXT.");
                }
                else if (req.header_text.Length > 60)
                {
                    errors.Add("Header text must be 60 characters or fewer.");
                }
            }

            var body = (req.body_text ?? "").Trim();
            if (string.IsNullOrEmpty(body))
            {
                errors.Add("Body text is required.");
            }
            else if (body.Length > 1024)
            {
                errors.Add("Body text must be 1024 characters or fewer.");
            }

            if (!string.IsNullOrWhiteSpace(req.footer_text) && req.footer_text.Trim().Length > 60)
            {
                errors.Add("Footer text must be 60 characters or fewer.");
            }

            var placeholders = PlaceholderRegex.Matches(body)
                .Select(m => int.Parse(m.Groups[1].Value))
                .Distinct()
                .OrderBy(i => i)
                .ToList();

            for (var i = 0; i < placeholders.Count; i++)
            {
                if (placeholders[i] != i + 1)
                {
                    errors.Add("Body placeholders must be sequential starting at {{1}}.");
                    break;
                }
            }

            if (placeholders.Count > 0)
            {
                var examples = req.body_examples ?? new List<string>();
                if (examples.Count < placeholders.Count)
                {
                    errors.Add($"Provide sample values for all {placeholders.Count} body variable(s).");
                }
            }

            var buttons = req.buttons ?? new List<WhatsAppTemplateButtonReq>();
            if (buttons.Count > 3)
            {
                errors.Add("A maximum of 3 buttons is supported.");
            }

            foreach (var button in buttons)
            {
                var type = (button.type ?? "").Trim().ToUpperInvariant();
                if (type is not ("QUICK_REPLY" or "URL" or "PHONE_NUMBER"))
                {
                    errors.Add($"Unsupported button type: {button.type}");
                    continue;
                }
                if (string.IsNullOrWhiteSpace(button.text) || button.text.Trim().Length > 25)
                {
                    errors.Add("Button text is required and must be 25 characters or fewer.");
                }
                if (type == "URL" && string.IsNullOrWhiteSpace(button.url))
                {
                    errors.Add("URL buttons require a URL.");
                }
                if (type == "PHONE_NUMBER" && string.IsNullOrWhiteSpace(button.phone_number))
                {
                    errors.Add("Phone buttons require a phone number.");
                }
            }

            return errors;
        }

        public static string MapProviderStatus(string? providerStatus)
        {
            var raw = (providerStatus ?? "").Trim().ToUpperInvariant();
            return raw switch
            {
                "APPROVED" => WhatsAppTemplateStatuses.Approved,
                "PENDING" or "PENDING_DELETION" => WhatsAppTemplateStatuses.Pending,
                "REJECTED" => WhatsAppTemplateStatuses.Rejected,
                "PAUSED" => WhatsAppTemplateStatuses.Paused,
                "DISABLED" => WhatsAppTemplateStatuses.Disabled,
                "IN_APPEAL" => WhatsAppTemplateStatuses.InAppeal,
                "DELETED" => WhatsAppTemplateStatuses.Archived,
                _ when string.IsNullOrEmpty(raw) => WhatsAppTemplateStatuses.Draft,
                _ => raw.ToLowerInvariant(),
            };
        }

        public static string ExtractHeaderType(string componentsJson)
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(
                    string.IsNullOrWhiteSpace(componentsJson) ? "[]" : componentsJson);
                if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return "";
                foreach (var c in doc.RootElement.EnumerateArray())
                {
                    if (!c.TryGetProperty("type", out var typeProp)) continue;
                    if (!string.Equals(typeProp.GetString(), "HEADER", StringComparison.OrdinalIgnoreCase)) continue;
                    if (c.TryGetProperty("format", out var format))
                    {
                        return format.GetString()?.ToUpperInvariant() ?? "TEXT";
                    }
                    return "TEXT";
                }
            }
            catch
            {
                // ignore
            }
            return "";
        }

        public static string ExtractBodyPreview(string componentsJson)
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(
                    string.IsNullOrWhiteSpace(componentsJson) ? "[]" : componentsJson);
                if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return "";
                foreach (var c in doc.RootElement.EnumerateArray())
                {
                    if (!c.TryGetProperty("type", out var typeProp)) continue;
                    if (!string.Equals(typeProp.GetString(), "BODY", StringComparison.OrdinalIgnoreCase)) continue;
                    return c.TryGetProperty("text", out var text) ? text.GetString() ?? "" : "";
                }
            }
            catch
            {
                // ignore
            }
            return "";
        }

        /// <summary>Count distinct {{1}}..{{n}} placeholders in body text.</summary>
        public static int CountBodyPlaceholders(string? bodyText)
        {
            if (string.IsNullOrWhiteSpace(bodyText)) return 0;
            return PlaceholderRegex.Matches(bodyText)
                .Select(m => int.Parse(m.Groups[1].Value))
                .Distinct()
                .Count();
        }

        public static int CountBodyPlaceholdersFromComponents(string? componentsJson)
        {
            var body = ExtractBodyPreview(componentsJson ?? "");
            return CountBodyPlaceholders(body);
        }

        public static int CountHeaderTextPlaceholdersFromComponents(string? componentsJson)
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(
                    string.IsNullOrWhiteSpace(componentsJson) ? "[]" : componentsJson);
                if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return 0;
                foreach (var c in doc.RootElement.EnumerateArray())
                {
                    if (!c.TryGetProperty("type", out var typeProp)) continue;
                    if (!string.Equals(typeProp.GetString(), "HEADER", StringComparison.OrdinalIgnoreCase)) continue;
                    var format = c.TryGetProperty("format", out var f) ? f.GetString() ?? "" : "";
                    if (!string.Equals(format, "TEXT", StringComparison.OrdinalIgnoreCase)) return 0;
                    var text = c.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "";
                    return CountBodyPlaceholders(text);
                }
            }
            catch
            {
                // ignore
            }
            return 0;
        }

        /// <summary>
        /// Meta error #132000 — parameter count must match template placeholders exactly.
        /// </summary>
        public static List<string> AlignParameterCount(
            IReadOnlyList<string>? provided,
            int expected,
            string? fillValue = null)
        {
            if (expected <= 0) return new List<string>();
            var fill = string.IsNullOrWhiteSpace(fillValue) ? "-" : fillValue.Trim();
            var list = new List<string>();
            if (provided != null)
            {
                foreach (var p in provided)
                {
                    if (list.Count >= expected) break;
                    list.Add(string.IsNullOrWhiteSpace(p) ? fill : p);
                }
            }
            while (list.Count < expected)
            {
                list.Add(fill);
            }
            return list;
        }
    }
}
