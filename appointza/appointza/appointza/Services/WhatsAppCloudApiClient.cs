using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using appointza.Models;
using appointza.Utils;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    /// <summary>
    /// Meta WhatsApp Cloud API client. Always uses the organisation's phone_number_id + access token.
    /// Graph API version comes from ApplicationSettings:whatsapp:api_version (configurable).
    /// </summary>
    public class WhatsAppCloudApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationEnvironment _settings;
        private readonly ILogger<WhatsAppCloudApiClient> _logger;

        public WhatsAppCloudApiClient(
            HttpClient httpClient,
            IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppCloudApiClient> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
        }

        public string ApiVersion =>
            string.IsNullOrWhiteSpace(_settings.whatsapp?.api_version)
                ? "v22.0"
                : _settings.whatsapp.api_version.Trim();

        public string BaseUrl =>
            string.IsNullOrWhiteSpace(_settings.whatsapp?.base_url)
                ? "https://graph.facebook.com"
                : _settings.whatsapp.base_url.Trim().TrimEnd('/');

        public async Task<WhatsAppCloudSendResult> SendTextAsync(
            string phoneNumberId,
            string accessToken,
            string toWaId,
            string text,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(phoneNumberId) || string.IsNullOrWhiteSpace(accessToken))
            {
                return FailSend("WhatsApp connection credentials are missing.", permanent: true);
            }

            if (string.IsNullOrWhiteSpace(toWaId) || string.IsNullOrWhiteSpace(text))
            {
                return FailSend("Recipient and text are required.", permanent: true);
            }

            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to = NormalizeWaId(toWaId),
                type = "text",
                text = new { preview_url = false, body = text.Trim() },
            };

            return await PostMessageAsync(phoneNumberId, accessToken, payload, cancellationToken);
        }

        /// <summary>
        /// Sends an approved WhatsApp template message via Meta Cloud API.
        /// </summary>
        public async Task<WhatsAppCloudSendResult> SendTemplateAsync(
            string phoneNumberId,
            string accessToken,
            string toWaId,
            string templateName,
            string languageCode,
            IReadOnlyList<string>? bodyParameters = null,
            IReadOnlyList<string>? headerParameters = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(phoneNumberId) || string.IsNullOrWhiteSpace(accessToken))
            {
                return FailSend("WhatsApp connection credentials are missing.", permanent: true);
            }

            if (string.IsNullOrWhiteSpace(toWaId) || string.IsNullOrWhiteSpace(templateName))
            {
                return FailSend("Recipient and template name are required.", permanent: true);
            }

            var components = new List<object>();
            if (headerParameters is { Count: > 0 })
            {
                components.Add(new
                {
                    type = "header",
                    parameters = headerParameters.Select(p => new { type = "text", text = p ?? "" }).ToArray(),
                });
            }
            if (bodyParameters is { Count: > 0 })
            {
                components.Add(new
                {
                    type = "body",
                    parameters = bodyParameters.Select(p => new { type = "text", text = p ?? "" }).ToArray(),
                });
            }

            var payload = new
            {
                messaging_product = "whatsapp",
                recipient_type = "individual",
                to = NormalizeWaId(toWaId),
                type = "template",
                template = new
                {
                    name = templateName.Trim(),
                    language = new { code = string.IsNullOrWhiteSpace(languageCode) ? "en" : languageCode.Trim() },
                    components,
                },
            };

            return await PostMessageAsync(phoneNumberId, accessToken, payload, cancellationToken);
        }

        private async Task<WhatsAppCloudSendResult> PostMessageAsync(
            string phoneNumberId,
            string accessToken,
            object payload,
            CancellationToken cancellationToken)
        {
            var url = $"{BaseUrl}/{ApiVersion}/{phoneNumberId.Trim()}/messages";
            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Trim());
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                var statusCode = (int)response.StatusCode;

                if (!response.IsSuccessStatusCode)
                {
                    var safeError = ExtractGraphError(body) ?? $"Meta API returned {statusCode}";
                    var errorCode = ExtractGraphErrorCode(body) ?? statusCode.ToString();
                    _logger.LogWarning(
                        "WhatsApp Cloud API send failed ({Status}): {Error}",
                        statusCode,
                        safeError);
                    return new WhatsAppCloudSendResult
                    {
                        success = false,
                        error = safeError,
                        error_code = errorCode,
                        http_status = statusCode,
                        is_rate_limited = response.StatusCode == System.Net.HttpStatusCode.TooManyRequests,
                        is_transient = IsTransientStatus(response.StatusCode),
                    };
                }

                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                var messageId = "";
                if (doc.RootElement.TryGetProperty("messages", out var messages) &&
                    messages.ValueKind == JsonValueKind.Array &&
                    messages.GetArrayLength() > 0)
                {
                    var first = messages[0];
                    if (first.TryGetProperty("id", out var idProp))
                    {
                        messageId = idProp.GetString() ?? "";
                    }
                }

                if (string.IsNullOrWhiteSpace(messageId))
                {
                    // HTTP success without a provider id — treat as uncertain; do not auto-resend.
                    return new WhatsAppCloudSendResult
                    {
                        success = false,
                        error = "Meta accepted the request without a message id.",
                        http_status = statusCode,
                        outcome_uncertain = true,
                        is_transient = false,
                    };
                }

                return new WhatsAppCloudSendResult
                {
                    success = true,
                    provider_message_id = messageId,
                    http_status = statusCode,
                };
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WhatsApp Cloud API send exception");
                return new WhatsAppCloudSendResult
                {
                    success = false,
                    error = "Network error contacting Meta — outcome uncertain.",
                    outcome_uncertain = true,
                    is_transient = true,
                };
            }
        }

        private static WhatsAppCloudSendResult FailSend(string error, bool permanent = false) =>
            new()
            {
                success = false,
                error = error,
                is_transient = !permanent,
            };

        public static string NormalizeWaId(string value)
        {
            var digits = new string((value ?? "").Where(char.IsDigit).ToArray());
            if (digits.Length == 10)
            {
                digits = "91" + digits;
            }
            return digits;
        }

        /// <summary>
        /// Lists message templates for a WABA with Meta cursor pagination.
        /// GET /{waba-id}/message_templates
        /// </summary>
        public async Task<WhatsAppCloudTemplatePage> ListMessageTemplatesAsync(
            string wabaId,
            string accessToken,
            string? afterCursor = null,
            int limit = 100,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(wabaId) || string.IsNullOrWhiteSpace(accessToken))
            {
                return FailPage("WhatsApp WABA credentials are missing.", auth: true);
            }

            limit = Math.Clamp(limit <= 0 ? 100 : limit, 1, 100);
            var url = $"{BaseUrl}/{ApiVersion}/{wabaId.Trim()}/message_templates?limit={limit}&fields=id,name,language,status,category,rejected_reason,quality_score,components";
            if (!string.IsNullOrWhiteSpace(afterCursor))
            {
                url += "&after=" + Uri.EscapeDataString(afterCursor);
            }

            return await SendTemplateGetPageAsync(url, accessToken, cancellationToken);
        }

        /// <summary>
        /// Fetches a single template by Meta template id.
        /// GET /{template-id}?fields=...
        /// </summary>
        public async Task<(bool success, WhatsAppCloudTemplateItem? item, string error, bool is_auth_error, bool is_transient)> GetMessageTemplateAsync(
            string providerTemplateId,
            string accessToken,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(providerTemplateId) || string.IsNullOrWhiteSpace(accessToken))
            {
                return (false, null, "Template id or credentials are missing.", true, false);
            }

            var url = $"{BaseUrl}/{ApiVersion}/{providerTemplateId.Trim()}?fields=id,name,language,status,category,rejected_reason,quality_score,components";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Trim());

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var err = ExtractGraphError(body) ?? $"Meta API returned {(int)response.StatusCode}";
                    _logger.LogWarning("WhatsApp template get failed ({Status}): {Error}", (int)response.StatusCode, err);
                    return (false, null, err, IsAuthStatus(response.StatusCode), IsTransientStatus(response.StatusCode));
                }

                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                return (true, ParseTemplateItem(doc.RootElement), "", false, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WhatsApp template get exception");
                return (false, null, "Transient network error contacting Meta.", false, true);
            }
        }

        /// <summary>
        /// Creates / submits a message template on the WABA.
        /// POST /{waba-id}/message_templates
        /// </summary>
        public async Task<WhatsAppCloudTemplateCreateResult> CreateMessageTemplateAsync(
            string wabaId,
            string accessToken,
            object payload,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(wabaId) || string.IsNullOrWhiteSpace(accessToken))
            {
                return new WhatsAppCloudTemplateCreateResult
                {
                    success = false,
                    error = "WhatsApp WABA credentials are missing.",
                    is_auth_error = true,
                };
            }

            var url = $"{BaseUrl}/{ApiVersion}/{wabaId.Trim()}/message_templates";
            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Trim());
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var err = ExtractGraphError(body) ?? $"Meta API returned {(int)response.StatusCode}";
                    _logger.LogWarning("WhatsApp template create failed ({Status}): {Error}", (int)response.StatusCode, err);
                    return new WhatsAppCloudTemplateCreateResult
                    {
                        success = false,
                        error = err,
                        is_auth_error = IsAuthStatus(response.StatusCode),
                        is_transient = IsTransientStatus(response.StatusCode),
                    };
                }

                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                var root = doc.RootElement;
                var id = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
                var status = root.TryGetProperty("status", out var stProp) ? stProp.GetString() ?? "" : "PENDING";
                return new WhatsAppCloudTemplateCreateResult
                {
                    success = true,
                    provider_template_id = id,
                    provider_status = status,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WhatsApp template create exception");
                return new WhatsAppCloudTemplateCreateResult
                {
                    success = false,
                    error = "Transient network error contacting Meta.",
                    is_transient = true,
                };
            }
        }

        private async Task<WhatsAppCloudTemplatePage> SendTemplateGetPageAsync(
            string url,
            string accessToken,
            CancellationToken cancellationToken)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Trim());

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var err = ExtractGraphError(body) ?? $"Meta API returned {(int)response.StatusCode}";
                    _logger.LogWarning("WhatsApp template list failed ({Status}): {Error}", (int)response.StatusCode, err);
                    return FailPage(err, IsAuthStatus(response.StatusCode), IsTransientStatus(response.StatusCode));
                }

                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
                var page = new WhatsAppCloudTemplatePage { success = true };
                if (doc.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in data.EnumerateArray())
                    {
                        page.items.Add(ParseTemplateItem(el));
                    }
                }

                if (doc.RootElement.TryGetProperty("paging", out var paging) &&
                    paging.TryGetProperty("cursors", out var cursors) &&
                    cursors.TryGetProperty("after", out var after) &&
                    paging.TryGetProperty("next", out _))
                {
                    page.next_cursor = after.GetString();
                }

                return page;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WhatsApp template list exception");
                return FailPage("Transient network error contacting Meta.", transient: true);
            }
        }

        private static WhatsAppCloudTemplateItem ParseTemplateItem(JsonElement el)
        {
            var componentsJson = "[]";
            if (el.TryGetProperty("components", out var components))
            {
                componentsJson = components.GetRawText();
            }

            var quality = "";
            if (el.TryGetProperty("quality_score", out var qs))
            {
                quality = qs.ValueKind == JsonValueKind.Object && qs.TryGetProperty("score", out var score)
                    ? score.GetString() ?? ""
                    : qs.ToString();
            }

            return new WhatsAppCloudTemplateItem
            {
                id = el.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
                name = el.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
                language = el.TryGetProperty("language", out var lang) ? lang.GetString() ?? "" : "",
                status = el.TryGetProperty("status", out var st) ? st.GetString() ?? "" : "",
                category = el.TryGetProperty("category", out var cat) ? cat.GetString() ?? "" : "",
                rejected_reason = el.TryGetProperty("rejected_reason", out var rr) ? rr.GetString() ?? "" : "",
                quality_score = quality,
                components_json = componentsJson,
            };
        }

        private static WhatsAppCloudTemplatePage FailPage(string error, bool auth = false, bool transient = false) =>
            new()
            {
                success = false,
                error = error,
                is_auth_error = auth,
                is_transient = transient,
            };

        private static bool IsAuthStatus(System.Net.HttpStatusCode code) =>
            code is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden;

        private static bool IsTransientStatus(System.Net.HttpStatusCode code) =>
            code == System.Net.HttpStatusCode.TooManyRequests ||
            (int)code >= 500;

        private static string? ExtractGraphError(string body)
        {
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("error", out var err) &&
                    err.TryGetProperty("message", out var msg))
                {
                    return msg.GetString();
                }
            }
            catch
            {
                // ignore parse errors
            }
            return null;
        }

        private static string? ExtractGraphErrorCode(string body)
        {
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("error", out var err) &&
                    err.TryGetProperty("code", out var code))
                {
                    return code.ValueKind == JsonValueKind.Number
                        ? code.GetInt32().ToString()
                        : code.GetString();
                }
            }
            catch
            {
                // ignore
            }
            return null;
        }
    }
}
