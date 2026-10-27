using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using appointza.Models;
using appointza.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    public class WhatsAppCrmService
    {
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly SecretProtector _secretProtector;
        private readonly WhatsAppCloudApiClient _cloudApi;
        private readonly WhatsAppCrmRealtimePublisher _realtime;
        private readonly ApplicationEnvironment _settings;
        private readonly IConfiguration _configuration;
        private readonly WhatsAppOutboundGuard _outboundGuard;
        private readonly ILogger<WhatsAppCrmService> _logger;
        private readonly IServiceProvider _services;
        private readonly EnquiryService _enquiryService;

        public WhatsAppCrmService(
            IDbProvider dbProvider,
            RequestState requestState,
            SecretProtector secretProtector,
            WhatsAppCloudApiClient cloudApi,
            WhatsAppCrmRealtimePublisher realtime,
            IOptions<ApplicationEnvironment> settings,
            IConfiguration configuration,
            WhatsAppOutboundGuard outboundGuard,
            ILogger<WhatsAppCrmService> logger,
            IServiceProvider services,
            EnquiryService enquiryService)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _secretProtector = secretProtector;
            _cloudApi = cloudApi;
            _realtime = realtime;
            _settings = settings.Value;
            _configuration = configuration;
            _outboundGuard = outboundGuard;
            _logger = logger;
            _services = services;
            _enquiryService = enquiryService;
        }

        public string GetWebhookVerifyToken()
        {
            var fromOptions = (_settings.whatsapp?.verify_token ?? "").Trim();
            if (!string.IsNullOrEmpty(fromOptions)) return fromOptions;
            return (_configuration["ApplicationSettings:whatsapp:verify_token"] ?? "").Trim();
        }

        public string GetMetaAppSecret()
        {
            var fromOptions = (_settings.whatsapp?.app_secret ?? "").Trim();
            if (!string.IsNullOrEmpty(fromOptions)) return fromOptions;
            return (_configuration["ApplicationSettings:whatsapp:app_secret"] ?? "").Trim();
        }

        public WhatsAppWebhookSetupDto GetWebhookSetup()
        {
            var token = GetWebhookVerifyToken();
            var secret = GetMetaAppSecret();
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning(
                    "whatsapp.verify_token is empty — set ApplicationSettings:whatsapp:verify_token in appsettings.json");
            }
            return new WhatsAppWebhookSetupDto
            {
                verify_token = token,
                callback_path = "/api/webhooks/whatsapp",
                verify_token_configured = !string.IsNullOrEmpty(token),
                app_secret_configured = !string.IsNullOrEmpty(secret),
            };
        }

        public bool ValidateWebhookSignature(string rawBody, string? signatureHeader)
        {
            var appSecret = GetMetaAppSecret();
            if (string.IsNullOrEmpty(appSecret))
            {
                // Dev convenience: accept inbound when app secret is not configured yet.
                // Set ApplicationSettings:whatsapp:app_secret in production.
                _logger.LogWarning(
                    "whatsapp.app_secret is not configured — accepting webhook without signature check (dev only).");
                return true;
            }

            return WhatsAppWebhookSecurity.ValidateSignature(appSecret, rawBody, signatureHeader);
        }

        public async Task<List<WhatsAppConversationDto>> SelectConversations(WhatsAppConversationSelectReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");

            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            var search = (req.search ?? "").Trim();
            var status = (req.status ?? "").Trim();

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var sql = @"
                SELECT c.id, c.organisation_id, c.whatsapp_connection_id, c.customer_id, c.enquiry_id,
                       c.customer_wa_id, c.customer_name,
                       c.assigned_user_id, c.status, c.last_message_at, c.last_message_preview, c.unread_count,
                       c.created_at, c.updated_at,
                       COALESCE(lm.direction, '') AS last_message_direction,
                       COALESCE(lm.status, '') AS last_message_status
                FROM whatsapp_conversations c
                LEFT JOIN LATERAL (
                    SELECT m.direction, m.status
                    FROM whatsapp_messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.created_at DESC, m.id DESC
                    LIMIT 1
                ) lm ON TRUE
                WHERE c.organisation_id = @organisation_id
            ";
            if (!string.IsNullOrEmpty(status))
            {
                sql += " AND c.status = @status";
            }
            if (req.unread_only)
            {
                sql += " AND c.unread_count > 0";
            }
            if (!string.IsNullOrEmpty(search))
            {
                sql += " AND (c.customer_wa_id ILIKE @search OR c.customer_name ILIKE @search OR c.last_message_preview ILIKE @search)";
            }
            sql += " ORDER BY c.last_message_at DESC NULLS LAST, c.id DESC LIMIT @limit OFFSET @offset;";

            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
            db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = offset;
            if (!string.IsNullOrEmpty(status))
            {
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            }
            if (!string.IsNullOrEmpty(search))
            {
                db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";
            }

            var list = new List<WhatsAppConversationDto>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(ReadConversation(reader));
            }
            return list;
        }

        public async Task<List<WhatsAppMessageDto>> SelectMessages(WhatsAppMessageSelectReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");
            if (req.conversation_id <= 0) throw new Exception("Conversation is required.");

            var limit = req.limit <= 0 ? 100 : Math.Min(req.limit, 500);

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureOwnsConversation(db, orgId, req.conversation_id);

            var sql = @"
                SELECT id, organisation_id, whatsapp_connection_id, conversation_id, provider_message_id,
                       direction, message_type, text_content, media_id, status, failure_reason,
                       provider_timestamp, created_at, updated_at
                FROM whatsapp_messages
                WHERE organisation_id = @organisation_id AND conversation_id = @conversation_id
                ORDER BY created_at ASC, id ASC
                LIMIT @limit;
            ";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "conversation_id", DbTypes.Types.Long).Value = req.conversation_id;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;

            var list = new List<WhatsAppMessageDto>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(ReadMessage(reader));
            }
            return list;
        }

        public async Task<WhatsAppMessageDto> SendText(WhatsAppSendTextReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");
            if (req.conversation_id <= 0) throw new Exception("Conversation is required.");
            var text = (req.text ?? "").Trim();
            if (string.IsNullOrEmpty(text)) throw new Exception("Message text is required.");

            await _outboundGuard.EnsureOutboundAllowedAsync();

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var conversation = await GetConversation(db, orgId, req.conversation_id);
            var connection = await GetConnectionById(db, conversation.whatsapp_connection_id, orgId);
            if (connection == null || !connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token))
            {
                throw new Exception("WhatsApp is not connected for this organisation.");
            }

            if (await IsOptedOutAnyPurpose(db, orgId, conversation.customer_wa_id))
            {
                throw new Exception("Recipient has opted out of WhatsApp messages.");
            }

            var now = DateTime.UtcNow;
            var messageId = await InsertMessage(
                db,
                orgId,
                connection.whatsapp_connection_id,
                conversation.id,
                "",
                WhatsAppMessageDirections.Outbound,
                "text",
                text,
                "",
                WhatsAppMessageStatuses.Queued,
                "",
                now);

            var send = await _cloudApi.SendTextAsync(
                connection.phone_number_id,
                connection.access_token,
                conversation.customer_wa_id,
                text);

            if (!send.success)
            {
                await UpdateMessageStatus(db, messageId, WhatsAppMessageStatuses.Failed, send.error, send.provider_message_id);
                var failed = await GetMessage(db, orgId, messageId)
                    ?? BuildOutboundMessageDto(
                        messageId, orgId, connection.whatsapp_connection_id, conversation.id,
                        send.provider_message_id, "text", text, WhatsAppMessageStatuses.Failed, send.error, now);
                await _realtime.PublishMessageStatusChanged(failed);
                throw new Exception(string.IsNullOrWhiteSpace(send.error)
                    ? "Failed to send WhatsApp message."
                    : send.error);
            }

            await UpdateMessageStatus(db, messageId, WhatsAppMessageStatuses.Sent, "", send.provider_message_id);
            await TouchConversation(db, conversation.id, text, now, incrementUnread: false);

            // Always return a DTO so the inbox can render the bubble even if a follow-up read flakes.
            var saved = await GetMessage(db, orgId, messageId)
                ?? BuildOutboundMessageDto(
                    messageId, orgId, connection.whatsapp_connection_id, conversation.id,
                    send.provider_message_id, "text", text, WhatsAppMessageStatuses.Sent, "", now);
            var updatedConversation = await GetConversation(db, orgId, conversation.id);
            await _realtime.PublishMessageUpserted(saved, updatedConversation);
            return saved;
        }

        public async Task<WhatsAppConversationDto> PatchConversation(WhatsAppConversationPatchReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");
            if (req.conversation_id <= 0) throw new Exception("Conversation is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureOwnsConversation(db, orgId, req.conversation_id);

            var sets = new List<string> { "updated_at = @updated_at" };
            if (!string.IsNullOrWhiteSpace(req.status))
            {
                var status = req.status.Trim().ToLowerInvariant();
                if (status is not (WhatsAppConversationStatuses.Open or WhatsAppConversationStatuses.Pending or WhatsAppConversationStatuses.Closed))
                {
                    throw new Exception("Invalid conversation status.");
                }
                sets.Add("status = @status");
            }
            if (req.assigned_user_id.HasValue)
            {
                sets.Add("assigned_user_id = @assigned_user_id");
            }
            if (req.mark_read == true)
            {
                sets.Add("unread_count = 0");
            }

            var sql = $@"
                UPDATE whatsapp_conversations
                SET {string.Join(", ", sets)}
                WHERE id = @id AND organisation_id = @organisation_id;
            ";
            using var update = db.GetCommand(sql);
            db.AddParameter(update, "id", DbTypes.Types.Long).Value = req.conversation_id;
            db.AddParameter(update, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(update, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(req.status))
            {
                db.AddParameter(update, "status", DbTypes.Types.String).Value = req.status.Trim().ToLowerInvariant();
            }
            if (req.assigned_user_id.HasValue)
            {
                db.AddParameter(update, "assigned_user_id", DbTypes.Types.Long).Value = req.assigned_user_id.Value;
            }
            await db.ExecuteNonQuery(update);

            var patched = await GetConversation(db, orgId, req.conversation_id);
            await _realtime.PublishConversationUpdated(patched);
            return patched;
        }

        public async Task<List<WhatsAppMessagingContactDto>> SelectMessagingContacts(WhatsAppMessagingContactSelectReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");

            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            var search = (req.search ?? "").Trim();
            var fetchCap = Math.Min(limit + offset + 200, 2000);

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var conversationByPhone = new Dictionary<string, long>(StringComparer.Ordinal);
            // Optional — never block the leads list if WhatsApp tables/connection lookup fails.
            try
            {
                var connection = await GetPrimaryConnection(db, orgId);
                if (connection != null)
                {
                    using var convCmd = db.GetCommand(@"
                        SELECT id, customer_wa_id
                        FROM whatsapp_conversations
                        WHERE organisation_id = @organisation_id
                          AND whatsapp_connection_id = @whatsapp_connection_id
                          AND COALESCE(customer_wa_id, '') <> '';");
                    db.AddParameter(convCmd, "organisation_id", DbTypes.Types.Long).Value = orgId;
                    db.AddParameter(convCmd, "whatsapp_connection_id", DbTypes.Types.Long).Value = connection.whatsapp_connection_id;
                    using var convReader = await db.Execute(convCmd);
                    while (await convReader.ReadAsync())
                    {
                        var wa = WhatsAppCloudApiClient.NormalizeWaId(convReader["customer_wa_id"]?.ToString() ?? "");
                        if (!string.IsNullOrEmpty(wa))
                        {
                            conversationByPhone[wa] = Convert.ToInt64(convReader["id"]);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "WhatsApp messaging-contacts: conversation lookup skipped for org {OrganisationId}", orgId);
            }

            var merged = new Dictionary<string, WhatsAppMessagingContactDto>(StringComparer.Ordinal);

            void TryAdd(string sourceType, long sourceId, long? customerId, long? enquiryId, string displayName, string? phoneRaw)
            {
                var phone = NormalizePhoneDigits(phoneRaw);
                var hasPhone = !string.IsNullOrEmpty(phone) && phone.Length >= 10;
                // Dedupe by WA phone when present; otherwise keep one row per lead/client.
                var key = hasPhone ? phone : $"{sourceType}:{sourceId}";
                if (!merged.TryGetValue(key, out var existing))
                {
                    long convId = 0;
                    if (hasPhone)
                    {
                        conversationByPhone.TryGetValue(phone, out convId);
                    }
                    merged[key] = new WhatsAppMessagingContactDto
                    {
                        source_type = sourceType,
                        source_id = sourceId,
                        customer_id = customerId,
                        enquiry_id = enquiryId,
                        display_name = (displayName ?? "").Trim(),
                        phone = hasPhone ? phone : "",
                        conversation_id = convId > 0 ? convId : null,
                    };
                    return;
                }

                if (string.IsNullOrWhiteSpace(existing.display_name) && !string.IsNullOrWhiteSpace(displayName))
                {
                    existing.display_name = displayName.Trim();
                }
                if (!existing.customer_id.HasValue && customerId is > 0)
                {
                    existing.customer_id = customerId;
                }
                if (!existing.enquiry_id.HasValue && enquiryId is > 0)
                {
                    existing.enquiry_id = enquiryId;
                }
                if (string.IsNullOrEmpty(existing.phone) && hasPhone)
                {
                    existing.phone = phone;
                }
                if (!existing.conversation_id.HasValue &&
                    hasPhone &&
                    conversationByPhone.TryGetValue(phone, out var linkedConvId) &&
                    linkedConvId > 0)
                {
                    existing.conversation_id = linkedConvId;
                }
            }

            // Leads first — same source as /organization/crm/contacts (enquiries).
            // Keep filter aligned with Enquiry.Select (is_active not required when null).
            try
            {
                var leadSql = @"
                    SELECT id,
                           COALESCE(NULLIF(TRIM(owner_name), ''), NULLIF(TRIM(name), ''), NULLIF(TRIM(business_name), ''), 'Lead') AS display_name,
                           mobile,
                           is_active,
                           created_at
                    FROM enquiries
                    WHERE organisation_id = @organisation_id
                ";
                if (!string.IsNullOrEmpty(search))
                {
                    leadSql += @" AND (
                        name ILIKE @search OR mobile ILIKE @search
                        OR owner_name ILIKE @search OR business_name ILIKE @search
                    )";
                }
                leadSql += " ORDER BY created_at DESC NULLS LAST, id DESC LIMIT @limit;";

                using var leadCmd = db.GetCommand(leadSql);
                db.AddParameter(leadCmd, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(leadCmd, "limit", DbTypes.Types.Integer).Value = fetchCap;
                if (!string.IsNullOrEmpty(search))
                {
                    db.AddParameter(leadCmd, "search", DbTypes.Types.String).Value = "%" + search + "%";
                }
                using var reader = await db.Execute(leadCmd);
                while (await reader.ReadAsync())
                {
                    // Match Contacts page: include active leads; treat NULL is_active as active.
                    if (reader["is_active"] != DBNull.Value && !Convert.ToBoolean(reader["is_active"]))
                    {
                        continue;
                    }
                    var enquiryId = Convert.ToInt64(reader["id"]);
                    TryAdd(
                        "lead",
                        enquiryId,
                        null,
                        enquiryId,
                        reader["display_name"]?.ToString() ?? "",
                        reader["mobile"]?.ToString());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WhatsApp messaging-contacts: failed loading enquiries for org {OrganisationId}", orgId);
                throw new Exception("Could not load CRM leads for WhatsApp inbox. " + ex.Message, ex);
            }

            // Booked clients — optional enrichment; never fail the whole list.
            try
            {
                var clientSql = @"
                    SELECT DISTINCT u.id AS customer_id, u.name, u.mobile
                    FROM users u
                    INNER JOIN appoinment a ON a.userid = u.id
                    WHERE a.organisationid = @organisation_id
                      AND COALESCE(a.isactive, TRUE) = TRUE
                      AND COALESCE(u.mobile, '') <> ''
                ";
                if (!string.IsNullOrEmpty(search))
                {
                    clientSql += " AND (u.name ILIKE @search OR u.mobile ILIKE @search)";
                }
                clientSql += " LIMIT @limit;";

                using var clientCmd = db.GetCommand(clientSql);
                db.AddParameter(clientCmd, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(clientCmd, "limit", DbTypes.Types.Integer).Value = fetchCap;
                if (!string.IsNullOrEmpty(search))
                {
                    db.AddParameter(clientCmd, "search", DbTypes.Types.String).Value = "%" + search + "%";
                }
                using var reader = await db.Execute(clientCmd);
                while (await reader.ReadAsync())
                {
                    TryAdd(
                        "client",
                        Convert.ToInt64(reader["customer_id"]),
                        Convert.ToInt64(reader["customer_id"]),
                        null,
                        reader["name"]?.ToString() ?? "",
                        reader["mobile"]?.ToString());
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "WhatsApp messaging-contacts: client lookup skipped for org {OrganisationId}", orgId);
            }

            return merged.Values
                .OrderByDescending(c => c.source_type == "lead") // leads before clients
                .ThenBy(c => string.IsNullOrWhiteSpace(c.display_name) ? c.phone : c.display_name, StringComparer.OrdinalIgnoreCase)
                .ThenBy(c => c.phone, StringComparer.Ordinal)
                .Skip(offset)
                .Take(limit)
                .ToList();
        }

        public async Task<WhatsAppConversationDto> EnsureConversation(WhatsAppEnsureConversationReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var phone = NormalizePhoneDigits(req.phone);
            var displayName = (req.display_name ?? "").Trim();

            if (string.IsNullOrEmpty(phone) && req.customer_id > 0)
            {
                phone = await ResolveUserMobile(db, req.customer_id);
                if (string.IsNullOrEmpty(displayName))
                {
                    displayName = await ResolveUserName(db, req.customer_id);
                }
            }

            if (string.IsNullOrEmpty(phone) && req.enquiry_id > 0)
            {
                (phone, var leadName) = await ResolveEnquiryPhone(db, orgId, req.enquiry_id);
                if (string.IsNullOrEmpty(displayName))
                {
                    displayName = leadName;
                }
            }

            if (string.IsNullOrEmpty(phone) || phone.Length < 10)
            {
                throw new Exception("A valid mobile number is required to start a WhatsApp chat.");
            }

            var connection = await GetPrimaryConnection(db, orgId);
            if (connection == null || !connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token))
            {
                throw new Exception("WhatsApp is not connected for this organisation.");
            }

            var waId = WhatsAppCloudApiClient.NormalizeWaId(phone);
            var conversationId = await FindConversationId(db, connection.whatsapp_connection_id, waId);
            if (conversationId <= 0)
            {
                conversationId = await UpsertConversation(
                    db,
                    orgId,
                    connection.whatsapp_connection_id,
                    waId,
                    displayName,
                    "",
                    DateTime.UtcNow,
                    incrementUnread: false);
            }
            else if (!string.IsNullOrEmpty(displayName))
            {
                using var nameUpdate = db.GetCommand(@"
                    UPDATE whatsapp_conversations
                    SET customer_name = CASE
                            WHEN COALESCE(customer_name, '') = '' THEN @customer_name
                            ELSE customer_name
                        END,
                        updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id;");
                db.AddParameter(nameUpdate, "customer_name", DbTypes.Types.String).Value = displayName;
                db.AddParameter(nameUpdate, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(nameUpdate, "id", DbTypes.Types.Long).Value = conversationId;
                db.AddParameter(nameUpdate, "organisation_id", DbTypes.Types.Long).Value = orgId;
                await db.ExecuteNonQuery(nameUpdate);
            }

            if (req.customer_id > 0)
            {
                using var linkCustomer = db.GetCommand(@"
                    UPDATE whatsapp_conversations
                    SET customer_id = @customer_id, updated_at = @updated_at
                    WHERE id = @id
                      AND organisation_id = @organisation_id
                      AND (customer_id IS NULL OR customer_id = 0);");
                db.AddParameter(linkCustomer, "customer_id", DbTypes.Types.Long).Value = req.customer_id;
                db.AddParameter(linkCustomer, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(linkCustomer, "id", DbTypes.Types.Long).Value = conversationId;
                db.AddParameter(linkCustomer, "organisation_id", DbTypes.Types.Long).Value = orgId;
                await db.ExecuteNonQuery(linkCustomer);
            }

            var conversation = await GetConversation(db, orgId, conversationId);
            await _realtime.PublishConversationUpdated(conversation);
            return conversation;
        }

        public async Task<WhatsAppMessageDto> SendTemplate(WhatsAppSendTemplateReq req)
        {
            var orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0) throw new Exception("Organisation is required.");
            if (req.conversation_id <= 0) throw new Exception("Conversation is required.");
            if (req.message_template_id <= 0) throw new Exception("Template is required.");

            await _outboundGuard.EnsureOutboundAllowedAsync();

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var conversation = await GetConversation(db, orgId, req.conversation_id);
            var connection = await GetConnectionById(db, conversation.whatsapp_connection_id, orgId);
            if (connection == null || !connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token))
            {
                throw new Exception("WhatsApp is not connected for this organisation.");
            }

            if (await IsOptedOutAnyPurpose(db, orgId, conversation.customer_wa_id))
            {
                throw new Exception("Recipient has opted out of WhatsApp messages.");
            }

            var (templateName, languageCode, templateContent, componentsJson) = await LoadApprovedTemplate(
                db,
                orgId,
                conversation.whatsapp_connection_id,
                req.message_template_id);

            var expectedBody = Math.Max(
                WhatsAppTemplateValidation.CountBodyPlaceholders(templateContent),
                WhatsAppTemplateValidation.CountBodyPlaceholdersFromComponents(componentsJson));
            var expectedHeader = WhatsAppTemplateValidation.CountHeaderTextPlaceholdersFromComponents(componentsJson);
            var fill = string.IsNullOrWhiteSpace(conversation.customer_name)
                ? conversation.customer_wa_id
                : conversation.customer_name;
            var headerParams = WhatsAppTemplateValidation.AlignParameterCount(
                req.header_parameters, expectedHeader, fill);
            var bodyParams = WhatsAppTemplateValidation.AlignParameterCount(
                req.body_parameters, expectedBody, fill);
            var preview = string.IsNullOrWhiteSpace(templateContent)
                ? $"[template:{templateName}]"
                : templateContent;

            var now = DateTime.UtcNow;
            var messageId = await InsertMessage(
                db,
                orgId,
                connection.whatsapp_connection_id,
                conversation.id,
                "",
                WhatsAppMessageDirections.Outbound,
                "template",
                preview,
                "",
                WhatsAppMessageStatuses.Queued,
                "",
                now);

            var send = await _cloudApi.SendTemplateAsync(
                connection.phone_number_id,
                connection.access_token,
                conversation.customer_wa_id,
                templateName,
                languageCode,
                bodyParams,
                headerParams);

            if (!send.success)
            {
                await UpdateMessageStatus(db, messageId, WhatsAppMessageStatuses.Failed, send.error, send.provider_message_id);
                var failed = await GetMessage(db, orgId, messageId);
                if (failed != null)
                {
                    await _realtime.PublishMessageStatusChanged(failed);
                }
                throw new Exception(string.IsNullOrWhiteSpace(send.error)
                    ? "Failed to send WhatsApp template."
                    : send.error);
            }

            await UpdateMessageStatus(db, messageId, WhatsAppMessageStatuses.Sent, "", send.provider_message_id);
            await TouchConversation(db, conversation.id, preview, now, incrementUnread: false);

            var saved = await GetMessage(db, orgId, messageId)
                ?? BuildOutboundMessageDto(
                    messageId, orgId, connection.whatsapp_connection_id, conversation.id,
                    send.provider_message_id, "template", preview, WhatsAppMessageStatuses.Sent, "", now);
            var updatedConversation = await GetConversation(db, orgId, conversation.id);
            await _realtime.PublishMessageUpserted(saved, updatedConversation);
            return saved;
        }

        public async Task<long> AcceptWebhookEvent(string rawBody, string? signatureHeader)
        {
            if (!ValidateWebhookSignature(rawBody, signatureHeader))
            {
                throw new UnauthorizedAccessException("Invalid WhatsApp webhook signature.");
            }

            var phoneNumberId = ExtractFirstPhoneNumberId(rawBody);
            long? organisationId = null;

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            if (!string.IsNullOrEmpty(phoneNumberId))
            {
                var connection = await FindConnectionByPhoneNumberId(db, phoneNumberId);
                if (connection != null)
                {
                    organisationId = connection.organisation_id;
                }
            }

            var eventKey = ComputeEventKey(rawBody);
            // Idempotent accept: unique provider_event_key (Phase 8) + ON CONFLICT returns existing id.
            var insertSql = @"
                INSERT INTO whatsapp_webhook_events (
                    provider_event_key, phone_number_id, organisation_id, payload,
                    processing_status, retry_count, received_at, last_error
                ) VALUES (
                    @provider_event_key, @phone_number_id, @organisation_id, @payload,
                    'received', 0, @received_at, ''
                )
                ON CONFLICT (provider_event_key) WHERE provider_event_key IS NOT NULL AND btrim(provider_event_key) <> ''
                DO NOTHING
                RETURNING id;
            ";
            using var command = db.GetCommand(insertSql);
            db.AddParameter(command, "provider_event_key", DbTypes.Types.String).Value = eventKey;
            db.AddParameter(command, "phone_number_id", DbTypes.Types.String).Value = phoneNumberId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value =
                organisationId.HasValue ? organisationId.Value : (object)DBNull.Value;
            db.AddParameter(command, "payload", DbTypes.Types.String).Value = rawBody ?? "";
            db.AddParameter(command, "received_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using (var reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    return Convert.ToInt64(reader["id"]);
                }
            }

            using var existing = db.GetCommand(@"
                SELECT id FROM whatsapp_webhook_events
                WHERE provider_event_key = @provider_event_key
                LIMIT 1;");
            db.AddParameter(existing, "provider_event_key", DbTypes.Types.String).Value = eventKey;
            using var existingReader = await db.Execute(existing);
            if (await existingReader.ReadAsync())
            {
                _logger.LogInformation("WhatsApp webhook duplicate event key acknowledged {EventKey}", Truncate(eventKey, 16));
                return Convert.ToInt64(existingReader["id"]);
            }

            throw new Exception("Failed to persist webhook event.");
        }

        /// <summary>
        /// Claims a batch of durable webhook events for the background worker (SKIP LOCKED).
        /// </summary>
        public async Task<List<long>> ClaimWebhookEventsAsync(
            int batchSize,
            int maxRetries,
            CancellationToken cancellationToken = default)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            // Claim received events, or failed events still under the retry budget.
            var sql = @"
                WITH claimable AS (
                    SELECT id
                    FROM whatsapp_webhook_events
                    WHERE (
                            processing_status = 'received'
                            OR (processing_status = 'failed' AND retry_count < @max_retries)
                            OR (
                                processing_status = 'processing'
                                AND received_at < (NOW() AT TIME ZONE 'utc') - INTERVAL '15 minutes'
                            )
                          )
                    ORDER BY received_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT @batch_size
                )
                UPDATE whatsapp_webhook_events e
                SET processing_status = 'processing',
                    last_error = ''
                FROM claimable c
                WHERE e.id = c.id
                RETURNING e.id;
            ";

            using var command = db.GetCommand(sql);
            db.AddParameter(command, "batch_size", DbTypes.Types.Integer).Value = batchSize;
            db.AddParameter(command, "max_retries", DbTypes.Types.Integer).Value = maxRetries;

            var ids = new List<long>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                cancellationToken.ThrowIfCancellationRequested();
                ids.Add(Convert.ToInt64(reader["id"]));
            }

            if (ids.Count > 0)
            {
                _logger.LogInformation("WhatsApp webhook worker claimed {Count} event(s)", ids.Count);
            }

            return ids;
        }

        public async Task ProcessWebhookEvent(long eventId)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            string payload;
            string phoneNumberId;
            using (var command = db.GetCommand(@"
                SELECT payload, phone_number_id, processing_status
                FROM whatsapp_webhook_events WHERE id = @id;"))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventId;
                using var reader = await db.Execute(command);
                if (!await reader.ReadAsync())
                {
                    return;
                }
                var status = reader["processing_status"]?.ToString() ?? "";
                if (status == "processed")
                {
                    return;
                }
                payload = reader["payload"]?.ToString() ?? "";
                phoneNumberId = reader["phone_number_id"]?.ToString() ?? "";
            }

            try
            {
                if (string.IsNullOrWhiteSpace(phoneNumberId))
                {
                    phoneNumberId = ExtractFirstPhoneNumberId(payload);
                }

                // Meta also sends account_update / WEBHOOK_CONFIG_UPDATED with no phone_number_id
                // and no messages — those must not look like a broken Phone Number ID mapping.
                if (string.IsNullOrEmpty(phoneNumberId) && !PayloadHasMessagesOrStatuses(payload))
                {
                    var kind = DescribeNonMessageWebhook(payload);
                    _logger.LogInformation(
                        "WhatsApp webhook event {EventId}: non-message event ({Kind}) — ignored",
                        eventId,
                        kind);
                    await MarkWebhookEvent(
                        db,
                        eventId,
                        "ignored",
                        $"Non-message webhook ({kind}); no chat to store.");
                    return;
                }

                var connection = string.IsNullOrEmpty(phoneNumberId)
                    ? null
                    : await FindConnectionByPhoneNumberId(db, phoneNumberId);

                // Meta's "Test" button always sends phone_number_id "123456123" (sample),
                // not your real Cloud API Phone Number ID. Route those to the only active connection.
                if (connection == null && IsMetaSamplePhoneNumberId(phoneNumberId))
                {
                    connection = await FindFirstActiveConnection(db);
                    if (connection != null)
                    {
                        _logger.LogInformation(
                            "WhatsApp webhook event {EventId}: Meta sample phone_number_id {SampleId} → org {OrganisationId} connection {ConnectionId}",
                            eventId,
                            phoneNumberId,
                            connection.organisation_id,
                            connection.whatsapp_connection_id);
                    }
                }

                if (connection == null)
                {
                    _logger.LogWarning(
                        "WhatsApp webhook event {EventId}: unknown phone_number_id '{PhoneNumberId}' — ignored",
                        eventId,
                        phoneNumberId);
                    var err = string.IsNullOrEmpty(phoneNumberId)
                        ? "Webhook had messages but no metadata.phone_number_id."
                        : IsMetaSamplePhoneNumberId(phoneNumberId)
                            ? "Meta Test used sample phone_number_id 123456123, but no active WhatsApp connection exists in Appointza."
                            : $"No organisation mapped to phone_number_id '{phoneNumberId}'. Save that Phone Number ID in Profile → WhatsApp (yours is not Meta's test id 123456123).";
                    await MarkWebhookEvent(db, eventId, "ignored", err);
                    return;
                }

                await ProcessWebhookPayload(db, connection, payload);
                await MarkWebhookEvent(db, eventId, "processed", "");
                _logger.LogInformation(
                    "WhatsApp webhook event {EventId} processed for organisation {OrganisationId}",
                    eventId,
                    connection.organisation_id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed processing WhatsApp webhook event {EventId}", eventId);
                await MarkWebhookEvent(db, eventId, "failed", SanitizeError(ex.Message));
            }
        }

        public async Task<WhatsAppConversationDto?> GetConversationById(long conversationId, long organisationId = 0)
        {
            var orgId = ResolveOrganisationId(organisationId);
            if (orgId <= 0) throw new Exception("Organisation is required.");
            if (conversationId <= 0) throw new Exception("Conversation is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            return await GetConversation(db, orgId, conversationId);
        }

        private async Task ProcessWebhookPayload(IDb db, WhatsAppOrgConnectionContext connection, string payload)
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(payload) ? "{}" : payload);
            if (!doc.RootElement.TryGetProperty("entry", out var entries) || entries.ValueKind != JsonValueKind.Array)
            {
                return;
            }

            foreach (var entry in entries.EnumerateArray())
            {
                if (!entry.TryGetProperty("changes", out var changes) || changes.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var change in changes.EnumerateArray())
                {
                    if (!change.TryGetProperty("value", out var value))
                    {
                        continue;
                    }

                    if (value.TryGetProperty("messages", out var messages) && messages.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var message in messages.EnumerateArray())
                        {
                            await UpsertInboundMessage(db, connection, value, message);
                        }
                    }

                    if (value.TryGetProperty("statuses", out var statuses) && statuses.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var status in statuses.EnumerateArray())
                        {
                            await ApplyStatusUpdate(db, connection, status);
                        }
                    }
                }
            }
        }

        private async Task UpsertInboundMessage(
            IDb db,
            WhatsAppOrgConnectionContext connection,
            JsonElement value,
            JsonElement message)
        {
            var from = message.TryGetProperty("from", out var fromProp) ? fromProp.GetString() ?? "" : "";
            var providerMessageId = message.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            if (string.IsNullOrEmpty(from) || string.IsNullOrEmpty(providerMessageId))
            {
                return;
            }

            if (await MessageExists(db, providerMessageId))
            {
                return;
            }

            var type = message.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "unknown" : "unknown";
            var text = "";
            var mediaId = "";
            if (type == "text" && message.TryGetProperty("text", out var textObj) &&
                textObj.TryGetProperty("body", out var bodyProp))
            {
                text = bodyProp.GetString() ?? "";
            }
            else if (message.TryGetProperty(type, out var mediaObj) &&
                     mediaObj.ValueKind == JsonValueKind.Object &&
                     mediaObj.TryGetProperty("id", out var mediaIdProp))
            {
                mediaId = mediaIdProp.GetString() ?? "";
                text = $"[{type}]";
            }
            else
            {
                text = $"[{type}]";
            }

            var contactName = "";
            if (value.TryGetProperty("contacts", out var contacts) &&
                contacts.ValueKind == JsonValueKind.Array &&
                contacts.GetArrayLength() > 0)
            {
                var contact = contacts[0];
                if (contact.TryGetProperty("profile", out var profile) &&
                    profile.TryGetProperty("name", out var nameProp))
                {
                    contactName = nameProp.GetString() ?? "";
                }
            }

            DateTime? providerTs = null;
            if (message.TryGetProperty("timestamp", out var tsProp) &&
                long.TryParse(tsProp.GetString(), out var unix))
            {
                providerTs = DateTimeOffset.FromUnixTimeSeconds(unix).UtcDateTime;
            }

            long? linkedCustomerId = null;
            long? linkedEnquiryId = null;
            var displayName = contactName;
            try
            {
                var resolved = await ResolveOrCreateInboundContact(
                    db,
                    connection.organisation_id,
                    from,
                    contactName);
                linkedCustomerId = resolved.customerId;
                linkedEnquiryId = resolved.enquiryId > 0 ? resolved.enquiryId : null;
                displayName = WhatsAppInboundContactRules.PreferDisplayName(
                    resolved.displayName,
                    contactName,
                    from);
            }
            catch (Exception ex)
            {
                // Keep message/conversation path alive; contact link can be repaired later.
                _logger.LogWarning(
                    ex,
                    "WhatsApp inbound contact resolve failed for org {OrganisationId}; continuing without link",
                    connection.organisation_id);
            }

            var conversationId = await UpsertConversation(
                db,
                connection.organisation_id,
                connection.whatsapp_connection_id,
                from,
                displayName,
                text,
                providerTs ?? DateTime.UtcNow,
                incrementUnread: true,
                customerId: linkedCustomerId,
                enquiryId: linkedEnquiryId);

            var messageId = await InsertMessage(
                db,
                connection.organisation_id,
                connection.whatsapp_connection_id,
                conversationId,
                providerMessageId,
                WhatsAppMessageDirections.Inbound,
                type,
                text,
                mediaId,
                WhatsAppMessageStatuses.Received,
                "",
                providerTs);

            if (IsStopKeyword(text))
            {
                await UpsertOptOutAllPurposes(db, connection.organisation_id, from, "webhook_stop");
                _logger.LogInformation(
                    "WhatsApp STOP opt-out recorded for organisation {OrganisationId}",
                    connection.organisation_id);
            }

            var inbound = await GetMessage(db, connection.organisation_id, messageId);
            var conversation = await GetConversation(db, connection.organisation_id, conversationId);
            if (inbound != null)
            {
                await _realtime.PublishMessageUpserted(inbound, conversation);
            }
            else
            {
                await _realtime.PublishConversationUpdated(conversation);
            }
        }

        // Status transition rules: see WhatsAppMessageStatusRules.

        private async Task ApplyStatusUpdate(IDb db, WhatsAppOrgConnectionContext connection, JsonElement status)
        {
            var providerMessageId = status.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var statusValue = status.TryGetProperty("status", out var stProp) ? stProp.GetString() ?? "" : "";
            if (string.IsNullOrEmpty(providerMessageId) || string.IsNullOrEmpty(statusValue))
            {
                return;
            }

            var mapped = statusValue.ToLowerInvariant() switch
            {
                "sent" => WhatsAppMessageStatuses.Sent,
                "delivered" => WhatsAppMessageStatuses.Delivered,
                "read" => WhatsAppMessageStatuses.Read,
                "failed" => WhatsAppMessageStatuses.Failed,
                _ => statusValue.ToLowerInvariant(),
            };

            var failure = "";
            if (status.TryGetProperty("errors", out var errors) &&
                errors.ValueKind == JsonValueKind.Array &&
                errors.GetArrayLength() > 0 &&
                errors[0].TryGetProperty("message", out var errMsg))
            {
                failure = SanitizeError(errMsg.GetString() ?? "");
            }

            string? currentStatus = null;
            long? messageId = null;
            using (var find = db.GetCommand(@"
                SELECT id, status
                FROM whatsapp_messages
                WHERE organisation_id = @organisation_id
                  AND whatsapp_connection_id = @whatsapp_connection_id
                  AND provider_message_id = @provider_message_id
                LIMIT 1;"))
            {
                db.AddParameter(find, "organisation_id", DbTypes.Types.Long).Value = connection.organisation_id;
                db.AddParameter(find, "whatsapp_connection_id", DbTypes.Types.Long).Value = connection.whatsapp_connection_id;
                db.AddParameter(find, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                using var reader = await db.Execute(find);
                if (!await reader.ReadAsync())
                {
                    return;
                }
                messageId = Convert.ToInt64(reader["id"]);
                currentStatus = reader["status"]?.ToString() ?? "";
            }

            if (!WhatsAppMessageStatusRules.CanApply(currentStatus ?? "", mapped))
            {
                _logger.LogInformation(
                    "Skipped WhatsApp status downgrade/duplicate for message {MessageId}: {Current} -> {Next}",
                    messageId,
                    currentStatus,
                    mapped);
                return;
            }

            var sql = @"
                UPDATE whatsapp_messages
                SET status = @status,
                    failure_reason = CASE WHEN @failure_reason = '' THEN failure_reason ELSE @failure_reason END,
                    updated_at = @updated_at
                WHERE id = @id
                  AND organisation_id = @organisation_id
                  AND whatsapp_connection_id = @whatsapp_connection_id;
            ";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = messageId!.Value;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = mapped;
            db.AddParameter(command, "failure_reason", DbTypes.Types.String).Value = failure;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = connection.organisation_id;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = connection.whatsapp_connection_id;
            await db.ExecuteNonQuery(command);

            var updated = await GetMessage(db, connection.organisation_id, messageId!.Value);
            if (updated != null)
            {
                await _realtime.PublishMessageStatusChanged(updated);
                try
                {
                    var conversation = await GetConversation(db, connection.organisation_id, updated.conversation_id);
                    await _realtime.PublishConversationUpdated(conversation);
                }
                catch
                {
                    // conversation lookup is best-effort for status events
                }
            }

            // Phase 6: reconcile campaign recipient + counters (idempotent).
            try
            {
                var dispatch = _services.GetService(typeof(WhatsAppCampaignDispatchService)) as WhatsAppCampaignDispatchService;
                if (dispatch != null)
                {
                    await dispatch.ApplyProviderStatusToCampaignAsync(
                        db,
                        connection.organisation_id,
                        connection.whatsapp_connection_id,
                        providerMessageId,
                        mapped,
                        failure);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Campaign status reconciliation failed for {ProviderMessageId}", providerMessageId);
            }

            // Phase 7: reconcile automation executions (idempotent).
            try
            {
                var automation = _services.GetService(typeof(WhatsAppAutomationService)) as WhatsAppAutomationService;
                if (automation != null)
                {
                    await automation.ApplyProviderStatusAsync(
                        db,
                        connection.organisation_id,
                        connection.whatsapp_connection_id,
                        providerMessageId,
                        mapped,
                        failure);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Automation status reconciliation failed for {ProviderMessageId}", providerMessageId);
            }
        }

        private static string SanitizeError(string message)
        {
            if (string.IsNullOrEmpty(message)) return "";
            // Never echo bearer tokens if a provider somehow included them.
            var cleaned = System.Text.RegularExpressions.Regex.Replace(
                message,
                @"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*",
                "$1***",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            return Truncate(cleaned, 500);
        }

        private async Task<long> UpsertConversation(
            IDb db,
            long organisationId,
            long whatsappConnectionId,
            string customerWaId,
            string customerName,
            string preview,
            DateTime lastMessageAt,
            bool incrementUnread,
            long? customerId = null,
            long? enquiryId = null)
        {
            var sql = @"
                INSERT INTO whatsapp_conversations (
                    organisation_id, whatsapp_connection_id, customer_id, enquiry_id,
                    customer_wa_id, customer_name,
                    status, last_message_at, last_message_preview, unread_count, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @customer_id, @enquiry_id,
                    @customer_wa_id, @customer_name,
                    'open', @last_message_at, @last_message_preview, @unread_count, @created_at, @updated_at
                )
                ON CONFLICT (whatsapp_connection_id, customer_wa_id) DO UPDATE SET
                    customer_name = CASE
                        WHEN EXCLUDED.customer_name = '' THEN whatsapp_conversations.customer_name
                        ELSE EXCLUDED.customer_name
                    END,
                    customer_id = COALESCE(whatsapp_conversations.customer_id, EXCLUDED.customer_id),
                    enquiry_id = COALESCE(whatsapp_conversations.enquiry_id, EXCLUDED.enquiry_id),
                    last_message_at = EXCLUDED.last_message_at,
                    last_message_preview = EXCLUDED.last_message_preview,
                    unread_count = CASE
                        WHEN @increment_unread THEN whatsapp_conversations.unread_count + 1
                        ELSE whatsapp_conversations.unread_count
                    END,
                    status = CASE
                        WHEN whatsapp_conversations.status = 'closed' THEN 'open'
                        ELSE whatsapp_conversations.status
                    END,
                    updated_at = EXCLUDED.updated_at
                RETURNING id;
            ";
            using var command = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
            db.AddParameter(command, "customer_id", DbTypes.Types.Long).Value =
                customerId is > 0 ? customerId.Value : DBNull.Value;
            db.AddParameter(command, "enquiry_id", DbTypes.Types.Long).Value =
                enquiryId is > 0 ? enquiryId.Value : DBNull.Value;
            db.AddParameter(command, "customer_wa_id", DbTypes.Types.String).Value = WhatsAppCloudApiClient.NormalizeWaId(customerWaId);
            db.AddParameter(command, "customer_name", DbTypes.Types.String).Value = customerName ?? "";
            db.AddParameter(command, "last_message_at", DbTypes.Types.DateTime).Value = lastMessageAt;
            db.AddParameter(command, "last_message_preview", DbTypes.Types.String).Value =
                Truncate(preview ?? "", 280);
            db.AddParameter(command, "unread_count", DbTypes.Types.Integer).Value = incrementUnread ? 1 : 0;
            db.AddParameter(command, "increment_unread", DbTypes.Types.Boolean).Value = incrementUnread;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

            using var reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return Convert.ToInt64(reader["id"]);
            }
            throw new Exception("Failed to upsert conversation.");
        }

        private async Task<long> InsertMessage(
            IDb db,
            long organisationId,
            long whatsappConnectionId,
            long conversationId,
            string providerMessageId,
            string direction,
            string messageType,
            string textContent,
            string mediaId,
            string status,
            string failureReason,
            DateTime? providerTimestamp)
        {
            var sql = @"
                INSERT INTO whatsapp_messages (
                    organisation_id, whatsapp_connection_id, conversation_id, provider_message_id,
                    direction, message_type, text_content, media_id, status, failure_reason,
                    provider_timestamp, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @conversation_id, @provider_message_id,
                    @direction, @message_type, @text_content, @media_id, @status, @failure_reason,
                    @provider_timestamp, @created_at, @updated_at
                )
                RETURNING id;
            ";
            var now = DateTime.UtcNow;
            long newId = 0;
            using (var command = db.GetCommand(sql))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
                db.AddParameter(command, "conversation_id", DbTypes.Types.Long).Value = conversationId;
                db.AddParameter(command, "provider_message_id", DbTypes.Types.String).Value = providerMessageId ?? "";
                db.AddParameter(command, "direction", DbTypes.Types.String).Value = direction;
                db.AddParameter(command, "message_type", DbTypes.Types.String).Value = messageType;
                db.AddParameter(command, "text_content", DbTypes.Types.String).Value = textContent ?? "";
                db.AddParameter(command, "media_id", DbTypes.Types.String).Value = mediaId ?? "";
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
                db.AddParameter(command, "failure_reason", DbTypes.Types.String).Value = failureReason ?? "";
                db.AddParameter(command, "provider_timestamp", DbTypes.Types.DateTime).Value =
                    providerTimestamp.HasValue ? providerTimestamp.Value : (object)DBNull.Value;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

                using var reader = await db.Execute(command);
                if (await reader.ReadAsync())
                {
                    newId = Convert.ToInt64(reader["id"]);
                }
            }
            if (newId <= 0) throw new Exception("Failed to insert message.");
            return newId;
        }

        private static WhatsAppMessageDto BuildOutboundMessageDto(
            long messageId,
            long organisationId,
            long whatsappConnectionId,
            long conversationId,
            string? providerMessageId,
            string messageType,
            string textContent,
            string status,
            string failureReason,
            DateTime createdAt) =>
            new()
            {
                id = messageId,
                organisation_id = organisationId,
                whatsapp_connection_id = whatsappConnectionId,
                conversation_id = conversationId,
                provider_message_id = providerMessageId ?? "",
                direction = WhatsAppMessageDirections.Outbound,
                message_type = messageType,
                text_content = textContent ?? "",
                media_id = "",
                status = status,
                failure_reason = failureReason ?? "",
                provider_timestamp = createdAt,
                created_at = createdAt,
                updated_at = DateTime.UtcNow,
            };

        private async Task UpdateMessageStatus(
            IDb db,
            long messageId,
            string status,
            string failureReason,
            string providerMessageId)
        {
            var sql = @"
                UPDATE whatsapp_messages
                SET status = @status,
                    failure_reason = @failure_reason,
                    provider_message_id = CASE
                        WHEN @provider_message_id = '' THEN provider_message_id
                        ELSE @provider_message_id
                    END,
                    updated_at = @updated_at
                WHERE id = @id;
            ";
            // ExecuteNonQuery disposes the command — do not wrap in using.
            var command = db.GetCommand(sql);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = messageId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "failure_reason", DbTypes.Types.String).Value = failureReason ?? "";
            db.AddParameter(command, "provider_message_id", DbTypes.Types.String).Value = providerMessageId ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task TouchConversation(
            IDb db,
            long conversationId,
            string preview,
            DateTime lastMessageAt,
            bool incrementUnread)
        {
            var sql = @"
                UPDATE whatsapp_conversations
                SET last_message_at = @last_message_at,
                    last_message_preview = @last_message_preview,
                    unread_count = CASE WHEN @increment_unread THEN unread_count + 1 ELSE unread_count END,
                    updated_at = @updated_at
                WHERE id = @id;
            ";
            var command = db.GetCommand(sql);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = conversationId;
            db.AddParameter(command, "last_message_at", DbTypes.Types.DateTime).Value = lastMessageAt;
            db.AddParameter(command, "last_message_preview", DbTypes.Types.String).Value = Truncate(preview, 280);
            db.AddParameter(command, "increment_unread", DbTypes.Types.Boolean).Value = incrementUnread;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task MarkWebhookEvent(IDb db, long eventId, string status, string error)
        {
            var sql = @"
                UPDATE whatsapp_webhook_events
                SET processing_status = @processing_status,
                    processed_at = @processed_at,
                    last_error = @last_error,
                    retry_count = retry_count + CASE WHEN @processing_status = 'failed' THEN 1 ELSE 0 END
                WHERE id = @id;
            ";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventId;
            db.AddParameter(command, "processing_status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "processed_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "last_error", DbTypes.Types.String).Value = error ?? "";
            await db.ExecuteNonQuery(command);
        }

        private async Task<bool> MessageExists(IDb db, string providerMessageId)
        {
            using var command = db.GetCommand(@"
                SELECT 1 FROM whatsapp_messages WHERE provider_message_id = @provider_message_id LIMIT 1;");
            db.AddParameter(command, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
            using var reader = await db.Execute(command);
            return await reader.ReadAsync();
        }

        public async Task<WhatsAppOrgConnectionContext?> FindConnectionByPhoneNumberId(string phoneNumberId)
        {
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            return await FindConnectionByPhoneNumberId(db, phoneNumberId);
        }

        private async Task<WhatsAppOrgConnectionContext?> FindConnectionByPhoneNumberId(IDb db, string phoneNumberId)
        {
            var sql = @"
                SELECT
                    oi.organisation_id, oi.id AS integration_id, oi.status, oi.is_active,
                    wc.id AS whatsapp_connection_id, wc.phone_number_id, wc.waba_id, wc.business_phone,
                    s.encrypted_value
                FROM whatsapp_connections wc
                INNER JOIN organization_integrations oi ON oi.id = wc.integration_id
                LEFT JOIN integration_secrets s
                    ON s.integration_id = oi.id AND s.secret_type = @secret_type
                WHERE wc.phone_number_id = @phone_number_id
                  AND oi.provider = 'whatsapp'
                LIMIT 1;
            ";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "phone_number_id", DbTypes.Types.String).Value = phoneNumberId.Trim();
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.AccessToken;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }
            return ReadConnectionContext(reader);
        }

        /// <summary>Meta webhook "Test" payloads use this placeholder Phone Number ID.</summary>
        private static bool IsMetaSamplePhoneNumberId(string? phoneNumberId) =>
            string.Equals((phoneNumberId ?? "").Trim(), "123456123", StringComparison.Ordinal);

        private async Task<WhatsAppOrgConnectionContext?> FindFirstActiveConnection(IDb db)
        {
            var sql = @"
                SELECT
                    oi.organisation_id, oi.id AS integration_id, oi.status, oi.is_active,
                    wc.id AS whatsapp_connection_id, wc.phone_number_id, wc.waba_id, wc.business_phone,
                    s.encrypted_value
                FROM whatsapp_connections wc
                INNER JOIN organization_integrations oi ON oi.id = wc.integration_id
                LEFT JOIN integration_secrets s
                    ON s.integration_id = oi.id AND s.secret_type = @secret_type
                WHERE oi.provider = 'whatsapp'
                  AND oi.is_active = TRUE
                  AND oi.status = 'connected'
                ORDER BY oi.updated_at DESC NULLS LAST, wc.id DESC
                LIMIT 1;
            ";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.AccessToken;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }
            return ReadConnectionContext(reader);
        }

        private async Task<WhatsAppOrgConnectionContext?> GetConnectionById(IDb db, long whatsappConnectionId, long organisationId)
        {
            var sql = @"
                SELECT
                    oi.organisation_id, oi.id AS integration_id, oi.status, oi.is_active,
                    wc.id AS whatsapp_connection_id, wc.phone_number_id, wc.waba_id, wc.business_phone,
                    s.encrypted_value
                FROM whatsapp_connections wc
                INNER JOIN organization_integrations oi ON oi.id = wc.integration_id
                LEFT JOIN integration_secrets s
                    ON s.integration_id = oi.id AND s.secret_type = @secret_type
                WHERE wc.id = @whatsapp_connection_id
                  AND oi.organisation_id = @organisation_id
                  AND oi.provider = 'whatsapp'
                LIMIT 1;
            ";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.AccessToken;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }
            return ReadConnectionContext(reader);
        }

        private WhatsAppOrgConnectionContext ReadConnectionContext(DbDataReader reader)
        {
            var encrypted = reader["encrypted_value"] == DBNull.Value ? "" : reader["encrypted_value"].ToString() ?? "";
            var token = "";
            if (!string.IsNullOrEmpty(encrypted))
            {
                try
                {
                    token = _secretProtector.Decrypt(encrypted);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to decrypt WhatsApp access token");
                }
            }

            return new WhatsAppOrgConnectionContext
            {
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                integration_id = Convert.ToInt64(reader["integration_id"]),
                whatsapp_connection_id = Convert.ToInt64(reader["whatsapp_connection_id"]),
                phone_number_id = reader["phone_number_id"]?.ToString() ?? "",
                waba_id = reader["waba_id"]?.ToString() ?? "",
                business_phone = reader["business_phone"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "",
                is_active = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                access_token = token,
            };
        }

        private async Task EnsureOwnsConversation(IDb db, long organisationId, long conversationId)
        {
            using var command = db.GetCommand(@"
                SELECT 1 FROM whatsapp_conversations
                WHERE id = @id AND organisation_id = @organisation_id LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = conversationId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception("Conversation not found.");
            }
        }

        private async Task<WhatsAppConversationDto> GetConversation(IDb db, long organisationId, long conversationId)
        {
            using var command = db.GetCommand(@"
                SELECT c.id, c.organisation_id, c.whatsapp_connection_id, c.customer_id, c.enquiry_id,
                       c.customer_wa_id, c.customer_name,
                       c.assigned_user_id, c.status, c.last_message_at, c.last_message_preview, c.unread_count,
                       c.created_at, c.updated_at,
                       COALESCE(lm.direction, '') AS last_message_direction,
                       COALESCE(lm.status, '') AS last_message_status
                FROM whatsapp_conversations c
                LEFT JOIN LATERAL (
                    SELECT m.direction, m.status
                    FROM whatsapp_messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.created_at DESC, m.id DESC
                    LIMIT 1
                ) lm ON TRUE
                WHERE c.id = @id AND c.organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = conversationId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception("Conversation not found.");
            }
            return ReadConversation(reader);
        }

        private async Task<WhatsAppMessageDto?> GetMessage(IDb db, long organisationId, long messageId)
        {
            using var command = db.GetCommand(@"
                SELECT id, organisation_id, whatsapp_connection_id, conversation_id, provider_message_id,
                       direction, message_type, text_content, media_id, status, failure_reason,
                       provider_timestamp, created_at, updated_at
                FROM whatsapp_messages
                WHERE id = @id AND organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = messageId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }
            return ReadMessage(reader);
        }

        private static WhatsAppConversationDto ReadConversation(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            whatsapp_connection_id = Convert.ToInt64(reader["whatsapp_connection_id"]),
            customer_id = reader["customer_id"] == DBNull.Value ? null : Convert.ToInt64(reader["customer_id"]),
            enquiry_id = HasColumn(reader, "enquiry_id") && reader["enquiry_id"] != DBNull.Value
                ? Convert.ToInt64(reader["enquiry_id"])
                : null,
            customer_wa_id = reader["customer_wa_id"]?.ToString() ?? "",
            customer_name = reader["customer_name"]?.ToString() ?? "",
            assigned_user_id = reader["assigned_user_id"] == DBNull.Value ? null : Convert.ToInt64(reader["assigned_user_id"]),
            status = reader["status"]?.ToString() ?? WhatsAppConversationStatuses.Open,
            last_message_at = reader["last_message_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["last_message_at"]),
            last_message_preview = reader["last_message_preview"]?.ToString() ?? "",
            unread_count = reader["unread_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["unread_count"]),
            last_message_direction = HasColumn(reader, "last_message_direction")
                ? reader["last_message_direction"]?.ToString() ?? ""
                : "",
            last_message_status = HasColumn(reader, "last_message_status")
                ? reader["last_message_status"]?.ToString() ?? ""
                : "",
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        private static bool HasColumn(DbDataReader reader, string name)
        {
            for (var i = 0; i < reader.FieldCount; i++)
            {
                if (string.Equals(reader.GetName(i), name, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        private static WhatsAppMessageDto ReadMessage(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            whatsapp_connection_id = Convert.ToInt64(reader["whatsapp_connection_id"]),
            conversation_id = Convert.ToInt64(reader["conversation_id"]),
            provider_message_id = reader["provider_message_id"]?.ToString() ?? "",
            direction = reader["direction"]?.ToString() ?? "",
            message_type = reader["message_type"]?.ToString() ?? "text",
            text_content = reader["text_content"]?.ToString() ?? "",
            media_id = reader["media_id"]?.ToString() ?? "",
            status = reader["status"]?.ToString() ?? "",
            failure_reason = reader["failure_reason"]?.ToString() ?? "",
            provider_timestamp = reader["provider_timestamp"] == DBNull.Value ? null : Convert.ToDateTime(reader["provider_timestamp"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        /// <summary>
        /// Organisation ownership always comes from the authenticated request context.
        /// Client-supplied organisation_id is never treated as authorization proof.
        /// </summary>
        private long ResolveOrganisationId(long requested)
        {
            long jwtOrg = 0;
            try
            {
                var ctx = _requestState.usercontext;
                if (ctx != null && ctx.organisationid > 0)
                {
                    jwtOrg = ctx.organisationid;
                }
            }
            catch
            {
                // ignore
            }

            if (jwtOrg > 0)
            {
                if (requested > 0 && requested != jwtOrg)
                {
                    throw new UnauthorizedAccessException("Cross-organisation access is not allowed.");
                }
                return jwtOrg;
            }

            // Webhook/worker paths have no user context; allow explicit org only when internal.
            return requested > 0 ? requested : 0;
        }

        private async Task<bool> IsOptedOutAnyPurpose(IDb db, long organisationId, string customerWaId)
        {
            var phone = WhatsAppCloudApiClient.NormalizeWaId(customerWaId);
            if (string.IsNullOrEmpty(phone)) return false;

            using var command = db.GetCommand(@"
                SELECT 1 FROM whatsapp_communication_consent
                WHERE organisation_id = @organisation_id
                  AND phone_normalized = @phone_normalized
                  AND status = @opted_out
                LIMIT 1;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "phone_normalized", DbTypes.Types.String).Value = phone;
            db.AddParameter(command, "opted_out", DbTypes.Types.String).Value = WhatsAppConsentStatuses.OptedOut;
            using var reader = await db.Execute(command);
            return await reader.ReadAsync();
        }

        private async Task UpsertOptOutAllPurposes(IDb db, long organisationId, string customerWaId, string source)
        {
            var phone = WhatsAppCloudApiClient.NormalizeWaId(customerWaId);
            if (string.IsNullOrEmpty(phone)) return;

            foreach (var purpose in new[]
                     {
                         WhatsAppConsentPurposes.Marketing,
                         WhatsAppConsentPurposes.Utility,
                         WhatsAppConsentPurposes.Transactional
                     })
            {
                using var command = db.GetCommand(@"
                    INSERT INTO whatsapp_communication_consent (
                        organisation_id, phone_normalized, purpose, status, source,
                        consented_at, withdrawn_at, notes, created_at, updated_at
                    ) VALUES (
                        @organisation_id, @phone_normalized, @purpose, @status, @source,
                        NULL, @withdrawn_at, '', @now, @now
                    )
                    ON CONFLICT (organisation_id, phone_normalized, purpose) DO UPDATE SET
                        status = EXCLUDED.status,
                        source = EXCLUDED.source,
                        withdrawn_at = EXCLUDED.withdrawn_at,
                        updated_at = EXCLUDED.updated_at;");
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "phone_normalized", DbTypes.Types.String).Value = phone;
                db.AddParameter(command, "purpose", DbTypes.Types.String).Value = purpose;
                db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppConsentStatuses.OptedOut;
                db.AddParameter(command, "source", DbTypes.Types.String).Value = source;
                db.AddParameter(command, "withdrawn_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(command);
            }
        }

        private static bool IsStopKeyword(string text)
        {
            var normalized = (text ?? "").Trim().ToLowerInvariant();
            return normalized is "stop" or "unsubscribe" or "cancel" or "end" or "quit" or "optout" or "opt-out" or "opt out";
        }

        /// <summary>Used by SignalR hub to verify conversation ownership before group join.</summary>
        public async Task<bool> ConversationBelongsToOrganisation(long conversationId, long organisationId)
        {
            if (conversationId <= 0 || organisationId <= 0) return false;
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            using var command = db.GetCommand(@"
                SELECT 1 FROM whatsapp_conversations
                WHERE id = @id AND organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = conversationId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            return await reader.ReadAsync();
        }

        private static string ExtractFirstPhoneNumberId(string rawBody)
        {
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(rawBody) ? "{}" : rawBody);
                if (!doc.RootElement.TryGetProperty("entry", out var entries)) return "";
                foreach (var entry in entries.EnumerateArray())
                {
                    if (!entry.TryGetProperty("changes", out var changes)) continue;
                    foreach (var change in changes.EnumerateArray())
                    {
                        if (!change.TryGetProperty("value", out var value)) continue;
                        if (value.TryGetProperty("metadata", out var metadata) &&
                            metadata.TryGetProperty("phone_number_id", out var phone))
                        {
                            return phone.GetString() ?? "";
                        }
                    }
                }
            }
            catch
            {
                // ignore
            }
            return "";
        }

        private static bool PayloadHasMessagesOrStatuses(string rawBody)
        {
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(rawBody) ? "{}" : rawBody);
                if (!doc.RootElement.TryGetProperty("entry", out var entries) ||
                    entries.ValueKind != JsonValueKind.Array)
                {
                    return false;
                }

                foreach (var entry in entries.EnumerateArray())
                {
                    if (!entry.TryGetProperty("changes", out var changes) ||
                        changes.ValueKind != JsonValueKind.Array)
                    {
                        continue;
                    }

                    foreach (var change in changes.EnumerateArray())
                    {
                        if (!change.TryGetProperty("value", out var value)) continue;
                        if (value.TryGetProperty("messages", out var messages) &&
                            messages.ValueKind == JsonValueKind.Array &&
                            messages.GetArrayLength() > 0)
                        {
                            return true;
                        }
                        if (value.TryGetProperty("statuses", out var statuses) &&
                            statuses.ValueKind == JsonValueKind.Array &&
                            statuses.GetArrayLength() > 0)
                        {
                            return true;
                        }
                    }
                }
            }
            catch
            {
                // ignore
            }

            return false;
        }

        private static string DescribeNonMessageWebhook(string rawBody)
        {
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(rawBody) ? "{}" : rawBody);
                if (!doc.RootElement.TryGetProperty("entry", out var entries) ||
                    entries.ValueKind != JsonValueKind.Array)
                {
                    return "unknown";
                }

                foreach (var entry in entries.EnumerateArray())
                {
                    if (!entry.TryGetProperty("changes", out var changes) ||
                        changes.ValueKind != JsonValueKind.Array)
                    {
                        continue;
                    }

                    foreach (var change in changes.EnumerateArray())
                    {
                        var field = change.TryGetProperty("field", out var fieldProp)
                            ? fieldProp.GetString() ?? ""
                            : "";
                        if (change.TryGetProperty("value", out var value) &&
                            value.TryGetProperty("event", out var eventProp))
                        {
                            var ev = eventProp.GetString() ?? "";
                            if (!string.IsNullOrEmpty(ev))
                            {
                                return string.IsNullOrEmpty(field) ? ev : $"{field}/{ev}";
                            }
                        }
                        if (!string.IsNullOrEmpty(field))
                        {
                            return field;
                        }
                    }
                }
            }
            catch
            {
                // ignore
            }

            return "non-message";
        }

        private static string ComputeEventKey(string rawBody)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawBody ?? ""));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private async Task<WhatsAppOrgConnectionContext?> GetPrimaryConnection(IDb db, long organisationId)
        {
            var sql = @"
                SELECT
                    oi.organisation_id, oi.id AS integration_id, oi.status, oi.is_active,
                    wc.id AS whatsapp_connection_id, wc.phone_number_id, wc.waba_id, wc.business_phone,
                    s.encrypted_value
                FROM whatsapp_connections wc
                INNER JOIN organization_integrations oi ON oi.id = wc.integration_id
                LEFT JOIN integration_secrets s
                    ON s.integration_id = oi.id AND s.secret_type = @secret_type
                WHERE oi.organisation_id = @organisation_id
                  AND oi.provider = 'whatsapp'
                  AND oi.is_active = TRUE
                ORDER BY CASE WHEN oi.status = @connected THEN 0 ELSE 1 END, wc.id DESC
                LIMIT 1;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.AccessToken;
            db.AddParameter(command, "connected", DbTypes.Types.String).Value = IntegrationStatuses.Connected;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadConnectionContext(reader);
        }

        private async Task<long> FindConversationId(IDb db, long whatsappConnectionId, string customerWaId)
        {
            using var command = db.GetCommand(@"
                SELECT id
                FROM whatsapp_conversations
                WHERE whatsapp_connection_id = @whatsapp_connection_id
                  AND customer_wa_id = @customer_wa_id
                LIMIT 1;");
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
            db.AddParameter(command, "customer_wa_id", DbTypes.Types.String).Value = customerWaId;
            using var reader = await db.Execute(command);
            return await reader.ReadAsync() ? Convert.ToInt64(reader["id"]) : 0;
        }

        private static string NormalizePhoneDigits(string? value) =>
            WhatsAppInboundContactRules.NormalizePhoneDigits(value);

        /// <summary>
        /// Find-or-create CRM lead (enquiries) for inbound WhatsApp; optionally link booked client (users.id).
        /// Org is always the connection-resolved tenant — never from webhook payload.
        /// </summary>
        private async Task<(long? customerId, long enquiryId, string displayName)> ResolveOrCreateInboundContact(
            IDb db,
            long organisationId,
            string customerWaId,
            string profileName)
        {
            if (organisationId <= 0 || !WhatsAppInboundContactRules.HasValidSender(customerWaId))
            {
                return (null, 0, profileName ?? "");
            }

            var phone = WhatsAppInboundContactRules.NormalizePhoneDigits(customerWaId);
            var variants = WhatsAppInboundContactRules.PhoneLookupVariants(phone);

            var existingEnquiry = await FindEnquiryByPhoneVariants(db, organisationId, variants);
            long enquiryId;
            string enquiryName;

            if (existingEnquiry.id > 0)
            {
                enquiryId = existingEnquiry.id;
                enquiryName = existingEnquiry.name;
                if (string.IsNullOrWhiteSpace(enquiryName) && !string.IsNullOrWhiteSpace(profileName))
                {
                    await EnrichEnquiryNameIfEmpty(db, organisationId, enquiryId, profileName.Trim());
                    enquiryName = profileName.Trim();
                }
            }
            else
            {
                var created = await CreateWhatsAppLead(db, organisationId, phone, profileName);
                enquiryId = created.id;
                enquiryName = created.name;
            }

            var user = await FindUserByPhoneVariants(db, organisationId, variants);
            var display = WhatsAppInboundContactRules.PreferDisplayName(
                user.name.Length > 0 ? user.name : enquiryName,
                profileName,
                phone);

            return (user.id > 0 ? user.id : null, enquiryId, display);
        }

        private async Task<(long id, string name)> FindEnquiryByPhoneVariants(
            IDb db,
            long organisationId,
            IReadOnlyList<string> variants)
        {
            foreach (var v in variants)
            {
                var hit = await FindEnquiryByExactDigits(db, organisationId, v);
                if (hit.id > 0) return hit;
            }

            return (0, "");
        }

        private async Task<(long id, string name)> FindEnquiryByExactDigits(IDb db, long organisationId, string digits)
        {
            using var command = db.GetCommand(@"
                SELECT id,
                       COALESCE(NULLIF(BTRIM(owner_name), ''), NULLIF(BTRIM(name), ''), NULLIF(BTRIM(business_name), ''), '') AS display_name
                FROM enquiries
                WHERE organisation_id = @organisation_id
                  AND (is_active IS NULL OR is_active = TRUE)
                  AND regexp_replace(COALESCE(mobile, ''), '[^0-9]', '', 'g') = @digits
                ORDER BY id ASC
                LIMIT 1;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "digits", DbTypes.Types.String).Value = digits;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return (0, "");
            return (Convert.ToInt64(reader["id"]), reader["display_name"]?.ToString() ?? "");
        }

        private async Task<(long id, string name)> FindUserByPhoneVariants(
            IDb db,
            long organisationId,
            IReadOnlyList<string> variants)
        {
            if (variants.Count == 0) return (0, "");

            foreach (var digits in variants)
            {
                using var command = db.GetCommand(@"
                    SELECT DISTINCT u.id, COALESCE(NULLIF(BTRIM(u.name), ''), '') AS name
                    FROM users u
                    INNER JOIN appoinment a ON a.userid = u.id AND a.organisationid = @organisation_id
                    WHERE regexp_replace(COALESCE(u.mobile, ''), '[^0-9]', '', 'g') = @digits
                    ORDER BY u.id ASC
                    LIMIT 1;");
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "digits", DbTypes.Types.String).Value = digits;
                using var reader = await db.Execute(command);
                if (await reader.ReadAsync())
                {
                    return (Convert.ToInt64(reader["id"]), reader["name"]?.ToString() ?? "");
                }
            }

            return (0, "");
        }

        private async Task<(long id, string name)> CreateWhatsAppLead(
            IDb db,
            long organisationId,
            string phoneDigits,
            string profileName)
        {
            // Re-check after concurrent inbound (no unique index on mobile — prefer earliest id).
            var again = await FindEnquiryByPhoneVariants(
                db,
                organisationId,
                WhatsAppInboundContactRules.PhoneLookupVariants(phoneDigits));
            if (again.id > 0)
            {
                return again;
            }

            var name = WhatsAppInboundContactRules.PreferDisplayName(null, profileName, phoneDigits);
            var enquiry = new Enquiry
            {
                name = name,
                owner_name = string.IsNullOrWhiteSpace(profileName) ? "" : profileName.Trim(),
                mobile = phoneDigits.StartsWith("91", StringComparison.Ordinal) && phoneDigits.Length == 12
                    ? $"+{phoneDigits}"
                    : phoneDigits,
                message = "",
                organisation_id = organisationId,
                status = "new",
                source = WhatsAppInboundContactRules.LeadSourceWhatsApp,
                is_active = true,
                lead_type = "whatsapp",
                notes = "Auto-created from inbound WhatsApp message",
            };

            try
            {
                await _enquiryService.InsertTransaction(db, enquiry);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Enquiry insert raced for org {OrganisationId}; reloading", organisationId);
                var raced = await FindEnquiryByPhoneVariants(
                    db,
                    organisationId,
                    WhatsAppInboundContactRules.PhoneLookupVariants(phoneDigits));
                if (raced.id > 0) return raced;
                throw;
            }

            return (enquiry.id, enquiry.name ?? name);
        }

        private async Task EnrichEnquiryNameIfEmpty(IDb db, long organisationId, long enquiryId, string profileName)
        {
            using var command = db.GetCommand(@"
                UPDATE enquiries
                SET name = @name,
                    owner_name = CASE WHEN COALESCE(BTRIM(owner_name), '') = '' THEN @name ELSE owner_name END,
                    updated_at = @updated_at
                WHERE id = @id
                  AND organisation_id = @organisation_id
                  AND COALESCE(BTRIM(name), '') = '';");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = enquiryId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = profileName;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task<string> ResolveUserMobile(IDb db, long userId)
        {
            using var command = db.GetCommand(@"
                SELECT mobile FROM users WHERE id = @id LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = userId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return "";
            return NormalizePhoneDigits(reader["mobile"]?.ToString());
        }

        private async Task<string> ResolveUserName(IDb db, long userId)
        {
            using var command = db.GetCommand(@"
                SELECT name FROM users WHERE id = @id LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = userId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return "";
            return reader["name"]?.ToString() ?? "";
        }

        private async Task<(string phone, string displayName)> ResolveEnquiryPhone(IDb db, long organisationId, long enquiryId)
        {
            using var command = db.GetCommand(@"
                SELECT mobile,
                       COALESCE(NULLIF(owner_name, ''), NULLIF(name, ''), business_name, '') AS display_name
                FROM enquiries
                WHERE id = @id AND organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = enquiryId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return ("", "");
            return (
                NormalizePhoneDigits(reader["mobile"]?.ToString()),
                reader["display_name"]?.ToString() ?? "");
        }

        private async Task<(string templateName, string languageCode, string content, string componentsJson)> LoadApprovedTemplate(
            IDb db,
            long organisationId,
            long connectionId,
            long templateId)
        {
            using var command = db.GetCommand(@"
                SELECT template_name, language_code, status, content, components_json
                FROM message_templates
                WHERE id = @id
                  AND organisation_id = @organisation_id
                  AND whatsapp_connection_id = @whatsapp_connection_id
                  AND channel = 'whatsapp'
                  AND is_archived = FALSE
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = templateId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = connectionId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception("Template not found for this organisation and connection.");
            }

            var status = reader["status"]?.ToString() ?? "";
            if (!string.Equals(status, WhatsAppTemplateStatuses.Approved, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception($"Template is not approved (status: {status}).");
            }

            return (
                reader["template_name"]?.ToString() ?? "",
                reader["language_code"]?.ToString() ?? "en",
                reader["content"]?.ToString() ?? "",
                reader["components_json"]?.ToString() ?? "[]");
        }

        private static string Truncate(string value, int max) =>
            string.IsNullOrEmpty(value) || value.Length <= max ? value : value.Substring(0, max);
    }
}
