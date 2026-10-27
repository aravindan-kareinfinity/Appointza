using System.Data.Common;
using System.Text.Json;
using System.Text.RegularExpressions;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    public class WhatsAppCampaignService
    {
        private static readonly Regex PlaceholderRegex = new(@"\{\{(\d+)\}\}", RegexOptions.Compiled);
        private static readonly HashSet<string> AllowedFieldKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "customer_name", "organisation_name", "booking_datetime", "service_name",
            "event_name", "booking_reference", "phone",
        };

        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly ILogger<WhatsAppCampaignService> _logger;

        public WhatsAppCampaignService(
            IDbProvider dbProvider,
            RequestState requestState,
            ILogger<WhatsAppCampaignService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _logger = logger;
        }

        public async Task<List<WhatsAppCampaignDto>> Select(WhatsAppCampaignSelectReq req)
        {
            var orgId = RequireOrg();
            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            var search = (req.search ?? "").Trim();
            var status = (req.status ?? "").Trim();

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var sql = @"
                SELECT c.*, t.template_name, t.status AS template_status, wc.business_phone, wc.waba_id
                FROM whatsapp_campaigns c
                LEFT JOIN message_templates t ON t.id = c.message_template_id
                LEFT JOIN whatsapp_connections wc ON wc.id = c.whatsapp_connection_id
                WHERE c.organisation_id = @organisation_id
            ";
            if (!string.IsNullOrEmpty(status)) sql += " AND c.status = @status";
            if (!string.IsNullOrEmpty(search)) sql += " AND c.name ILIKE @search";
            sql += " ORDER BY c.created_at DESC, c.id DESC LIMIT @limit OFFSET @offset;";

            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
            db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = offset;
            if (!string.IsNullOrEmpty(status))
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            if (!string.IsNullOrEmpty(search))
                db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";

            var list = new List<WhatsAppCampaignDto>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync()) list.Add(ReadCampaign(reader));
            return list;
        }

        public async Task<WhatsAppCampaignDto?> GetById(long id)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            return await GetCampaign(db, orgId, id);
        }

        public async Task<WhatsAppCampaignDto> Create(WhatsAppCampaignUpsertReq req)
        {
            var orgId = RequireOrg();
            ValidateUpsertBasics(req);

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureConnectionOwned(db, orgId, req.whatsapp_connection_id);
            if (req.message_template_id is > 0)
            {
                await EnsureApprovedTemplate(db, orgId, req.whatsapp_connection_id, req.message_template_id.Value);
            }

            var audienceJson = JsonSerializer.Serialize(req.audience ?? new WhatsAppCampaignAudienceConfig());
            var mappingJson = JsonSerializer.Serialize(req.variable_mapping ?? new List<WhatsAppCampaignVariableMap>());
            var now = DateTime.UtcNow;
            var userId = SafeUserId();

            using var command = db.GetCommand(@"
                INSERT INTO whatsapp_campaigns (
                    organisation_id, whatsapp_connection_id, message_template_id, name, description, category,
                    audience_configuration, variable_mapping, status, timezone, version, created_by, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @message_template_id, @name, @description, @category,
                    @audience_configuration, @variable_mapping, @status, 'UTC', 1, @created_by, @created_at, @updated_at
                ) RETURNING id;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = req.whatsapp_connection_id;
            db.AddParameter(command, "message_template_id", DbTypes.Types.Long).Value =
                req.message_template_id is > 0 ? req.message_template_id.Value : DBNull.Value;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = req.name.Trim();
            db.AddParameter(command, "description", DbTypes.Types.String).Value = req.description?.Trim() ?? "";
            db.AddParameter(command, "category", DbTypes.Types.String).Value =
                (req.category ?? WhatsAppConsentPurposes.Marketing).Trim().ToLowerInvariant();
            db.AddParameter(command, "audience_configuration", DbTypes.Types.String).Value = audienceJson;
            db.AddParameter(command, "variable_mapping", DbTypes.Types.String).Value = mappingJson;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Draft;
            db.AddParameter(command, "created_by", DbTypes.Types.Long).Value = userId > 0 ? userId : DBNull.Value;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) throw new Exception("Failed to create campaign.");
            var id = Convert.ToInt64(reader["id"]);
            return (await GetCampaign(db, orgId, id))!;
        }

        public async Task<WhatsAppCampaignDto> Update(long id, WhatsAppCampaignUpsertReq req)
        {
            var orgId = RequireOrg();
            ValidateUpsertBasics(req);

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var existing = await GetCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.IsEditable(existing.status))
            {
                throw new Exception($"Campaign in status '{existing.status}' cannot be edited.");
            }

            await EnsureConnectionOwned(db, orgId, req.whatsapp_connection_id);
            if (req.message_template_id is > 0)
            {
                await EnsureApprovedTemplate(db, orgId, req.whatsapp_connection_id, req.message_template_id.Value);
            }

            var audienceJson = JsonSerializer.Serialize(req.audience ?? new WhatsAppCampaignAudienceConfig());
            var mappingJson = JsonSerializer.Serialize(req.variable_mapping ?? new List<WhatsAppCampaignVariableMap>());
            var expected = req.expected_version ?? existing.version;

            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET whatsapp_connection_id = @whatsapp_connection_id,
                    message_template_id = @message_template_id,
                    name = @name,
                    description = @description,
                    category = @category,
                    audience_configuration = @audience_configuration,
                    variable_mapping = @variable_mapping,
                    status = @status,
                    validated_at = NULL,
                    validation_summary = '',
                    version = version + 1,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = req.whatsapp_connection_id;
            db.AddParameter(command, "message_template_id", DbTypes.Types.Long).Value =
                req.message_template_id is > 0 ? req.message_template_id.Value : DBNull.Value;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = req.name.Trim();
            db.AddParameter(command, "description", DbTypes.Types.String).Value = req.description?.Trim() ?? "";
            db.AddParameter(command, "category", DbTypes.Types.String).Value =
                (req.category ?? WhatsAppConsentPurposes.Marketing).Trim().ToLowerInvariant();
            db.AddParameter(command, "audience_configuration", DbTypes.Types.String).Value = audienceJson;
            db.AddParameter(command, "variable_mapping", DbTypes.Types.String).Value = mappingJson;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Draft;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using var reader = await db.Execute(command);
            // Execute may not return rowcount via reader; re-fetch and check version bump.
            var updated = await GetCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (updated.version == existing.version)
            {
                throw new Exception("Campaign was modified by another user. Refresh and try again.");
            }
            return updated;
        }

        public async Task<WhatsAppCampaignAudiencePreviewResult> PreviewAudience(WhatsAppCampaignAudiencePreviewReq req)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            if (req.whatsapp_connection_id > 0)
            {
                await EnsureConnectionOwned(db, orgId, req.whatsapp_connection_id);
            }
            return await BuildAudiencePreview(db, orgId, req.audience ?? new WhatsAppCampaignAudienceConfig(),
                req.category ?? WhatsAppConsentPurposes.Marketing, Math.Clamp(req.sample_limit, 1, 50));
        }

        public async Task<WhatsAppCampaignValidateResult> Validate(long id)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var campaign = await GetCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.CanTransition(campaign.status, WhatsAppCampaignStatuses.Validating) &&
                campaign.status != WhatsAppCampaignStatuses.Validating &&
                campaign.status != WhatsAppCampaignStatuses.Draft &&
                campaign.status != WhatsAppCampaignStatuses.Ready &&
                campaign.status != WhatsAppCampaignStatuses.Failed)
            {
                throw new Exception($"Cannot validate campaign in status '{campaign.status}'.");
            }

            await SetStatus(db, orgId, id, campaign.version, WhatsAppCampaignStatuses.Validating);

            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(campaign.name)) errors.Add("Campaign name is required.");
            if (campaign.whatsapp_connection_id <= 0) errors.Add("WhatsApp connection is required.");
            if (campaign.message_template_id is not > 0) errors.Add("An approved template is required.");

            try
            {
                await EnsureConnectionOwned(db, orgId, campaign.whatsapp_connection_id);
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
            }

            WhatsAppTemplateDto? template = null;
            if (campaign.message_template_id is > 0)
            {
                try
                {
                    template = await EnsureApprovedTemplate(
                        db, orgId, campaign.whatsapp_connection_id, campaign.message_template_id.Value);
                }
                catch (Exception ex)
                {
                    errors.Add(ex.Message);
                }
            }

            var audienceConfig = DeserializeAudience(campaign.audience_configuration);
            var mappings = DeserializeMappings(campaign.variable_mapping);
            errors.AddRange(ValidateMappings(mappings, template));

            var audience = await BuildAudiencePreview(
                db, orgId, audienceConfig, campaign.category, 20);

            if (audience.eligible_count <= 0)
            {
                errors.Add("No eligible recipients after consent and phone validation.");
            }

            // Persist recipient snapshot for audit / Phase 6.
            await ReplaceRecipients(db, orgId, id, audienceConfig, campaign.category);

            var isValid = errors.Count == 0;
            var summary = isValid
                ? $"Ready: {audience.eligible_count} eligible, {audience.excluded_count} excluded of {audience.selected_count} selected."
                : string.Join(" ", errors);

            var nextStatus = isValid ? WhatsAppCampaignStatuses.Ready : WhatsAppCampaignStatuses.Draft;
            using (var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @status,
                    selected_count = @selected_count,
                    eligible_count = @eligible_count,
                    excluded_count = @excluded_count,
                    validation_summary = @validation_summary,
                    validated_at = @validated_at,
                    version = version + 1,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "status", DbTypes.Types.String).Value = nextStatus;
                db.AddParameter(command, "selected_count", DbTypes.Types.Integer).Value = audience.selected_count;
                db.AddParameter(command, "eligible_count", DbTypes.Types.Integer).Value = audience.eligible_count;
                db.AddParameter(command, "excluded_count", DbTypes.Types.Integer).Value = audience.excluded_count;
                db.AddParameter(command, "validation_summary", DbTypes.Types.String).Value = summary;
                db.AddParameter(command, "validated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.Execute(command);
            }

            return new WhatsAppCampaignValidateResult
            {
                is_valid = isValid,
                errors = errors,
                campaign = await GetCampaign(db, orgId, id),
                audience = audience,
            };
        }

        public async Task<WhatsAppCampaignPreviewResult> PreviewMessages(long id, WhatsAppCampaignPreviewReq req)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var campaign = await GetCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (campaign.message_template_id is not > 0)
            {
                throw new Exception("Select an approved template before previewing.");
            }

            var template = await EnsureApprovedTemplate(
                db, orgId, campaign.whatsapp_connection_id, campaign.message_template_id.Value);
            var mappings = DeserializeMappings(campaign.variable_mapping);
            var orgName = await GetOrganisationName(db, orgId);

            var sampleLimit = Math.Clamp(req.sample_count <= 0 ? 3 : req.sample_count, 1, 10);
            var recipients = await LoadRecipientSamples(db, orgId, id, sampleLimit);
            if (recipients.Count == 0)
            {
                // Build ephemeral samples without claiming dispatch.
                var preview = await BuildAudiencePreview(
                    db, orgId, DeserializeAudience(campaign.audience_configuration), campaign.category, sampleLimit);
                recipients = preview.samples
                    .Where(s => s.eligibility_status == "eligible")
                    .Take(sampleLimit)
                    .ToList();
            }

            var samples = new List<WhatsAppCampaignMessagePreview>();
            foreach (var r in recipients)
            {
                var resolved = ResolveVariables(mappings, r.display_name, r.phone_normalized, orgName);
                var unresolved = mappings
                    .Where(m => !m.allow_empty &&
                                string.IsNullOrWhiteSpace(resolved.GetValueOrDefault(NormalizePlaceholder(m.placeholder))))
                    .Select(m => m.placeholder)
                    .ToList();

                var parts = ExtractTemplateParts(template.components_json);
                samples.Add(new WhatsAppCampaignMessagePreview
                {
                    display_name = r.display_name,
                    phone_normalized = MaskPhone(r.phone_normalized),
                    header = ApplyPlaceholders(parts.header, resolved),
                    body = ApplyPlaceholders(parts.body, resolved),
                    footer = parts.footer,
                    resolved_variables = resolved,
                    unresolved_required = unresolved,
                });
            }

            return new WhatsAppCampaignPreviewResult
            {
                campaign = campaign,
                template = SanitizeTemplate(template),
                samples = samples,
            };
        }

        public async Task<WhatsAppCampaignDto> Schedule(long id, WhatsAppCampaignScheduleReq req)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var campaign = await GetCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.IsSchedulable(campaign.status))
            {
                throw new Exception("Campaign must be validated and Ready before scheduling.");
            }
            if (req.scheduled_at_utc <= DateTime.UtcNow.AddMinutes(1))
            {
                throw new Exception("Scheduled time must be in the future (UTC).");
            }
            if (campaign.eligible_count <= 0)
            {
                throw new Exception("Campaign has no eligible recipients.");
            }
            if (campaign.message_template_id is > 0)
            {
                await EnsureApprovedTemplate(db, orgId, campaign.whatsapp_connection_id, campaign.message_template_id.Value);
            }

            var expected = req.expected_version ?? campaign.version;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @status,
                    scheduled_at = @scheduled_at,
                    timezone = @timezone,
                    version = version + 1,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version
                  AND status = @ready;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Scheduled;
            db.AddParameter(command, "ready", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Ready;
            db.AddParameter(command, "scheduled_at", DbTypes.Types.DateTime).Value = DateTime.SpecifyKind(req.scheduled_at_utc, DateTimeKind.Utc);
            db.AddParameter(command, "timezone", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.timezone) ? "UTC" : req.timezone.Trim();
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.Execute(command);

            var updated = await GetCampaign(db, orgId, id);
            if (updated == null || updated.status != WhatsAppCampaignStatuses.Scheduled)
            {
                throw new Exception("Could not schedule campaign (concurrency or invalid state). Refresh and try again.");
            }

            // Phase 5 stores schedule only — no dispatch, no fake sent status.
            _logger.LogInformation("WhatsApp campaign {CampaignId} scheduled for {At} (org {OrgId})", id, req.scheduled_at_utc, orgId);
            return updated;
        }

        public async Task<WhatsAppCampaignDto> Cancel(long id, int? expectedVersion = null)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var campaign = await GetCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.CanTransition(campaign.status, WhatsAppCampaignStatuses.Cancelled))
            {
                throw new Exception($"Cannot cancel campaign in status '{campaign.status}'.");
            }

            var expected = expectedVersion ?? campaign.version;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @status,
                    scheduled_at = NULL,
                    version = version + 1,
                    updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelled;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.Execute(command);

            return (await GetCampaign(db, orgId, id))!;
        }

        private async Task<WhatsAppCampaignAudiencePreviewResult> BuildAudiencePreview(
            IDb db,
            long organisationId,
            WhatsAppCampaignAudienceConfig config,
            string purpose,
            int sampleLimit)
        {
            var candidates = await CollectCandidates(db, organisationId, config);
            var result = new WhatsAppCampaignAudiencePreviewResult();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            var samples = new List<WhatsAppCampaignRecipientSample>();

            foreach (var c in candidates)
            {
                var phone = NormalizePhone(c.phone);
                var key = phone;
                if (string.IsNullOrEmpty(key) || !seen.Add(key))
                {
                    if (!string.IsNullOrEmpty(c.phone) && string.IsNullOrEmpty(key))
                    {
                        // invalid phone counted below
                    }
                    else if (!string.IsNullOrEmpty(key))
                    {
                        result.selected_count++;
                        result.excluded_count++;
                        Bump(result.exclusion_reasons, "duplicate");
                        MaybeSample(samples, sampleLimit, c, phone, "excluded", "duplicate");
                        continue;
                    }
                }

                result.selected_count++;

                if (string.IsNullOrEmpty(phone) || phone.Length < 10)
                {
                    result.excluded_count++;
                    Bump(result.exclusion_reasons, "invalid_phone");
                    MaybeSample(samples, sampleLimit, c, phone, "excluded", "invalid_phone");
                    continue;
                }

                var consent = await GetConsentStatus(db, organisationId, phone, purpose);
                if (consent == WhatsAppConsentStatuses.OptedOut)
                {
                    result.excluded_count++;
                    Bump(result.exclusion_reasons, "opted_out");
                    MaybeSample(samples, sampleLimit, c, phone, "excluded", "opted_out");
                    continue;
                }

                // Marketing requires explicit opted_in. Utility/transactional allow unknown with valid phone.
                if (IsMarketingPurpose(purpose) && consent != WhatsAppConsentStatuses.OptedIn)
                {
                    result.excluded_count++;
                    Bump(result.exclusion_reasons, "missing_consent");
                    MaybeSample(samples, sampleLimit, c, phone, "excluded", "missing_consent");
                    continue;
                }

                result.eligible_count++;
                MaybeSample(samples, sampleLimit, c, phone, "eligible", "");
            }

            result.samples = samples;
            return result;
        }

        private async Task ReplaceRecipients(
            IDb db,
            long organisationId,
            long campaignId,
            WhatsAppCampaignAudienceConfig config,
            string purpose)
        {
            using (var del = db.GetCommand(@"
                DELETE FROM whatsapp_campaign_recipients
                WHERE campaign_id = @campaign_id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(del, "campaign_id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(del, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                await db.Execute(del);
            }

            var candidates = await CollectCandidates(db, organisationId, config);
            var seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (var c in candidates)
            {
                var phone = NormalizePhone(c.phone);
                string eligibility;
                string reason;

                if (string.IsNullOrEmpty(phone) || phone.Length < 10)
                {
                    eligibility = "excluded";
                    reason = "invalid_phone";
                    phone = phone ?? "";
                }
                else if (!seen.Add(phone))
                {
                    continue; // unique constraint — skip duplicates entirely
                }
                else
                {
                    var consent = await GetConsentStatus(db, organisationId, phone, purpose);
                    if (consent == WhatsAppConsentStatuses.OptedOut)
                    {
                        eligibility = "excluded";
                        reason = "opted_out";
                    }
                    else if (IsMarketingPurpose(purpose) && consent != WhatsAppConsentStatuses.OptedIn)
                    {
                        eligibility = "excluded";
                        reason = "missing_consent";
                    }
                    else
                    {
                        eligibility = "eligible";
                        reason = "";
                    }
                }

                if (string.IsNullOrEmpty(phone)) continue;

                using var insert = db.GetCommand(@"
                    INSERT INTO whatsapp_campaign_recipients (
                        organisation_id, campaign_id, source_type, source_id, customer_id, enquiry_id,
                        display_name, phone_normalized, eligibility_status, exclusion_reason,
                        processing_status, created_at
                    ) VALUES (
                        @organisation_id, @campaign_id, @source_type, @source_id, @customer_id, @enquiry_id,
                        @display_name, @phone_normalized, @eligibility_status, @exclusion_reason,
                        @processing_status, @created_at
                    );");
                db.AddParameter(insert, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(insert, "campaign_id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(insert, "source_type", DbTypes.Types.String).Value = c.source_type;
                db.AddParameter(insert, "source_id", DbTypes.Types.Long).Value = c.source_id > 0 ? c.source_id : DBNull.Value;
                db.AddParameter(insert, "customer_id", DbTypes.Types.Long).Value = c.customer_id > 0 ? c.customer_id : DBNull.Value;
                db.AddParameter(insert, "enquiry_id", DbTypes.Types.Long).Value = c.enquiry_id > 0 ? c.enquiry_id : DBNull.Value;
                db.AddParameter(insert, "display_name", DbTypes.Types.String).Value = Truncate(c.display_name, 200);
                db.AddParameter(insert, "phone_normalized", DbTypes.Types.String).Value = phone;
                db.AddParameter(insert, "eligibility_status", DbTypes.Types.String).Value = eligibility;
                db.AddParameter(insert, "exclusion_reason", DbTypes.Types.String).Value = reason;
                db.AddParameter(insert, "processing_status", DbTypes.Types.String).Value =
                    eligibility == "eligible"
                        ? WhatsAppCampaignRecipientProcessingStatuses.Pending
                        : WhatsAppCampaignRecipientProcessingStatuses.Skipped;
                db.AddParameter(insert, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.Execute(insert);
            }
        }

        private async Task<List<AudienceCandidate>> CollectCandidates(
            IDb db,
            long organisationId,
            WhatsAppCampaignAudienceConfig config)
        {
            var sources = (config.sources ?? new List<string>()).Select(s => s.Trim().ToLowerInvariant()).ToHashSet();
            if (sources.Count == 0)
            {
                sources.Add("client");
                sources.Add("lead");
            }

            var limit = Math.Clamp(config.limit <= 0 ? 5000 : config.limit, 1, 20000);
            var list = new List<AudienceCandidate>();
            var search = (config.search ?? "").Trim();

            if (sources.Contains("client") || sources.Contains("booking"))
            {
                var sql = @"
                    SELECT DISTINCT u.id AS customer_id, u.name, u.mobile
                    FROM users u
                    INNER JOIN appoinment a ON a.userid = u.id
                    WHERE a.organisationid = @organisation_id
                      AND a.isactive = TRUE
                      AND COALESCE(u.mobile, '') <> ''
                ";
                if (config.booking_from.HasValue) sql += " AND a.appoinmentdate >= @booking_from";
                if (config.booking_to.HasValue) sql += " AND a.appoinmentdate <= @booking_to";
                if (!string.IsNullOrEmpty(search))
                    sql += " AND (u.name ILIKE @search OR u.mobile ILIKE @search)";
                sql += " LIMIT @limit;";

                using var command = db.GetCommand(sql);
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
                if (config.booking_from.HasValue)
                    db.AddParameter(command, "booking_from", DbTypes.Types.DateTime).Value = config.booking_from.Value;
                if (config.booking_to.HasValue)
                    db.AddParameter(command, "booking_to", DbTypes.Types.DateTime).Value = config.booking_to.Value;
                if (!string.IsNullOrEmpty(search))
                    db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";

                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    list.Add(new AudienceCandidate
                    {
                        source_type = "client",
                        source_id = Convert.ToInt64(reader["customer_id"]),
                        customer_id = Convert.ToInt64(reader["customer_id"]),
                        display_name = reader["name"]?.ToString() ?? "",
                        phone = reader["mobile"]?.ToString() ?? "",
                    });
                }
            }

            if (sources.Contains("lead"))
            {
                var sql = @"
                    SELECT id, COALESCE(NULLIF(owner_name, ''), NULLIF(name, ''), business_name, '') AS display_name, mobile, tags, status
                    FROM enquiries
                    WHERE organisation_id = @organisation_id
                      AND is_active = TRUE
                      AND COALESCE(mobile, '') <> ''
                ";
                if (!string.IsNullOrEmpty(config.lead_status))
                    sql += " AND status = @lead_status";
                if (!string.IsNullOrEmpty(config.lead_tag))
                    sql += " AND tags ILIKE @lead_tag";
                if (!string.IsNullOrEmpty(search))
                    sql += " AND (name ILIKE @search OR mobile ILIKE @search OR owner_name ILIKE @search)";
                sql += " LIMIT @limit;";

                using var command = db.GetCommand(sql);
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
                if (!string.IsNullOrEmpty(config.lead_status))
                    db.AddParameter(command, "lead_status", DbTypes.Types.String).Value = config.lead_status;
                if (!string.IsNullOrEmpty(config.lead_tag))
                    db.AddParameter(command, "lead_tag", DbTypes.Types.String).Value = "%" + config.lead_tag + "%";
                if (!string.IsNullOrEmpty(search))
                    db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";

                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    list.Add(new AudienceCandidate
                    {
                        source_type = "lead",
                        source_id = Convert.ToInt64(reader["id"]),
                        enquiry_id = Convert.ToInt64(reader["id"]),
                        display_name = reader["display_name"]?.ToString() ?? "",
                        phone = reader["mobile"]?.ToString() ?? "",
                    });
                }
            }

            if (sources.Contains("conversation"))
            {
                var sql = @"
                    SELECT id, customer_id, customer_wa_id, customer_name
                    FROM whatsapp_conversations
                    WHERE organisation_id = @organisation_id
                      AND COALESCE(customer_wa_id, '') <> ''
                ";
                if (!string.IsNullOrEmpty(search))
                    sql += " AND (customer_name ILIKE @search OR customer_wa_id ILIKE @search)";
                sql += " LIMIT @limit;";

                using var command = db.GetCommand(sql);
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
                if (!string.IsNullOrEmpty(search))
                    db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";

                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    list.Add(new AudienceCandidate
                    {
                        source_type = "conversation",
                        source_id = Convert.ToInt64(reader["id"]),
                        customer_id = reader["customer_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["customer_id"]),
                        display_name = reader["customer_name"]?.ToString() ?? "",
                        phone = reader["customer_wa_id"]?.ToString() ?? "",
                    });
                }
            }

            if (sources.Contains("event") && config.event_id is > 0)
            {
                var sql = @"
                    SELECT DISTINCT u.id AS customer_id, u.name, u.mobile, eb.id AS booking_id
                    FROM event_bookings eb
                    INNER JOIN events e ON e.id = eb.event_id
                    INNER JOIN users u ON u.id = eb.user_id
                    WHERE e.organisation_id = @organisation_id
                      AND eb.organisation_id = @organisation_id
                      AND eb.event_id = @event_id
                      AND COALESCE(u.mobile, '') <> ''
                    LIMIT @limit;";
                using var command = db.GetCommand(sql);
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "event_id", DbTypes.Types.Long).Value = config.event_id.Value;
                db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    list.Add(new AudienceCandidate
                    {
                        source_type = "event",
                        source_id = Convert.ToInt64(reader["booking_id"]),
                        customer_id = Convert.ToInt64(reader["customer_id"]),
                        display_name = reader["name"]?.ToString() ?? "",
                        phone = reader["mobile"]?.ToString() ?? "",
                    });
                }
            }

            return list;
        }

        private async Task<string> GetConsentStatus(IDb db, long organisationId, string phone, string purpose)
        {
            purpose = NormalizePurpose(purpose);
            using var command = db.GetCommand(@"
                SELECT status FROM whatsapp_communication_consent
                WHERE organisation_id = @organisation_id
                  AND phone_normalized = @phone_normalized
                  AND purpose = @purpose
                LIMIT 1;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "phone_normalized", DbTypes.Types.String).Value = phone;
            db.AddParameter(command, "purpose", DbTypes.Types.String).Value = purpose;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return WhatsAppConsentStatuses.Unknown;
            return reader["status"]?.ToString() ?? WhatsAppConsentStatuses.Unknown;
        }

        private async Task EnsureConnectionOwned(IDb db, long organisationId, long connectionId)
        {
            using var command = db.GetCommand(@"
                SELECT 1
                FROM whatsapp_connections wc
                INNER JOIN organization_integrations oi ON oi.id = wc.integration_id
                WHERE wc.id = @id
                  AND oi.organisation_id = @organisation_id
                  AND oi.provider = 'whatsapp'
                  AND oi.is_active = TRUE
                  AND oi.status = @connected
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = connectionId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "connected", DbTypes.Types.String).Value = IntegrationStatuses.Connected;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception("WhatsApp connection not found or not connected for this organisation.");
            }
        }

        private async Task<WhatsAppTemplateDto> EnsureApprovedTemplate(
            IDb db,
            long organisationId,
            long connectionId,
            long templateId)
        {
            using var command = db.GetCommand(@"
                SELECT t.*, wc.business_phone, wc.waba_id
                FROM message_templates t
                LEFT JOIN whatsapp_connections wc ON wc.id = t.whatsapp_connection_id
                WHERE t.id = @id
                  AND t.organisation_id = @organisation_id
                  AND t.whatsapp_connection_id = @whatsapp_connection_id
                  AND t.channel = 'whatsapp'
                  AND t.is_archived = FALSE
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
                throw new Exception($"Template is not approved (status: {status}). Only Meta-approved templates can be used.");
            }

            return new WhatsAppTemplateDto
            {
                id = Convert.ToInt64(reader["id"]),
                organisation_id = organisationId,
                whatsapp_connection_id = connectionId,
                template_name = reader["template_name"]?.ToString() ?? "",
                language_code = reader["language_code"]?.ToString() ?? "",
                category = reader["category"]?.ToString() ?? "",
                components_json = reader["components_json"]?.ToString() ?? "[]",
                provider_template_id = reader["provider_template_id"]?.ToString() ?? "",
                status = status,
                provider_status = reader["provider_status"]?.ToString() ?? "",
                content = reader["content"]?.ToString() ?? "",
            };
        }

        private async Task<WhatsAppCampaignDto?> GetCampaign(IDb db, long organisationId, long id)
        {
            using var command = db.GetCommand(@"
                SELECT c.*, t.template_name, t.status AS template_status, wc.business_phone, wc.waba_id
                FROM whatsapp_campaigns c
                LEFT JOIN message_templates t ON t.id = c.message_template_id
                LEFT JOIN whatsapp_connections wc ON wc.id = c.whatsapp_connection_id
                WHERE c.id = @id AND c.organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadCampaign(reader);
        }

        private async Task SetStatus(IDb db, long orgId, long id, int expectedVersion, string status)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @status, updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.Execute(command);
        }

        private async Task<List<WhatsAppCampaignRecipientSample>> LoadRecipientSamples(
            IDb db, long orgId, long campaignId, int limit)
        {
            var list = new List<WhatsAppCampaignRecipientSample>();
            using var command = db.GetCommand(@"
                SELECT display_name, phone_normalized, source_type, eligibility_status, exclusion_reason
                FROM whatsapp_campaign_recipients
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id
                  AND eligibility_status = 'eligible'
                ORDER BY id ASC
                LIMIT @limit;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(new WhatsAppCampaignRecipientSample
                {
                    display_name = reader["display_name"]?.ToString() ?? "",
                    phone_normalized = reader["phone_normalized"]?.ToString() ?? "",
                    source_type = reader["source_type"]?.ToString() ?? "",
                    eligibility_status = reader["eligibility_status"]?.ToString() ?? "",
                    exclusion_reason = reader["exclusion_reason"]?.ToString() ?? "",
                });
            }
            return list;
        }

        private async Task<string> GetOrganisationName(IDb db, long organisationId)
        {
            try
            {
                using var command = db.GetCommand("SELECT name FROM organisation WHERE id = @id LIMIT 1;");
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
                using var reader = await db.Execute(command);
                if (await reader.ReadAsync()) return reader["name"]?.ToString() ?? "";
            }
            catch
            {
                // table name may differ; ignore
            }
            return "";
        }

        private static List<string> ValidateMappings(List<WhatsAppCampaignVariableMap> mappings, WhatsAppTemplateDto? template)
        {
            var errors = new List<string>();
            if (template == null) return errors;

            var body = ExtractTemplateParts(template.components_json).body;
            var required = PlaceholderRegex.Matches(body)
                .Select(m => "{{" + m.Groups[1].Value + "}}")
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var ph in required)
            {
                var map = mappings.FirstOrDefault(m =>
                    string.Equals(NormalizePlaceholder(m.placeholder), NormalizePlaceholder(ph), StringComparison.OrdinalIgnoreCase));
                if (map == null)
                {
                    errors.Add($"Missing variable mapping for {ph}.");
                    continue;
                }
                if (string.Equals(map.source_type, "fixed", StringComparison.OrdinalIgnoreCase))
                {
                    if (string.IsNullOrWhiteSpace(map.fixed_value) && !map.allow_empty)
                        errors.Add($"Fixed value required for {ph}.");
                }
                else if (!AllowedFieldKeys.Contains(map.source_key ?? ""))
                {
                    errors.Add($"Unsupported variable source '{map.source_key}' for {ph}.");
                }
            }
            return errors;
        }

        private static Dictionary<string, string> ResolveVariables(
            List<WhatsAppCampaignVariableMap> mappings,
            string customerName,
            string phone,
            string organisationName)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var m in mappings)
            {
                var key = NormalizePlaceholder(m.placeholder);
                string value;
                if (string.Equals(m.source_type, "fixed", StringComparison.OrdinalIgnoreCase))
                {
                    value = m.fixed_value ?? "";
                }
                else
                {
                    value = (m.source_key ?? "").ToLowerInvariant() switch
                    {
                        "customer_name" => customerName,
                        "organisation_name" => organisationName,
                        "phone" => phone,
                        "booking_datetime" => m.fallback_value ?? "",
                        "service_name" => m.fallback_value ?? "",
                        "event_name" => m.fallback_value ?? "",
                        "booking_reference" => m.fallback_value ?? "",
                        _ => "",
                    };
                }
                if (string.IsNullOrWhiteSpace(value) && !string.IsNullOrWhiteSpace(m.fallback_value))
                {
                    value = m.fallback_value;
                }
                dict[key] = value ?? "";
            }
            return dict;
        }

        private static (string header, string body, string footer) ExtractTemplateParts(string componentsJson)
        {
            string header = "", body = "", footer = "";
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(componentsJson) ? "[]" : componentsJson);
                if (doc.RootElement.ValueKind != JsonValueKind.Array) return (header, body, footer);
                foreach (var c in doc.RootElement.EnumerateArray())
                {
                    var type = c.TryGetProperty("type", out var t) ? t.GetString()?.ToUpperInvariant() : "";
                    var text = c.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                    if (type == "HEADER") header = text;
                    if (type == "BODY") body = text;
                    if (type == "FOOTER") footer = text;
                }
            }
            catch { /* ignore */ }
            return (header, body, footer);
        }

        private static string ApplyPlaceholders(string text, Dictionary<string, string> values)
        {
            return PlaceholderRegex.Replace(text ?? "", m =>
            {
                var key = "{{" + m.Groups[1].Value + "}}";
                return values.TryGetValue(key, out var v) && !string.IsNullOrEmpty(v) ? v : m.Value;
            });
        }

        private static string NormalizePlaceholder(string? ph)
        {
            ph = (ph ?? "").Trim();
            if (PlaceholderRegex.IsMatch(ph)) return ph;
            if (int.TryParse(ph, out var n)) return "{{" + n + "}}";
            return ph;
        }

        private static WhatsAppTemplateDto SanitizeTemplate(WhatsAppTemplateDto t) => new()
        {
            id = t.id,
            organisation_id = t.organisation_id,
            whatsapp_connection_id = t.whatsapp_connection_id,
            template_name = t.template_name,
            language_code = t.language_code,
            category = t.category,
            components_json = t.components_json,
            provider_template_id = t.provider_template_id,
            status = t.status,
            provider_status = t.provider_status,
            content = t.content,
            // never surface secrets
        };

        private static void ValidateUpsertBasics(WhatsAppCampaignUpsertReq req)
        {
            if (string.IsNullOrWhiteSpace(req.name)) throw new Exception("Campaign name is required.");
            if (req.name.Trim().Length > 200) throw new Exception("Campaign name is too long.");
            if (req.whatsapp_connection_id <= 0) throw new Exception("WhatsApp connection is required.");
            foreach (var m in req.variable_mapping ?? new List<WhatsAppCampaignVariableMap>())
            {
                if (string.Equals(m.source_type, "field", StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(m.source_key) &&
                    !AllowedFieldKeys.Contains(m.source_key))
                {
                    throw new Exception($"Unsupported variable source '{m.source_key}'.");
                }
            }
        }

        private static WhatsAppCampaignAudienceConfig DeserializeAudience(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<WhatsAppCampaignAudienceConfig>(
                    string.IsNullOrWhiteSpace(json) ? "{}" : json) ?? new WhatsAppCampaignAudienceConfig();
            }
            catch { return new WhatsAppCampaignAudienceConfig(); }
        }

        private static List<WhatsAppCampaignVariableMap> DeserializeMappings(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<List<WhatsAppCampaignVariableMap>>(
                    string.IsNullOrWhiteSpace(json) ? "[]" : json) ?? new List<WhatsAppCampaignVariableMap>();
            }
            catch { return new List<WhatsAppCampaignVariableMap>(); }
        }

        private static WhatsAppCampaignDto ReadCampaign(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            whatsapp_connection_id = Convert.ToInt64(reader["whatsapp_connection_id"]),
            message_template_id = reader["message_template_id"] == DBNull.Value ? null : Convert.ToInt64(reader["message_template_id"]),
            name = reader["name"]?.ToString() ?? "",
            description = reader["description"]?.ToString() ?? "",
            category = reader["category"]?.ToString() ?? WhatsAppConsentPurposes.Marketing,
            audience_configuration = reader["audience_configuration"]?.ToString() ?? "{}",
            variable_mapping = reader["variable_mapping"]?.ToString() ?? "[]",
            status = reader["status"]?.ToString() ?? WhatsAppCampaignStatuses.Draft,
            scheduled_at = reader["scheduled_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["scheduled_at"]),
            timezone = reader["timezone"]?.ToString() ?? "UTC",
            selected_count = reader["selected_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["selected_count"]),
            eligible_count = reader["eligible_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["eligible_count"]),
            excluded_count = reader["excluded_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["excluded_count"]),
            accepted_count = HasColumn(reader, "accepted_count") && reader["accepted_count"] != DBNull.Value ? Convert.ToInt32(reader["accepted_count"]) : 0,
            delivered_count = HasColumn(reader, "delivered_count") && reader["delivered_count"] != DBNull.Value ? Convert.ToInt32(reader["delivered_count"]) : 0,
            read_count = HasColumn(reader, "read_count") && reader["read_count"] != DBNull.Value ? Convert.ToInt32(reader["read_count"]) : 0,
            failed_count = HasColumn(reader, "failed_count") && reader["failed_count"] != DBNull.Value ? Convert.ToInt32(reader["failed_count"]) : 0,
            cancelled_count = HasColumn(reader, "cancelled_count") && reader["cancelled_count"] != DBNull.Value ? Convert.ToInt32(reader["cancelled_count"]) : 0,
            unknown_count = HasColumn(reader, "unknown_count") && reader["unknown_count"] != DBNull.Value ? Convert.ToInt32(reader["unknown_count"]) : 0,
            validation_summary = reader["validation_summary"]?.ToString() ?? "",
            validated_at = reader["validated_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["validated_at"]),
            started_at = HasColumn(reader, "started_at") && reader["started_at"] != DBNull.Value ? Convert.ToDateTime(reader["started_at"]) : null,
            completed_at = HasColumn(reader, "completed_at") && reader["completed_at"] != DBNull.Value ? Convert.ToDateTime(reader["completed_at"]) : null,
            paused_at = HasColumn(reader, "paused_at") && reader["paused_at"] != DBNull.Value ? Convert.ToDateTime(reader["paused_at"]) : null,
            version = reader["version"] == DBNull.Value ? 1 : Convert.ToInt32(reader["version"]),
            created_by = reader["created_by"] == DBNull.Value ? null : Convert.ToInt64(reader["created_by"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
            template_name = HasColumn(reader, "template_name") ? reader["template_name"]?.ToString() ?? "" : "",
            template_status = HasColumn(reader, "template_status") ? reader["template_status"]?.ToString() ?? "" : "",
            business_phone = HasColumn(reader, "business_phone") ? reader["business_phone"]?.ToString() ?? "" : "",
            waba_id = HasColumn(reader, "waba_id") ? reader["waba_id"]?.ToString() ?? "" : "",
        };

        private static bool HasColumn(DbDataReader reader, string name)
        {
            for (var i = 0; i < reader.FieldCount; i++)
                if (string.Equals(reader.GetName(i), name, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        private static void MaybeSample(
            List<WhatsAppCampaignRecipientSample> samples,
            int limit,
            AudienceCandidate c,
            string phone,
            string eligibility,
            string reason)
        {
            if (samples.Count >= limit) return;
            samples.Add(new WhatsAppCampaignRecipientSample
            {
                display_name = c.display_name,
                phone_normalized = MaskPhone(phone),
                source_type = c.source_type,
                eligibility_status = eligibility,
                exclusion_reason = reason,
            });
        }

        private static void Bump(Dictionary<string, int> dict, string key)
        {
            dict.TryGetValue(key, out var n);
            dict[key] = n + 1;
        }

        private static string NormalizePhone(string? value)
        {
            var digits = new string((value ?? "").Where(char.IsDigit).ToArray());
            if (digits.Length == 10) digits = "91" + digits;
            return digits;
        }

        private static string MaskPhone(string phone)
        {
            if (string.IsNullOrEmpty(phone) || phone.Length < 4) return phone ?? "";
            return new string('*', Math.Max(0, phone.Length - 4)) + phone[^4..];
        }

        private static bool IsMarketingPurpose(string purpose) =>
            string.Equals(NormalizePurpose(purpose), WhatsAppConsentPurposes.Marketing, StringComparison.OrdinalIgnoreCase);

        private static string NormalizePurpose(string purpose)
        {
            purpose = (purpose ?? "").Trim().ToLowerInvariant();
            return purpose switch
            {
                "utility" => WhatsAppConsentPurposes.Utility,
                "transactional" => WhatsAppConsentPurposes.Transactional,
                _ => WhatsAppConsentPurposes.Marketing,
            };
        }

        private static string Truncate(string value, int max) =>
            string.IsNullOrEmpty(value) ? "" : value.Length <= max ? value : value[..max];

        private long RequireOrg()
        {
            try
            {
                var ctx = _requestState.usercontext;
                if (ctx != null && ctx.organisationid > 0) return ctx.organisationid;
            }
            catch { /* ignore */ }
            throw new Exception("Organisation is required.");
        }

        private long SafeUserId()
        {
            try { return _requestState.usercontext?.userid ?? 0; }
            catch { return 0; }
        }

        private sealed class AudienceCandidate
        {
            public string source_type { get; set; } = "";
            public long source_id { get; set; }
            public long customer_id { get; set; }
            public long enquiry_id { get; set; }
            public string display_name { get; set; } = "";
            public string phone { get; set; } = "";
        }
    }
}
