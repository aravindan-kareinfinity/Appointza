using System.Data.Common;
using System.Text.Json;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    public class WhatsAppTemplateService
    {
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly SecretProtector _secretProtector;
        private readonly WhatsAppCloudApiClient _cloudApi;
        private readonly ILogger<WhatsAppTemplateService> _logger;

        public WhatsAppTemplateService(
            IDbProvider dbProvider,
            RequestState requestState,
            SecretProtector secretProtector,
            WhatsAppCloudApiClient cloudApi,
            ILogger<WhatsAppTemplateService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _secretProtector = secretProtector;
            _cloudApi = cloudApi;
            _logger = logger;
        }

        public async Task<List<WhatsAppTemplateDto>> Select(WhatsAppTemplateSelectReq req)
        {
            var orgId = ResolveOrganisationId();
            if (orgId <= 0) throw new Exception("Organisation is required.");

            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            var search = (req.search ?? "").Trim();
            var status = (req.status ?? "").Trim();
            var category = (req.category ?? "").Trim();

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var sql = @"
                SELECT t.*, wc.business_phone, wc.waba_id
                FROM message_templates t
                LEFT JOIN whatsapp_connections wc ON wc.id = t.whatsapp_connection_id
                WHERE t.organisation_id = @organisation_id
                  AND t.channel = @channel
            ";
            if (!req.include_archived)
            {
                sql += " AND t.is_archived = FALSE";
            }
            if (!string.IsNullOrEmpty(status))
            {
                sql += " AND t.status = @status";
            }
            if (!string.IsNullOrEmpty(category))
            {
                sql += " AND lower(t.category) = lower(@category)";
            }
            if (!string.IsNullOrEmpty(search))
            {
                sql += " AND (t.template_name ILIKE @search OR t.content ILIKE @search)";
            }
            sql += " ORDER BY t.updated_at DESC, t.id DESC LIMIT @limit OFFSET @offset;";

            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "channel", DbTypes.Types.String).Value = WhatsAppTemplateChannels.WhatsApp;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
            db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = offset;
            if (!string.IsNullOrEmpty(status))
            {
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            }
            if (!string.IsNullOrEmpty(category))
            {
                db.AddParameter(command, "category", DbTypes.Types.String).Value = category;
            }
            if (!string.IsNullOrEmpty(search))
            {
                db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";
            }

            var list = new List<WhatsAppTemplateDto>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(ReadTemplate(reader));
            }
            return list;
        }

        public async Task<WhatsAppTemplateDto?> GetById(long id)
        {
            var orgId = ResolveOrganisationId();
            if (orgId <= 0) throw new Exception("Organisation is required.");
            if (id <= 0) throw new Exception("Template id is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            return await GetTemplate(db, orgId, id);
        }

        public async Task<WhatsAppTemplateSyncResult> Sync(long whatsappConnectionId = 0)
        {
            var orgId = ResolveOrganisationId();
            if (orgId <= 0) throw new Exception("Organisation is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var connection = await ResolveConnection(db, orgId, whatsappConnectionId);
            EnsureConnected(connection);

            var upserted = 0;
            var pages = 0;
            string? cursor = null;
            var seenProviderIds = new HashSet<string>(StringComparer.Ordinal);

            do
            {
                var page = await _cloudApi.ListMessageTemplatesAsync(
                    connection.waba_id,
                    connection.access_token,
                    cursor);
                if (!page.success)
                {
                    throw new Exception(page.error);
                }

                pages++;
                foreach (var item in page.items)
                {
                    if (!string.IsNullOrWhiteSpace(item.id))
                    {
                        seenProviderIds.Add(item.id);
                    }
                    await UpsertProviderTemplate(db, orgId, connection, item);
                    upserted++;
                }

                cursor = page.next_cursor;
            } while (!string.IsNullOrEmpty(cursor) && pages < 50);

            var archived = await ArchiveMissingProviderTemplatesPortable(
                db,
                orgId,
                connection.whatsapp_connection_id,
                seenProviderIds);

            _logger.LogInformation(
                "WhatsApp templates synced for org {OrgId}: upserted={Upserted}, archived={Archived}, pages={Pages}",
                orgId,
                upserted,
                archived,
                pages);

            var templates = await SelectInternal(db, orgId, connection.whatsapp_connection_id);
            return new WhatsAppTemplateSyncResult
            {
                upserted = upserted,
                archived = archived,
                pages = pages,
                message = $"Synchronized {upserted} template(s) from Meta.",
                templates = templates,
            };
        }

        public async Task<WhatsAppTemplateDto> Create(WhatsAppTemplateCreateReq req)
        {
            var orgId = ResolveOrganisationId();
            if (orgId <= 0) throw new Exception("Organisation is required.");

            var errors = WhatsAppTemplateValidation.ValidateCreate(req);
            if (errors.Count > 0)
            {
                throw new Exception(string.Join(" ", errors));
            }

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var connection = await ResolveConnection(db, orgId, req.whatsapp_connection_id);
            EnsureConnected(connection);

            var name = req.template_name.Trim().ToLowerInvariant();
            var language = req.language_code.Trim();
            var category = req.category.Trim().ToUpperInvariant();
            var components = BuildComponents(req);
            var componentsJson = JsonSerializer.Serialize(components);
            var bodyPreview = WhatsAppTemplateValidation.ExtractBodyPreview(componentsJson);
            var headerType = WhatsAppTemplateValidation.ExtractHeaderType(componentsJson);
            var mappingsJson = JsonSerializer.Serialize(req.variable_mappings ?? new List<WhatsAppTemplateVariableMapping>());
            var now = DateTime.UtcNow;

            long templateId;
            if (req.submit)
            {
                var payload = new Dictionary<string, object?>
                {
                    ["name"] = name,
                    ["language"] = language,
                    ["category"] = category,
                    ["components"] = components,
                };

                var create = await _cloudApi.CreateMessageTemplateAsync(
                    connection.waba_id,
                    connection.access_token,
                    payload);
                if (!create.success)
                {
                    throw new Exception(create.error);
                }

                // Never mark approved locally — only store Meta-reported status (usually PENDING).
                var providerStatus = string.IsNullOrWhiteSpace(create.provider_status)
                    ? "PENDING"
                    : create.provider_status;
                var mapped = WhatsAppTemplateValidation.MapProviderStatus(providerStatus);

                templateId = await InsertLocalTemplate(
                    db,
                    orgId,
                    connection.whatsapp_connection_id,
                    name,
                    language,
                    category,
                    headerType,
                    bodyPreview,
                    componentsJson,
                    create.provider_template_id,
                    mapped,
                    providerStatus,
                    "",
                    mappingsJson,
                    isProviderManaged: true,
                    now);
            }
            else
            {
                templateId = await InsertLocalTemplate(
                    db,
                    orgId,
                    connection.whatsapp_connection_id,
                    name,
                    language,
                    category,
                    headerType,
                    bodyPreview,
                    componentsJson,
                    "",
                    WhatsAppTemplateStatuses.Draft,
                    "",
                    "",
                    mappingsJson,
                    isProviderManaged: false,
                    now);
            }

            return (await GetTemplate(db, orgId, templateId))!;
        }

        public async Task<WhatsAppTemplateDto> Submit(long id)
        {
            var orgId = ResolveOrganisationId();
            if (orgId <= 0) throw new Exception("Organisation is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var existing = await GetTemplate(db, orgId, id)
                ?? throw new Exception("Template not found.");
            if (!string.IsNullOrWhiteSpace(existing.provider_template_id) &&
                existing.status is not (WhatsAppTemplateStatuses.Draft or WhatsAppTemplateStatuses.Rejected))
            {
                throw new Exception("Template has already been submitted to Meta.");
            }

            var connection = await ResolveConnection(db, orgId, existing.whatsapp_connection_id ?? 0);
            EnsureConnected(connection);

            List<object> components;
            try
            {
                components = JsonSerializer.Deserialize<List<object>>(existing.components_json) ?? new List<object>();
            }
            catch
            {
                throw new Exception("Stored template components are invalid.");
            }

            var payload = new Dictionary<string, object?>
            {
                ["name"] = existing.template_name,
                ["language"] = existing.language_code,
                ["category"] = existing.category.ToUpperInvariant(),
                ["components"] = components,
            };

            var create = await _cloudApi.CreateMessageTemplateAsync(
                connection.waba_id,
                connection.access_token,
                payload);
            if (!create.success)
            {
                throw new Exception(create.error);
            }

            var providerStatus = string.IsNullOrWhiteSpace(create.provider_status) ? "PENDING" : create.provider_status;
            var mapped = WhatsAppTemplateValidation.MapProviderStatus(providerStatus);

            using (var command = db.GetCommand(@"
                UPDATE message_templates
                SET provider_template_id = @provider_template_id,
                    status = @status,
                    provider_status = @provider_status,
                    rejection_reason = '',
                    is_provider_managed = TRUE,
                    last_synced_at = @last_synced_at,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "provider_template_id", DbTypes.Types.String).Value = create.provider_template_id;
                db.AddParameter(command, "status", DbTypes.Types.String).Value = mapped;
                db.AddParameter(command, "provider_status", DbTypes.Types.String).Value = providerStatus;
                db.AddParameter(command, "last_synced_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(command);
            }

            return (await GetTemplate(db, orgId, id))!;
        }

        public async Task<WhatsAppTemplateDto> RefreshStatus(long id)
        {
            var orgId = ResolveOrganisationId();
            if (orgId <= 0) throw new Exception("Organisation is required.");

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var existing = await GetTemplate(db, orgId, id)
                ?? throw new Exception("Template not found.");
            if (string.IsNullOrWhiteSpace(existing.provider_template_id))
            {
                throw new Exception("Template has no Meta template id to refresh.");
            }

            var connection = await ResolveConnection(db, orgId, existing.whatsapp_connection_id ?? 0);
            EnsureConnected(connection);

            var (success, item, error, _, _) = await _cloudApi.GetMessageTemplateAsync(
                existing.provider_template_id,
                connection.access_token);
            if (!success || item == null)
            {
                // Preserve last known status — do not invent approval/rejection.
                throw new Exception(string.IsNullOrWhiteSpace(error) ? "Failed to refresh template status from Meta." : error);
            }

            await UpsertProviderTemplate(db, orgId, connection, item);
            return (await GetTemplate(db, orgId, id))!;
        }

        private async Task UpsertProviderTemplate(
            IDb db,
            long organisationId,
            WhatsAppOrgConnectionContext connection,
            WhatsAppCloudTemplateItem item)
        {
            var mapped = WhatsAppTemplateValidation.MapProviderStatus(item.status);
            var headerType = WhatsAppTemplateValidation.ExtractHeaderType(item.components_json);
            var bodyPreview = WhatsAppTemplateValidation.ExtractBodyPreview(item.components_json);
            var now = DateTime.UtcNow;

            // Prefer provider id match; fall back to name+language for drafts that gained an id.
            long? existingId = null;
            if (!string.IsNullOrWhiteSpace(item.id))
            {
                using (var find = db.GetCommand(@"
                    SELECT id FROM message_templates
                    WHERE organisation_id = @organisation_id
                      AND whatsapp_connection_id = @whatsapp_connection_id
                      AND provider_template_id = @provider_template_id
                    LIMIT 1;"))
                {
                    db.AddParameter(find, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                    db.AddParameter(find, "whatsapp_connection_id", DbTypes.Types.Long).Value = connection.whatsapp_connection_id;
                    db.AddParameter(find, "provider_template_id", DbTypes.Types.String).Value = item.id;
                    using var reader = await db.Execute(find);
                    if (await reader.ReadAsync())
                    {
                        existingId = Convert.ToInt64(reader["id"]);
                    }
                }
            }

            if (existingId == null)
            {
                using (var findName = db.GetCommand(@"
                    SELECT id FROM message_templates
                    WHERE organisation_id = @organisation_id
                      AND whatsapp_connection_id = @whatsapp_connection_id
                      AND lower(template_name) = lower(@template_name)
                      AND lower(language_code) = lower(@language_code)
                      AND channel = @channel
                    LIMIT 1;"))
                {
                    db.AddParameter(findName, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                    db.AddParameter(findName, "whatsapp_connection_id", DbTypes.Types.Long).Value = connection.whatsapp_connection_id;
                    db.AddParameter(findName, "template_name", DbTypes.Types.String).Value = item.name;
                    db.AddParameter(findName, "language_code", DbTypes.Types.String).Value = item.language;
                    db.AddParameter(findName, "channel", DbTypes.Types.String).Value = WhatsAppTemplateChannels.WhatsApp;
                    using var reader = await db.Execute(findName);
                    if (await reader.ReadAsync())
                    {
                        existingId = Convert.ToInt64(reader["id"]);
                    }
                }
            }

            if (existingId.HasValue)
            {
                var update = db.GetCommand(@"
                    UPDATE message_templates
                    SET template_name = @template_name,
                        language_code = @language_code,
                        category = @category,
                        header_type = @header_type,
                        content = @content,
                        components_json = @components_json,
                        provider_template_id = CASE
                            WHEN @provider_template_id = '' THEN provider_template_id
                            ELSE @provider_template_id
                        END,
                        status = @status,
                        provider_status = @provider_status,
                        rejection_reason = @rejection_reason,
                        provider_quality_score = @provider_quality_score,
                        is_provider_managed = TRUE,
                        is_archived = FALSE,
                        last_synced_at = @last_synced_at,
                        updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id;");
                db.AddParameter(update, "id", DbTypes.Types.Long).Value = existingId.Value;
                db.AddParameter(update, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(update, "template_name", DbTypes.Types.String).Value = item.name ?? "";
                db.AddParameter(update, "language_code", DbTypes.Types.String).Value = item.language ?? "";
                db.AddParameter(update, "category", DbTypes.Types.String).Value = item.category ?? "";
                db.AddParameter(update, "header_type", DbTypes.Types.String).Value = headerType;
                db.AddParameter(update, "content", DbTypes.Types.String).Value = bodyPreview;
                db.AddParameter(update, "components_json", DbTypes.Types.String).Value = item.components_json ?? "[]";
                db.AddParameter(update, "provider_template_id", DbTypes.Types.String).Value = item.id ?? "";
                db.AddParameter(update, "status", DbTypes.Types.String).Value = mapped;
                db.AddParameter(update, "provider_status", DbTypes.Types.String).Value = item.status ?? "";
                db.AddParameter(update, "rejection_reason", DbTypes.Types.String).Value = item.rejected_reason ?? "";
                db.AddParameter(update, "provider_quality_score", DbTypes.Types.String).Value = item.quality_score ?? "";
                db.AddParameter(update, "last_synced_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(update, "updated_at", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(update);
                return;
            }

            await InsertLocalTemplate(
                db,
                organisationId,
                connection.whatsapp_connection_id,
                item.name ?? "",
                item.language ?? "",
                item.category ?? "",
                headerType,
                bodyPreview,
                item.components_json ?? "[]",
                item.id ?? "",
                mapped,
                item.status ?? "",
                item.rejected_reason ?? "",
                "[]",
                isProviderManaged: true,
                now,
                item.quality_score ?? "");
        }

        private async Task<int> ArchiveMissingProviderTemplatesPortable(
            IDb db,
            long organisationId,
            long whatsappConnectionId,
            HashSet<string> seenProviderIds)
        {
            // Soft-archive provider-managed rows removed from Meta; never hard-delete.
            var toArchive = new List<long>();
            using (var command = db.GetCommand(@"
                SELECT id, provider_template_id
                FROM message_templates
                WHERE organisation_id = @organisation_id
                  AND whatsapp_connection_id = @whatsapp_connection_id
                  AND channel = @channel
                  AND is_provider_managed = TRUE
                  AND is_archived = FALSE
                  AND provider_template_id <> '';"))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
                db.AddParameter(command, "channel", DbTypes.Types.String).Value = WhatsAppTemplateChannels.WhatsApp;
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    var providerId = reader["provider_template_id"]?.ToString() ?? "";
                    if (!seenProviderIds.Contains(providerId))
                    {
                        toArchive.Add(Convert.ToInt64(reader["id"]));
                    }
                }
            }

            foreach (var id in toArchive)
            {
                var update = db.GetCommand(@"
                    UPDATE message_templates
                    SET is_archived = TRUE, updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id;");
                db.AddParameter(update, "id", DbTypes.Types.Long).Value = id;
                db.AddParameter(update, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(update, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(update);
            }

            return toArchive.Count;
        }

        private async Task<long> InsertLocalTemplate(
            IDb db,
            long organisationId,
            long whatsappConnectionId,
            string name,
            string language,
            string category,
            string headerType,
            string bodyPreview,
            string componentsJson,
            string providerTemplateId,
            string status,
            string providerStatus,
            string rejectionReason,
            string mappingsJson,
            bool isProviderManaged,
            DateTime now,
            string qualityScore = "")
        {
            using var command = db.GetCommand(@"
                INSERT INTO message_templates (
                    organisation_id, whatsapp_connection_id, channel, template_name, language_code, category,
                    header_type, content, components_json, provider_template_id, status, provider_status,
                    rejection_reason, variable_mappings_json, provider_quality_score, is_provider_managed,
                    is_archived, last_synced_at, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @channel, @template_name, @language_code, @category,
                    @header_type, @content, @components_json, @provider_template_id, @status, @provider_status,
                    @rejection_reason, @variable_mappings_json, @provider_quality_score, @is_provider_managed,
                    FALSE, @last_synced_at, @created_at, @updated_at
                )
                RETURNING id;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
            db.AddParameter(command, "channel", DbTypes.Types.String).Value = WhatsAppTemplateChannels.WhatsApp;
            db.AddParameter(command, "template_name", DbTypes.Types.String).Value = name;
            db.AddParameter(command, "language_code", DbTypes.Types.String).Value = language;
            db.AddParameter(command, "category", DbTypes.Types.String).Value = category;
            db.AddParameter(command, "header_type", DbTypes.Types.String).Value = headerType;
            db.AddParameter(command, "content", DbTypes.Types.String).Value = bodyPreview;
            db.AddParameter(command, "components_json", DbTypes.Types.String).Value = componentsJson;
            db.AddParameter(command, "provider_template_id", DbTypes.Types.String).Value = providerTemplateId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "provider_status", DbTypes.Types.String).Value = providerStatus;
            db.AddParameter(command, "rejection_reason", DbTypes.Types.String).Value = rejectionReason;
            db.AddParameter(command, "variable_mappings_json", DbTypes.Types.String).Value = mappingsJson;
            db.AddParameter(command, "provider_quality_score", DbTypes.Types.String).Value = qualityScore;
            db.AddParameter(command, "is_provider_managed", DbTypes.Types.Boolean).Value = isProviderManaged;
            db.AddParameter(command, "last_synced_at", DbTypes.Types.DateTime).Value =
                isProviderManaged ? now : (object)DBNull.Value;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

            using var reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return Convert.ToInt64(reader["id"]);
            }
            throw new Exception("Failed to store template.");
        }

        private static List<object> BuildComponents(WhatsAppTemplateCreateReq req)
        {
            var components = new List<object>();
            var headerType = string.IsNullOrWhiteSpace(req.header_type) ? "NONE" : req.header_type.Trim().ToUpperInvariant();
            if (headerType == "TEXT")
            {
                var header = new Dictionary<string, object?>
                {
                    ["type"] = "HEADER",
                    ["format"] = "TEXT",
                    ["text"] = req.header_text.Trim(),
                };
                if (!string.IsNullOrWhiteSpace(req.header_example))
                {
                    header["example"] = new { header_text = new[] { req.header_example.Trim() } };
                }
                components.Add(header);
            }
            else if (headerType is "IMAGE" or "VIDEO" or "DOCUMENT")
            {
                components.Add(new Dictionary<string, object?>
                {
                    ["type"] = "HEADER",
                    ["format"] = headerType,
                });
            }

            var body = new Dictionary<string, object?>
            {
                ["type"] = "BODY",
                ["text"] = req.body_text.Trim(),
            };
            if (req.body_examples != null && req.body_examples.Count > 0)
            {
                body["example"] = new
                {
                    body_text = new[] { req.body_examples.Select(e => e?.Trim() ?? "").ToArray() },
                };
            }
            components.Add(body);

            if (!string.IsNullOrWhiteSpace(req.footer_text))
            {
                components.Add(new Dictionary<string, object?>
                {
                    ["type"] = "FOOTER",
                    ["text"] = req.footer_text.Trim(),
                });
            }

            if (req.buttons != null && req.buttons.Count > 0)
            {
                var buttons = new List<object>();
                foreach (var b in req.buttons)
                {
                    var type = (b.type ?? "QUICK_REPLY").Trim().ToUpperInvariant();
                    var button = new Dictionary<string, object?>
                    {
                        ["type"] = type,
                        ["text"] = (b.text ?? "").Trim(),
                    };
                    if (type == "URL") button["url"] = (b.url ?? "").Trim();
                    if (type == "PHONE_NUMBER") button["phone_number"] = (b.phone_number ?? "").Trim();
                    buttons.Add(button);
                }
                components.Add(new Dictionary<string, object?>
                {
                    ["type"] = "BUTTONS",
                    ["buttons"] = buttons,
                });
            }

            return components;
        }

        private async Task<List<WhatsAppTemplateDto>> SelectInternal(IDb db, long orgId, long connectionId)
        {
            using var command = db.GetCommand(@"
                SELECT t.*, wc.business_phone, wc.waba_id
                FROM message_templates t
                LEFT JOIN whatsapp_connections wc ON wc.id = t.whatsapp_connection_id
                WHERE t.organisation_id = @organisation_id
                  AND t.whatsapp_connection_id = @whatsapp_connection_id
                  AND t.channel = @channel
                  AND t.is_archived = FALSE
                ORDER BY t.updated_at DESC, t.id DESC
                LIMIT 200;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = connectionId;
            db.AddParameter(command, "channel", DbTypes.Types.String).Value = WhatsAppTemplateChannels.WhatsApp;
            var list = new List<WhatsAppTemplateDto>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(ReadTemplate(reader));
            }
            return list;
        }

        private async Task<WhatsAppTemplateDto?> GetTemplate(IDb db, long organisationId, long id)
        {
            using var command = db.GetCommand(@"
                SELECT t.*, wc.business_phone, wc.waba_id
                FROM message_templates t
                LEFT JOIN whatsapp_connections wc ON wc.id = t.whatsapp_connection_id
                WHERE t.id = @id AND t.organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadTemplate(reader);
        }

        private async Task<WhatsAppOrgConnectionContext> ResolveConnection(
            IDb db,
            long organisationId,
            long whatsappConnectionId)
        {
            WhatsAppOrgConnectionContext? connection;
            if (whatsappConnectionId > 0)
            {
                connection = await GetConnectionById(db, whatsappConnectionId, organisationId);
            }
            else
            {
                connection = await GetPrimaryConnection(db, organisationId);
            }

            if (connection == null)
            {
                throw new Exception("WhatsApp is not connected for this organisation. Connect under Profile → WhatsApp.");
            }
            return connection;
        }

        private static void EnsureConnected(WhatsAppOrgConnectionContext connection)
        {
            if (!connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token) ||
                string.IsNullOrWhiteSpace(connection.waba_id))
            {
                throw new Exception("WhatsApp connection is disconnected, incomplete, or missing WABA credentials.");
            }
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
            return ReadConnection(reader);
        }

        private async Task<WhatsAppOrgConnectionContext?> GetConnectionById(
            IDb db,
            long whatsappConnectionId,
            long organisationId)
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
                LIMIT 1;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.AccessToken;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadConnection(reader);
        }

        private WhatsAppOrgConnectionContext ReadConnection(DbDataReader reader)
        {
            var encrypted = reader["encrypted_value"] == DBNull.Value ? "" : reader["encrypted_value"]?.ToString() ?? "";
            var token = "";
            if (!string.IsNullOrEmpty(encrypted))
            {
                try { token = _secretProtector.Decrypt(encrypted); }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to decrypt WhatsApp access token for template ops");
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

        private static WhatsAppTemplateDto ReadTemplate(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            whatsapp_connection_id = reader["whatsapp_connection_id"] == DBNull.Value
                ? null
                : Convert.ToInt64(reader["whatsapp_connection_id"]),
            channel = reader["channel"]?.ToString() ?? WhatsAppTemplateChannels.WhatsApp,
            template_name = reader["template_name"]?.ToString() ?? "",
            language_code = HasColumn(reader, "language_code") ? reader["language_code"]?.ToString() ?? "" : "",
            category = HasColumn(reader, "category") ? reader["category"]?.ToString() ?? "" : "",
            header_type = HasColumn(reader, "header_type") ? reader["header_type"]?.ToString() ?? "" : "",
            content = reader["content"]?.ToString() ?? "",
            components_json = HasColumn(reader, "components_json") ? reader["components_json"]?.ToString() ?? "[]" : "[]",
            provider_template_id = reader["provider_template_id"]?.ToString() ?? "",
            status = reader["status"]?.ToString() ?? WhatsAppTemplateStatuses.Draft,
            provider_status = HasColumn(reader, "provider_status") ? reader["provider_status"]?.ToString() ?? "" : "",
            rejection_reason = HasColumn(reader, "rejection_reason") ? reader["rejection_reason"]?.ToString() ?? "" : "",
            variable_mappings_json = HasColumn(reader, "variable_mappings_json")
                ? reader["variable_mappings_json"]?.ToString() ?? "[]"
                : "[]",
            provider_quality_score = HasColumn(reader, "provider_quality_score")
                ? reader["provider_quality_score"]?.ToString() ?? ""
                : "",
            is_provider_managed = HasColumn(reader, "is_provider_managed") &&
                                  reader["is_provider_managed"] != DBNull.Value &&
                                  Convert.ToBoolean(reader["is_provider_managed"]),
            is_archived = HasColumn(reader, "is_archived") &&
                          reader["is_archived"] != DBNull.Value &&
                          Convert.ToBoolean(reader["is_archived"]),
            last_synced_at = HasColumn(reader, "last_synced_at") && reader["last_synced_at"] != DBNull.Value
                ? Convert.ToDateTime(reader["last_synced_at"])
                : null,
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
            business_phone = HasColumn(reader, "business_phone") ? reader["business_phone"]?.ToString() ?? "" : "",
            waba_id = HasColumn(reader, "waba_id") ? reader["waba_id"]?.ToString() ?? "" : "",
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

        private long ResolveOrganisationId()
        {
            try
            {
                var ctx = _requestState.usercontext;
                if (ctx != null && ctx.organisationid > 0) return ctx.organisationid;
            }
            catch
            {
                // ignore
            }
            return 0;
        }
    }
}
