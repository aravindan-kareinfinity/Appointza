using System.Data.Common;
using System.Text.Json;
using System.Text.RegularExpressions;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    /// <summary>
    /// Phase 7: org WhatsApp automation rules, durable outbox executions, template dispatch.
    /// Reuses WhatsAppCloudApiClient.SendTemplateAsync and whatsapp_messages — not a second send engine.
    /// </summary>
    public class WhatsAppAutomationService
    {
        private static readonly Regex PlaceholderRegex = new(@"\{\{(\d+)\}\}", RegexOptions.Compiled);
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly WhatsAppCloudApiClient _cloudApi;
        private readonly SecretProtector _secretProtector;
        private readonly WhatsAppOutboundGuard _outboundGuard;
        private readonly WhatsAppAutomationWorkerOptions _options;
        private readonly ILogger<WhatsAppAutomationService> _logger;
        private readonly string _workerId = BuildWorkerId("auto");

        public WhatsAppAutomationService(
            IDbProvider dbProvider,
            RequestState requestState,
            WhatsAppCloudApiClient cloudApi,
            SecretProtector secretProtector,
            WhatsAppOutboundGuard outboundGuard,
            Microsoft.Extensions.Options.IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppAutomationService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _cloudApi = cloudApi;
            _secretProtector = secretProtector;
            _outboundGuard = outboundGuard;
            _options = settings.Value.whatsapp?.automation_worker ?? new WhatsAppAutomationWorkerOptions();
            _logger = logger;
        }

        public async Task<List<WhatsAppAutomationRuleDto>> SelectRules(WhatsAppAutomationSelectReq req)
        {
            var orgId = RequireOrg();
            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var sql = @"
                SELECT r.*, t.template_name, t.status AS template_status, wc.business_phone
                FROM whatsapp_automation_rules r
                LEFT JOIN message_templates t ON t.id = r.message_template_id
                LEFT JOIN whatsapp_connections wc ON wc.id = r.whatsapp_connection_id
                WHERE r.organisation_id = @organisation_id";
            if (!string.IsNullOrWhiteSpace(req.trigger_type)) sql += " AND r.trigger_type = @trigger_type";
            if (req.is_enabled.HasValue) sql += " AND r.is_enabled = @is_enabled";
            if (!string.IsNullOrWhiteSpace(req.search)) sql += " AND r.name ILIKE @search";
            sql += " ORDER BY r.updated_at DESC, r.id DESC LIMIT @limit OFFSET @offset;";

            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
            db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = offset;
            if (!string.IsNullOrWhiteSpace(req.trigger_type))
                db.AddParameter(command, "trigger_type", DbTypes.Types.String).Value = req.trigger_type.Trim();
            if (req.is_enabled.HasValue)
                db.AddParameter(command, "is_enabled", DbTypes.Types.Boolean).Value = req.is_enabled.Value;
            if (!string.IsNullOrWhiteSpace(req.search))
                db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + req.search.Trim() + "%";

            var list = new List<WhatsAppAutomationRuleDto>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync()) list.Add(ReadRule(reader));
            return list;
        }

        public async Task<WhatsAppAutomationRuleDto?> GetRule(long id)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            return await LoadRule(db, orgId, id);
        }

        public async Task<WhatsAppAutomationRuleDto> CreateRule(WhatsAppAutomationRuleUpsertReq req)
        {
            var orgId = RequireOrg();
            ValidateRuleUpsert(req);
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureConnectionOwned(db, orgId, req.whatsapp_connection_id);
            await EnsureApprovedTemplate(db, orgId, req.whatsapp_connection_id, req.message_template_id);

            var mappingJson = JsonSerializer.Serialize(req.variable_mapping ?? new List<WhatsAppCampaignVariableMap>());
            var now = DateTime.UtcNow;
            using var command = db.GetCommand(@"
                INSERT INTO whatsapp_automation_rules (
                    organisation_id, name, trigger_type, whatsapp_connection_id, message_template_id,
                    is_enabled, purpose, delay_minutes, reminder_offset_minutes, timezone,
                    conditions_json, variable_mapping, version, created_by, created_at, updated_at
                ) VALUES (
                    @organisation_id, @name, @trigger_type, @whatsapp_connection_id, @message_template_id,
                    @is_enabled, @purpose, @delay_minutes, @reminder_offset_minutes, @timezone,
                    @conditions_json, @variable_mapping, 1, @created_by, @now, @now
                ) RETURNING id;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = req.name.Trim();
            db.AddParameter(command, "trigger_type", DbTypes.Types.String).Value = req.trigger_type.Trim().ToLowerInvariant();
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = req.whatsapp_connection_id;
            db.AddParameter(command, "message_template_id", DbTypes.Types.Long).Value = req.message_template_id;
            db.AddParameter(command, "is_enabled", DbTypes.Types.Boolean).Value = req.is_enabled;
            db.AddParameter(command, "purpose", DbTypes.Types.String).Value = NormalizePurpose(req.purpose);
            db.AddParameter(command, "delay_minutes", DbTypes.Types.Integer).Value = Math.Max(0, req.delay_minutes);
            db.AddParameter(command, "reminder_offset_minutes", DbTypes.Types.Integer).Value =
                req.reminder_offset_minutes.HasValue ? req.reminder_offset_minutes.Value : DBNull.Value;
            db.AddParameter(command, "timezone", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.timezone) ? "UTC" : req.timezone.Trim();
            db.AddParameter(command, "conditions_json", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.conditions_json) ? "{}" : req.conditions_json;
            db.AddParameter(command, "variable_mapping", DbTypes.Types.String).Value = mappingJson;
            db.AddParameter(command, "created_by", DbTypes.Types.Long).Value = SafeUserId();
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;

            long id;
            using (var reader = await db.Execute(command))
            {
                if (!await reader.ReadAsync()) throw new Exception("Failed to create automation rule.");
                id = Convert.ToInt64(reader["id"]);
            }
            return (await LoadRule(db, orgId, id))!;
        }

        public async Task<WhatsAppAutomationRuleDto> UpdateRule(long id, WhatsAppAutomationRuleUpsertReq req)
        {
            var orgId = RequireOrg();
            req.id = id;
            ValidateRuleUpsert(req);
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var existing = await LoadRule(db, orgId, id) ?? throw new Exception("Automation rule not found.");
            await EnsureConnectionOwned(db, orgId, req.whatsapp_connection_id);
            await EnsureApprovedTemplate(db, orgId, req.whatsapp_connection_id, req.message_template_id);

            var expected = req.expected_version ?? existing.version;
            var mappingJson = JsonSerializer.Serialize(req.variable_mapping ?? new List<WhatsAppCampaignVariableMap>());
            using var command = db.GetCommand(@"
                UPDATE whatsapp_automation_rules
                SET name = @name,
                    trigger_type = @trigger_type,
                    whatsapp_connection_id = @whatsapp_connection_id,
                    message_template_id = @message_template_id,
                    is_enabled = @is_enabled,
                    purpose = @purpose,
                    delay_minutes = @delay_minutes,
                    reminder_offset_minutes = @reminder_offset_minutes,
                    timezone = @timezone,
                    conditions_json = @conditions_json,
                    variable_mapping = @variable_mapping,
                    version = version + 1,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = req.name.Trim();
            db.AddParameter(command, "trigger_type", DbTypes.Types.String).Value = req.trigger_type.Trim().ToLowerInvariant();
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = req.whatsapp_connection_id;
            db.AddParameter(command, "message_template_id", DbTypes.Types.Long).Value = req.message_template_id;
            db.AddParameter(command, "is_enabled", DbTypes.Types.Boolean).Value = req.is_enabled;
            db.AddParameter(command, "purpose", DbTypes.Types.String).Value = NormalizePurpose(req.purpose);
            db.AddParameter(command, "delay_minutes", DbTypes.Types.Integer).Value = Math.Max(0, req.delay_minutes);
            db.AddParameter(command, "reminder_offset_minutes", DbTypes.Types.Integer).Value =
                req.reminder_offset_minutes.HasValue ? req.reminder_offset_minutes.Value : DBNull.Value;
            db.AddParameter(command, "timezone", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.timezone) ? "UTC" : req.timezone.Trim();
            db.AddParameter(command, "conditions_json", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.conditions_json) ? "{}" : req.conditions_json;
            db.AddParameter(command, "variable_mapping", DbTypes.Types.String).Value = mappingJson;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);

            return (await LoadRule(db, orgId, id))
                   ?? throw new Exception("Could not update automation rule (concurrency).");
        }

        public async Task<WhatsAppAutomationRuleDto> SetEnabled(long id, bool enabled, int? expectedVersion = null)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var existing = await LoadRule(db, orgId, id) ?? throw new Exception("Automation rule not found.");
            var expected = expectedVersion ?? existing.version;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_automation_rules
                SET is_enabled = @is_enabled, version = version + 1, updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "is_enabled", DbTypes.Types.Boolean).Value = enabled;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
            return (await LoadRule(db, orgId, id))!;
        }

        public async Task<(List<WhatsAppAutomationExecutionDto> items, int total)> SelectExecutions(
            WhatsAppAutomationExecutionSelectReq req)
        {
            var orgId = RequireOrg();
            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var where = " WHERE e.organisation_id = @organisation_id";
            if (req.automation_rule_id is > 0) where += " AND e.automation_rule_id = @automation_rule_id";
            if (!string.IsNullOrWhiteSpace(req.status)) where += " AND e.status = @status";
            if (!string.IsNullOrWhiteSpace(req.search))
                where += " AND (e.recipient_display_name ILIKE @search OR e.recipient_phone_normalized ILIKE @search OR r.name ILIKE @search)";

            int total;
            using (var countCmd = db.GetCommand($@"
                SELECT COUNT(*)::int AS cnt
                FROM whatsapp_automation_executions e
                LEFT JOIN whatsapp_automation_rules r ON r.id = e.automation_rule_id
                {where};"))
            {
                BindExecParams(db, countCmd, orgId, req);
                using var reader = await db.Execute(countCmd);
                await reader.ReadAsync();
                total = Convert.ToInt32(reader["cnt"]);
            }

            var list = new List<WhatsAppAutomationExecutionDto>();
            using (var command = db.GetCommand($@"
                SELECT e.*, r.name AS rule_name
                FROM whatsapp_automation_executions e
                LEFT JOIN whatsapp_automation_rules r ON r.id = e.automation_rule_id
                {where}
                ORDER BY e.created_at DESC, e.id DESC
                LIMIT @limit OFFSET @offset;"))
            {
                BindExecParams(db, command, orgId, req);
                db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
                db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = offset;
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    var item = ReadExecution(reader);
                    item.recipient_phone_normalized = MaskPhone(item.recipient_phone_normalized);
                    list.Add(item);
                }
            }
            return (list, total);
        }

        public async Task<WhatsAppAutomationExecutionDto?> GetExecution(long id)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            using var command = db.GetCommand(@"
                SELECT e.*, r.name AS rule_name
                FROM whatsapp_automation_executions e
                LEFT JOIN whatsapp_automation_rules r ON r.id = e.automation_rule_id
                WHERE e.id = @id AND e.organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            var item = ReadExecution(reader);
            item.recipient_phone_normalized = MaskPhone(item.recipient_phone_normalized);
            return item;
        }

        /// <summary>
        /// Domain hook: enqueue durable executions for all enabled matching rules.
        /// Safe to call after business commit; duplicates are ignored via idempotency key.
        /// </summary>
        public async Task EnqueueBusinessEventAsync(WhatsAppAutomationBusinessEvent evt)
        {
            if (evt.organisation_id <= 0 || string.IsNullOrWhiteSpace(evt.trigger_type)) return;
            if (!WhatsAppAutomationTriggers.All.Contains(evt.trigger_type.Trim()))
            {
                _logger.LogWarning("Ignoring unsupported automation trigger {Trigger}", evt.trigger_type);
                return;
            }

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var rules = await LoadEnabledRules(db, evt.organisation_id, evt.trigger_type.Trim().ToLowerInvariant());
            if (rules.Count == 0) return;

            var phone = NormalizePhone(evt.recipient_phone);
            foreach (var rule in rules)
            {
                try
                {
                    await InsertExecutionForRule(db, rule, evt, phone);
                }
                catch (Exception ex)
                {
                    // Unique violation = duplicate event — expected and safe
                    if (IsUniqueViolation(ex))
                    {
                        _logger.LogInformation(
                            "Skipped duplicate automation execution org={Org} rule={Rule} entity={Entity}/{Id}",
                            evt.organisation_id, rule.id, evt.business_entity_type, evt.business_entity_id);
                        continue;
                    }
                    _logger.LogWarning(ex, "Failed to enqueue automation rule {RuleId}", rule.id);
                }
            }
        }

        /// <summary>Cancel pending/scheduled/queued executions for an entity (cancel/reschedule).</summary>
        public async Task InvalidatePendingForEntityAsync(
            long organisationId,
            string entityType,
            long entityId)
        {
            if (organisationId <= 0 || entityId <= 0) return;
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            using var command = db.GetCommand(@"
                UPDATE whatsapp_automation_executions
                SET status = @cancelled,
                    failure_category = @permanent,
                    failure_reason = @reason,
                    lease_owner = '',
                    lease_until = NULL,
                    updated_at = @now
                WHERE organisation_id = @organisation_id
                  AND business_entity_type = @entity_type
                  AND business_entity_id = @entity_id
                  AND status IN (@pending, @scheduled, @queued, @processing)
                  AND COALESCE(provider_message_id, '') = '';");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "entity_type", DbTypes.Types.String).Value = entityType;
            db.AddParameter(command, "entity_id", DbTypes.Types.Long).Value = entityId;
            db.AddParameter(command, "cancelled", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Cancelled;
            db.AddParameter(command, "permanent", DbTypes.Types.String).Value = WhatsAppCampaignErrorCategories.Permanent;
            db.AddParameter(command, "reason", DbTypes.Types.String).Value = "Superseded by cancel/reschedule.";
            db.AddParameter(command, "pending", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Pending;
            db.AddParameter(command, "scheduled", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Scheduled;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Queued;
            db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Processing;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        public async Task ProcessCycleAsync(CancellationToken cancellationToken)
        {
            if (!await _outboundGuard.IsOutboundEnabledAsync(cancellationToken))
            {
                _logger.LogWarning("WhatsApp automation dispatch paused globally; skipping claim cycle");
                return;
            }

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await RecoverExpiredLeases(db);

            var batch = Math.Clamp(_options.batch_size <= 0 ? 15 : _options.batch_size, 1, 50);
            var claimed = await ClaimExecutions(db, batch, cancellationToken);
            var delayMs = Math.Max(0, _options.send_delay_ms);

            foreach (var execId in claimed)
            {
                if (cancellationToken.IsCancellationRequested) break;
                try
                {
                    await ProcessOneExecution(db, execId, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Automation execution {ExecId} failed", execId);
                }
                if (delayMs > 0)
                {
                    try { await Task.Delay(delayMs, cancellationToken); }
                    catch (OperationCanceledException) { break; }
                }
            }
        }

        public async Task ApplyProviderStatusAsync(
            IDb db,
            long organisationId,
            long whatsappConnectionId,
            string providerMessageId,
            string mappedStatus,
            string failureReason)
        {
            if (string.IsNullOrWhiteSpace(providerMessageId)) return;

            long? execId = null;
            string? current = null;
            using (var find = db.GetCommand(@"
                SELECT e.id, e.provider_status
                FROM whatsapp_automation_executions e
                INNER JOIN whatsapp_automation_rules r ON r.id = e.automation_rule_id
                WHERE e.organisation_id = @organisation_id
                  AND r.whatsapp_connection_id = @whatsapp_connection_id
                  AND e.provider_message_id = @provider_message_id
                LIMIT 1;"))
            {
                db.AddParameter(find, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(find, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
                db.AddParameter(find, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                using var reader = await db.Execute(find);
                if (!await reader.ReadAsync()) return;
                execId = Convert.ToInt64(reader["id"]);
                current = reader["provider_status"]?.ToString() ?? "";
            }

            if (!WhatsAppMessageStatusRules.CanApply(
                    string.IsNullOrEmpty(current) ? WhatsAppMessageStatuses.Sent : current,
                    mappedStatus) &&
                !string.Equals(mappedStatus, WhatsAppMessageStatuses.Failed, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
            if (string.Equals(current, mappedStatus, StringComparison.OrdinalIgnoreCase)) return;

            var execStatus = mappedStatus switch
            {
                var s when string.Equals(s, WhatsAppMessageStatuses.Delivered, StringComparison.OrdinalIgnoreCase)
                    => WhatsAppAutomationExecutionStatuses.Delivered,
                var s when string.Equals(s, WhatsAppMessageStatuses.Read, StringComparison.OrdinalIgnoreCase)
                    => WhatsAppAutomationExecutionStatuses.Read,
                var s when string.Equals(s, WhatsAppMessageStatuses.Failed, StringComparison.OrdinalIgnoreCase)
                    => WhatsAppAutomationExecutionStatuses.Failed,
                _ => WhatsAppAutomationExecutionStatuses.Accepted,
            };

            using var upd = db.GetCommand(@"
                UPDATE whatsapp_automation_executions
                SET provider_status = @provider_status,
                    status = CASE
                        WHEN status IN (@accepted, @delivered, @read) OR @exec_status = @failed THEN @exec_status
                        WHEN status = @unknown THEN @accepted
                        ELSE status
                    END,
                    failure_reason = CASE WHEN @exec_status = @failed AND @failure <> '' THEN @failure ELSE failure_reason END,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;");
            db.AddParameter(upd, "id", DbTypes.Types.Long).Value = execId!.Value;
            db.AddParameter(upd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(upd, "provider_status", DbTypes.Types.String).Value = mappedStatus;
            db.AddParameter(upd, "exec_status", DbTypes.Types.String).Value = execStatus;
            db.AddParameter(upd, "accepted", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Accepted;
            db.AddParameter(upd, "delivered", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Delivered;
            db.AddParameter(upd, "read", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Read;
            db.AddParameter(upd, "failed", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Failed;
            db.AddParameter(upd, "unknown", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Unknown;
            db.AddParameter(upd, "failure", DbTypes.Types.String).Value = failureReason ?? "";
            db.AddParameter(upd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(upd);
        }

        private async Task InsertExecutionForRule(
            IDb db,
            WhatsAppAutomationRuleDto rule,
            WhatsAppAutomationBusinessEvent evt,
            string phone)
        {
            var occurrence = evt.occurrence_at_utc?.ToUniversalTime().ToString("yyyyMMddHHmmss") ?? "na";
            var idempotency =
                $"{evt.organisation_id}:{rule.id}:{evt.trigger_type}:{evt.business_entity_type}:{evt.business_entity_id}:{occurrence}";

            DateTime? scheduledAt = null;
            var status = WhatsAppAutomationExecutionStatuses.Pending;

            if (WhatsAppAutomationTriggers.IsReminder(rule.trigger_type))
            {
                var offset = rule.reminder_offset_minutes ?? 1440;
                if (evt.occurrence_at_utc.HasValue)
                {
                    scheduledAt = evt.occurrence_at_utc.Value.ToUniversalTime().AddMinutes(-Math.Abs(offset));
                    if (scheduledAt <= DateTime.UtcNow.AddMinutes(1))
                    {
                        // Too late for this reminder occurrence
                        return;
                    }
                    status = WhatsAppAutomationExecutionStatuses.Scheduled;
                }
            }
            else if (rule.delay_minutes > 0)
            {
                scheduledAt = DateTime.UtcNow.AddMinutes(rule.delay_minutes);
                status = WhatsAppAutomationExecutionStatuses.Scheduled;
            }

            var vars = evt.variables ?? new Dictionary<string, string>();
            var context = JsonSerializer.Serialize(new
            {
                variables = vars,
                evt.context_json,
            });

            using var command = db.GetCommand(@"
                INSERT INTO whatsapp_automation_executions (
                    organisation_id, automation_rule_id, business_event_type, business_entity_type, business_entity_id,
                    recipient_phone_normalized, recipient_display_name, idempotency_key, status, scheduled_at,
                    context_json, created_at, updated_at
                ) VALUES (
                    @organisation_id, @automation_rule_id, @business_event_type, @business_entity_type, @business_entity_id,
                    @phone, @display_name, @idempotency_key, @status, @scheduled_at,
                    @context_json, @now, @now
                )
                ON CONFLICT (organisation_id, idempotency_key) DO NOTHING;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = evt.organisation_id;
            db.AddParameter(command, "automation_rule_id", DbTypes.Types.Long).Value = rule.id;
            db.AddParameter(command, "business_event_type", DbTypes.Types.String).Value = evt.trigger_type.Trim().ToLowerInvariant();
            db.AddParameter(command, "business_entity_type", DbTypes.Types.String).Value = evt.business_entity_type ?? "";
            db.AddParameter(command, "business_entity_id", DbTypes.Types.Long).Value = evt.business_entity_id;
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = phone;
            db.AddParameter(command, "display_name", DbTypes.Types.String).Value = Truncate(evt.recipient_display_name ?? "", 200);
            db.AddParameter(command, "idempotency_key", DbTypes.Types.String).Value = Truncate(idempotency, 240);
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "scheduled_at", DbTypes.Types.DateTime).Value =
                scheduledAt.HasValue ? scheduledAt.Value : DBNull.Value;
            db.AddParameter(command, "context_json", DbTypes.Types.String).Value = context;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task RecoverExpiredLeases(IDb db)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_automation_executions
                SET status = CASE WHEN scheduled_at IS NOT NULL AND scheduled_at > @now THEN @scheduled ELSE @queued END,
                    lease_owner = '',
                    lease_until = NULL,
                    updated_at = @now
                WHERE status = @processing
                  AND (lease_until IS NULL OR lease_until < @now)
                  AND COALESCE(provider_message_id, '') = '';");
            db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Processing;
            db.AddParameter(command, "scheduled", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Scheduled;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Queued;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task<List<long>> ClaimExecutions(IDb db, int batchSize, CancellationToken cancellationToken)
        {
            var leaseSeconds = Math.Clamp(_options.lease_seconds <= 0 ? 90 : _options.lease_seconds, 30, 600);
            var maxAttempts = Math.Clamp(_options.max_attempts <= 0 ? 5 : _options.max_attempts, 1, 20);
            using var command = db.GetCommand(@"
                WITH claimable AS (
                    SELECT id
                    FROM whatsapp_automation_executions
                    WHERE (
                            status IN (@pending, @queued)
                            OR (status = @scheduled AND scheduled_at IS NOT NULL AND scheduled_at <= @now)
                            OR (status = @processing AND (lease_until IS NULL OR lease_until < @now))
                          )
                      AND COALESCE(provider_message_id, '') = ''
                      AND (next_attempt_at IS NULL OR next_attempt_at <= @now)
                      AND attempt_count < @max_attempts
                    ORDER BY COALESCE(scheduled_at, created_at) ASC, id ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT @batch_size
                )
                UPDATE whatsapp_automation_executions e
                SET status = @processing,
                    lease_owner = @owner,
                    lease_until = @lease_until,
                    updated_at = @now
                FROM claimable c
                WHERE e.id = c.id
                RETURNING e.id;");
            db.AddParameter(command, "pending", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Pending;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Queued;
            db.AddParameter(command, "scheduled", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Scheduled;
            db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Processing;
            db.AddParameter(command, "batch_size", DbTypes.Types.Integer).Value = batchSize;
            db.AddParameter(command, "max_attempts", DbTypes.Types.Integer).Value = maxAttempts;
            db.AddParameter(command, "owner", DbTypes.Types.String).Value = _workerId;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "lease_until", DbTypes.Types.DateTime).Value = DateTime.UtcNow.AddSeconds(leaseSeconds);

            var ids = new List<long>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                cancellationToken.ThrowIfCancellationRequested();
                ids.Add(Convert.ToInt64(reader["id"]));
            }
            return ids;
        }

        private async Task ProcessOneExecution(IDb db, long execId, CancellationToken cancellationToken)
        {
            var exec = await LoadExecutionInternal(db, execId);
            if (exec == null) return;
            if (!string.IsNullOrWhiteSpace(exec.provider_message_id)) return;

            var rule = await LoadRule(db, exec.organisation_id, exec.automation_rule_id);
            if (rule == null || !rule.is_enabled)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "rule_disabled", "Rule missing or disabled.", retry: false);
                return;
            }

            // Revalidate entity still active for reminders / booking lifecycle
            if (!await EntityStillEligible(db, exec))
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Cancelled,
                    WhatsAppCampaignErrorCategories.Permanent, "stale", "Entity cancelled or no longer eligible.", retry: false);
                return;
            }

            var phone = exec.recipient_phone_normalized;
            if (string.IsNullOrEmpty(phone) || phone.Length < 10)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "invalid_phone", "Invalid recipient phone.", retry: false);
                return;
            }

            var purpose = NormalizePurpose(rule.purpose);
            if (WhatsAppAutomationTriggers.IsMarketingPurposeTrigger(rule.trigger_type))
                purpose = WhatsAppConsentPurposes.Marketing;

            var consent = await GetConsentStatus(db, exec.organisation_id, phone, purpose);
            if (consent == WhatsAppConsentStatuses.OptedOut)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "opted_out", "Recipient opted out.", retry: false);
                return;
            }
            if (purpose == WhatsAppConsentPurposes.Marketing && consent != WhatsAppConsentStatuses.OptedIn)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "missing_consent", "Marketing consent required.", retry: false);
                return;
            }

            WhatsAppTemplateDto template;
            try
            {
                template = await EnsureApprovedTemplate(db, exec.organisation_id, rule.whatsapp_connection_id, rule.message_template_id);
            }
            catch (Exception ex)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "template_unapproved", Truncate(ex.Message, 400), retry: false);
                return;
            }

            var connection = await LoadConnection(db, rule.whatsapp_connection_id, exec.organisation_id);
            if (connection == null || !connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token))
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "connection_inactive",
                    "WhatsApp connection is not active.", retry: false);
                return;
            }

            var vars = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            await LoadAndMergeVariables(db, exec, rule, vars);
            var (headerParams, bodyParams, unresolved) = BuildTemplateParameters(template.components_json, vars, rule.variable_mapping);
            if (unresolved.Count > 0)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "variables_unresolved",
                    "Missing variables: " + string.Join(", ", unresolved), retry: false);
                return;
            }

            var preview = BuildBodyPreview(template.components_json, vars);
            var conversationId = await UpsertConversation(
                db, exec.organisation_id, rule.whatsapp_connection_id, phone, exec.recipient_display_name, preview);
            var messageId = await InsertMessage(
                db, exec.organisation_id, rule.whatsapp_connection_id, conversationId, preview);

            WhatsAppCloudSendResult send;
            try
            {
                send = await _cloudApi.SendTemplateAsync(
                    connection.phone_number_id,
                    connection.access_token,
                    phone,
                    template.template_name,
                    template.language_code,
                    bodyParams,
                    headerParams,
                    cancellationToken);
            }
            catch (OperationCanceledException)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Unknown,
                    WhatsAppCampaignErrorCategories.Unknown, "cancelled",
                    "Worker cancelled during send — outcome uncertain.", retry: false, messageId: messageId);
                throw;
            }

            if (send.success && !string.IsNullOrWhiteSpace(send.provider_message_id))
            {
                await PersistAccepted(db, exec, messageId, send.provider_message_id);
                return;
            }

            if (send.outcome_uncertain)
            {
                await MarkExecution(db, exec, WhatsAppAutomationExecutionStatuses.Unknown,
                    WhatsAppCampaignErrorCategories.Unknown, send.error_code,
                    string.IsNullOrWhiteSpace(send.error) ? "Uncertain provider outcome." : Truncate(send.error, 400),
                    retry: false, messageId: messageId);
                return;
            }

            var category = send.is_rate_limited
                ? WhatsAppCampaignErrorCategories.RateLimit
                : send.is_transient
                    ? WhatsAppCampaignErrorCategories.Transient
                    : WhatsAppCampaignErrorCategories.Permanent;
            var canRetry = category is WhatsAppCampaignErrorCategories.Transient or WhatsAppCampaignErrorCategories.RateLimit;
            await MarkExecution(db, exec,
                canRetry ? WhatsAppAutomationExecutionStatuses.Queued : WhatsAppAutomationExecutionStatuses.Failed,
                category, send.error_code,
                string.IsNullOrWhiteSpace(send.error) ? "Provider rejected send." : Truncate(send.error, 400),
                retry: canRetry, messageId: messageId, rateLimit: send.is_rate_limited);
        }

        private async Task PersistAccepted(IDb db, WhatsAppAutomationExecutionDto exec, long messageId, string providerMessageId)
        {
            var now = DateTime.UtcNow;
            using (var updMsg = db.GetCommand(@"
                UPDATE whatsapp_messages
                SET status = @status, provider_message_id = @provider_message_id, updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(updMsg, "id", DbTypes.Types.Long).Value = messageId;
                db.AddParameter(updMsg, "organisation_id", DbTypes.Types.Long).Value = exec.organisation_id;
                db.AddParameter(updMsg, "status", DbTypes.Types.String).Value = WhatsAppMessageStatuses.Sent;
                db.AddParameter(updMsg, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                db.AddParameter(updMsg, "now", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(updMsg);
            }

            using var upd = db.GetCommand(@"
                UPDATE whatsapp_automation_executions
                SET status = @accepted,
                    provider_status = @sent,
                    provider_message_id = @provider_message_id,
                    whatsapp_message_id = @message_id,
                    processed_at = @now,
                    lease_owner = '',
                    lease_until = NULL,
                    failure_category = '',
                    failure_reason = '',
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id
                  AND COALESCE(provider_message_id, '') = '';");
            db.AddParameter(upd, "id", DbTypes.Types.Long).Value = exec.id;
            db.AddParameter(upd, "organisation_id", DbTypes.Types.Long).Value = exec.organisation_id;
            db.AddParameter(upd, "accepted", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Accepted;
            db.AddParameter(upd, "sent", DbTypes.Types.String).Value = WhatsAppMessageStatuses.Sent;
            db.AddParameter(upd, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
            db.AddParameter(upd, "message_id", DbTypes.Types.Long).Value = messageId;
            db.AddParameter(upd, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(upd);
        }

        private async Task MarkExecution(
            IDb db,
            WhatsAppAutomationExecutionDto exec,
            string status,
            string category,
            string code,
            string reason,
            bool retry,
            long? messageId = null,
            bool rateLimit = false)
        {
            var attempt = exec.attempt_count + 1;
            var maxAttempts = Math.Clamp(_options.max_attempts <= 0 ? 5 : _options.max_attempts, 1, 20);
            DateTime? nextAttempt = null;
            if (retry && attempt < maxAttempts)
            {
                var baseSeconds = rateLimit ? 60 : Math.Min(300, (int)Math.Pow(2, Math.Min(attempt, 6)) * 5);
                nextAttempt = DateTime.UtcNow.AddSeconds(baseSeconds + Random.Shared.Next(0, 15));
                status = WhatsAppAutomationExecutionStatuses.Queued;
            }
            else if (retry)
            {
                status = WhatsAppAutomationExecutionStatuses.Failed;
            }

            using var command = db.GetCommand(@"
                UPDATE whatsapp_automation_executions
                SET status = @status,
                    attempt_count = @attempt_count,
                    next_attempt_at = @next_attempt_at,
                    lease_owner = '',
                    lease_until = NULL,
                    whatsapp_message_id = COALESCE(@message_id, whatsapp_message_id),
                    failure_category = @failure_category,
                    failure_reason = @failure_reason,
                    processed_at = CASE WHEN @status IN (@failed, @skipped, @cancelled, @unknown) THEN @now ELSE processed_at END,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = exec.id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = exec.organisation_id;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "attempt_count", DbTypes.Types.Integer).Value = attempt;
            db.AddParameter(command, "next_attempt_at", DbTypes.Types.DateTime).Value =
                nextAttempt.HasValue ? nextAttempt.Value : DBNull.Value;
            db.AddParameter(command, "message_id", DbTypes.Types.Long).Value =
                messageId.HasValue ? messageId.Value : DBNull.Value;
            db.AddParameter(command, "failure_category", DbTypes.Types.String).Value = category;
            db.AddParameter(command, "failure_reason", DbTypes.Types.String).Value = Truncate($"{code}: {reason}", 400);
            db.AddParameter(command, "failed", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Failed;
            db.AddParameter(command, "skipped", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Skipped;
            db.AddParameter(command, "cancelled", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Cancelled;
            db.AddParameter(command, "unknown", DbTypes.Types.String).Value = WhatsAppAutomationExecutionStatuses.Unknown;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task<bool> EntityStillEligible(IDb db, WhatsAppAutomationExecutionDto exec)
        {
            if (exec.business_entity_id <= 0) return true;
            if (string.Equals(exec.business_entity_type, WhatsAppAutomationEntityTypes.Appointment, StringComparison.OrdinalIgnoreCase))
            {
                using var command = db.GetCommand(@"
                    SELECT statuscode, isactive, issuspended, isusercancel
                    FROM Appoinment
                    WHERE id = @id AND organisationid = @organisation_id
                    LIMIT 1;");
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = exec.business_entity_id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = exec.organisation_id;
                using var reader = await db.Execute(command);
                if (!await reader.ReadAsync()) return false;
                var status = (reader["statuscode"]?.ToString() ?? "").Trim().ToUpperInvariant();
                var cancelled = reader["isusercancel"] != DBNull.Value && Convert.ToBoolean(reader["isusercancel"]);
                var inactive = reader["isactive"] != DBNull.Value && !Convert.ToBoolean(reader["isactive"]);
                if (cancelled || inactive) return false;
                if (status is "CANCELLED" or "CANCELED" or "NOSHOW") return false;
                if (string.Equals(exec.business_event_type, WhatsAppAutomationTriggers.BookingReminder, StringComparison.OrdinalIgnoreCase)
                    && status == "COMPLETED")
                {
                    return false;
                }
                return true;
            }

            if (string.Equals(exec.business_entity_type, WhatsAppAutomationEntityTypes.EventBooking, StringComparison.OrdinalIgnoreCase))
            {
                using var command = db.GetCommand(@"
                    SELECT eb.isactive, eb.check_in_status, eb.payment_status, e.isactive AS event_active
                    FROM event_bookings eb
                    LEFT JOIN events e ON e.id = eb.event_id
                    WHERE eb.id = @id
                    LIMIT 1;");
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = exec.business_entity_id;
                try
                {
                    using var reader = await db.Execute(command);
                    if (!await reader.ReadAsync()) return false;
                    var active = reader["isactive"] == DBNull.Value || Convert.ToBoolean(reader["isactive"]);
                    var checkIn = (reader["check_in_status"]?.ToString() ?? "").ToLowerInvariant();
                    var pay = (reader["payment_status"]?.ToString() ?? "").ToLowerInvariant();
                    var eventActive = reader["event_active"] == DBNull.Value || Convert.ToBoolean(reader["event_active"]);
                    if (!active || !eventActive) return false;
                    if (checkIn is "cancelled" or "canceled") return false;
                    if (pay == "refunded") return false;
                    return true;
                }
                catch
                {
                    // Schema variance — allow send rather than hard-fail all event automations
                    return true;
                }
            }

            return true;
        }

        private Dictionary<string, string> ExtractVariablesFromContext(string contextJson)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(contextJson) ? "{}" : contextJson);
                if (doc.RootElement.TryGetProperty("variables", out var vars) && vars.ValueKind == JsonValueKind.Object)
                {
                    foreach (var p in vars.EnumerateObject())
                    {
                        var name = p.Name;
                        var value = p.Value.GetString() ?? "";
                        dict[name] = value;
                        dict[NormalizePlaceholder(name)] = value;
                    }
                }
            }
            catch { /* ignore */ }
            return dict;
        }

        private async Task LoadAndMergeVariables(
            IDb db, WhatsAppAutomationExecutionDto exec, WhatsAppAutomationRuleDto rule, Dictionary<string, string> target)
        {
            string contextJson = "{}";
            using (var command = db.GetCommand(@"
                SELECT context_json FROM whatsapp_automation_executions WHERE id = @id LIMIT 1;"))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = exec.id;
                using var reader = await db.Execute(command);
                if (await reader.ReadAsync())
                    contextJson = reader["context_json"]?.ToString() ?? "{}";
            }

            foreach (var kv in ExtractVariablesFromContext(contextJson))
                target[kv.Key] = kv.Value;

            if (!target.ContainsKey("customer_name") && !string.IsNullOrEmpty(exec.recipient_display_name))
                target["customer_name"] = exec.recipient_display_name;
            if (!target.ContainsKey("phone"))
                target["phone"] = exec.recipient_phone_normalized;

            var mappings = DeserializeMappings(rule.variable_mapping);
            foreach (var m in mappings)
            {
                var key = NormalizePlaceholder(m.placeholder);
                if (target.TryGetValue(key, out var existing) && !string.IsNullOrWhiteSpace(existing)) continue;
                if (string.Equals(m.source_type, "fixed", StringComparison.OrdinalIgnoreCase))
                    target[key] = m.fixed_value ?? "";
                else
                {
                    var sourceKey = (m.source_key ?? "").ToLowerInvariant();
                    if (target.TryGetValue(sourceKey, out var v) && !string.IsNullOrWhiteSpace(v))
                        target[key] = v;
                    else if (!string.IsNullOrWhiteSpace(m.fallback_value))
                        target[key] = m.fallback_value;
                }
            }
        }

        private async Task<List<WhatsAppAutomationRuleDto>> LoadEnabledRules(IDb db, long organisationId, string triggerType)
        {
            var list = new List<WhatsAppAutomationRuleDto>();
            using var command = db.GetCommand(@"
                SELECT r.*, t.template_name, t.status AS template_status, wc.business_phone
                FROM whatsapp_automation_rules r
                LEFT JOIN message_templates t ON t.id = r.message_template_id
                LEFT JOIN whatsapp_connections wc ON wc.id = r.whatsapp_connection_id
                WHERE r.organisation_id = @organisation_id
                  AND r.trigger_type = @trigger_type
                  AND r.is_enabled = TRUE;");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "trigger_type", DbTypes.Types.String).Value = triggerType;
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync()) list.Add(ReadRule(reader));
            return list;
        }

        private async Task<WhatsAppAutomationRuleDto?> LoadRule(IDb db, long organisationId, long id)
        {
            using var command = db.GetCommand(@"
                SELECT r.*, t.template_name, t.status AS template_status, wc.business_phone
                FROM whatsapp_automation_rules r
                LEFT JOIN message_templates t ON t.id = r.message_template_id
                LEFT JOIN whatsapp_connections wc ON wc.id = r.whatsapp_connection_id
                WHERE r.id = @id AND r.organisation_id = @organisation_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadRule(reader);
        }

        private async Task<WhatsAppAutomationExecutionDto?> LoadExecutionInternal(IDb db, long id)
        {
            using var command = db.GetCommand(@"
                SELECT e.*, '' AS rule_name
                FROM whatsapp_automation_executions e
                WHERE e.id = @id LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadExecution(reader);
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
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = connectionId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
                throw new Exception("WhatsApp connection not found for this organisation.");
        }

        private async Task<WhatsAppTemplateDto> EnsureApprovedTemplate(
            IDb db, long organisationId, long connectionId, long templateId)
        {
            using var command = db.GetCommand(@"
                SELECT id, organisation_id, whatsapp_connection_id, template_name, language_code, category,
                       components_json, provider_template_id, status, provider_status, content
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
            if (!await reader.ReadAsync()) throw new Exception("Template not found for this organisation and connection.");
            var status = reader["status"]?.ToString() ?? "";
            if (!string.Equals(status, WhatsAppTemplateStatuses.Approved, StringComparison.OrdinalIgnoreCase))
                throw new Exception($"Template is not approved (status: {status}).");

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

        private async Task<WhatsAppOrgConnectionContext?> LoadConnection(IDb db, long connectionId, long organisationId)
        {
            using var command = db.GetCommand(@"
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
                LIMIT 1;");
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = connectionId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.AccessToken;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;

            var encrypted = reader["encrypted_value"] == DBNull.Value ? "" : reader["encrypted_value"].ToString() ?? "";
            var token = "";
            if (!string.IsNullOrEmpty(encrypted))
            {
                try { token = _secretProtector.Decrypt(encrypted); }
                catch (Exception ex) { _logger.LogError(ex, "Failed to decrypt WhatsApp token for automation"); }
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

        private async Task<string> GetConsentStatus(IDb db, long organisationId, string phone, string purpose)
        {
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

        private async Task<long> UpsertConversation(
            IDb db, long organisationId, long connectionId, string waId, string name, string preview)
        {
            using var command = db.GetCommand(@"
                INSERT INTO whatsapp_conversations (
                    organisation_id, whatsapp_connection_id, customer_wa_id, customer_name,
                    status, last_message_at, last_message_preview, unread_count, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @customer_wa_id, @customer_name,
                    'open', @now, @preview, 0, @now, @now
                )
                ON CONFLICT (whatsapp_connection_id, customer_wa_id) DO UPDATE SET
                    customer_name = CASE WHEN EXCLUDED.customer_name = '' THEN whatsapp_conversations.customer_name ELSE EXCLUDED.customer_name END,
                    last_message_at = EXCLUDED.last_message_at,
                    last_message_preview = EXCLUDED.last_message_preview,
                    updated_at = EXCLUDED.updated_at
                RETURNING id;");
            var now = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = connectionId;
            db.AddParameter(command, "customer_wa_id", DbTypes.Types.String).Value = WhatsAppCloudApiClient.NormalizeWaId(waId);
            db.AddParameter(command, "customer_name", DbTypes.Types.String).Value = name ?? "";
            db.AddParameter(command, "preview", DbTypes.Types.String).Value = Truncate(preview, 240);
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            using var reader = await db.Execute(command);
            if (await reader.ReadAsync()) return Convert.ToInt64(reader["id"]);
            throw new Exception("Failed to upsert conversation.");
        }

        private async Task<long> InsertMessage(
            IDb db, long organisationId, long connectionId, long conversationId, string preview)
        {
            using var command = db.GetCommand(@"
                INSERT INTO whatsapp_messages (
                    organisation_id, whatsapp_connection_id, conversation_id, provider_message_id,
                    direction, message_type, text_content, media_id, status, failure_reason,
                    provider_timestamp, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @conversation_id, '',
                    @direction, 'template', @text_content, '', @status, '',
                    @now, @now, @now
                ) RETURNING id;");
            var now = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = connectionId;
            db.AddParameter(command, "conversation_id", DbTypes.Types.Long).Value = conversationId;
            db.AddParameter(command, "direction", DbTypes.Types.String).Value = WhatsAppMessageDirections.Outbound;
            db.AddParameter(command, "text_content", DbTypes.Types.String).Value = Truncate(preview, 2000);
            db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppMessageStatuses.Queued;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            using var reader = await db.Execute(command);
            if (await reader.ReadAsync()) return Convert.ToInt64(reader["id"]);
            throw new Exception("Failed to insert automation message.");
        }

        private static (List<string> header, List<string> body, List<string> unresolved) BuildTemplateParameters(
            string componentsJson,
            Dictionary<string, string> vars,
            string mappingJson)
        {
            var headerText = "";
            var bodyText = "";
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(componentsJson) ? "[]" : componentsJson);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var c in doc.RootElement.EnumerateArray())
                    {
                        var type = c.TryGetProperty("type", out var t) ? t.GetString()?.ToUpperInvariant() : "";
                        var text = c.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                        if (type == "HEADER") headerText = text;
                        if (type == "BODY") bodyText = text;
                    }
                }
            }
            catch { /* ignore */ }

            List<string> OrderedParams(string text)
            {
                var list = new List<string>();
                foreach (Match m in PlaceholderRegex.Matches(text ?? ""))
                {
                    var key = "{{" + m.Groups[1].Value + "}}";
                    vars.TryGetValue(key, out var value);
                    if (string.IsNullOrEmpty(value))
                        vars.TryGetValue(m.Groups[1].Value, out value);
                    list.Add(value ?? "");
                }
                return list;
            }

            var mappings = DeserializeMappings(mappingJson);
            var unresolved = new List<string>();
            foreach (Match m in PlaceholderRegex.Matches(bodyText + " " + headerText))
            {
                var key = "{{" + m.Groups[1].Value + "}}";
                var map = mappings.FirstOrDefault(x =>
                    string.Equals(NormalizePlaceholder(x.placeholder), key, StringComparison.OrdinalIgnoreCase));
                vars.TryGetValue(key, out var value);
                if (string.IsNullOrWhiteSpace(value) && (map == null || !map.allow_empty))
                {
                    if (!unresolved.Contains(key)) unresolved.Add(key);
                }
            }

            return (OrderedParams(headerText), OrderedParams(bodyText), unresolved);
        }

        private static string BuildBodyPreview(string componentsJson, Dictionary<string, string> vars)
        {
            var body = "";
            try
            {
                using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(componentsJson) ? "[]" : componentsJson);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var c in doc.RootElement.EnumerateArray())
                    {
                        var type = c.TryGetProperty("type", out var t) ? t.GetString()?.ToUpperInvariant() : "";
                        if (type == "BODY")
                            body = c.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                    }
                }
            }
            catch { /* ignore */ }

            return PlaceholderRegex.Replace(body ?? "", m =>
            {
                var key = "{{" + m.Groups[1].Value + "}}";
                return vars.TryGetValue(key, out var v) && !string.IsNullOrEmpty(v) ? v : m.Value;
            });
        }

        private static void BindExecParams(IDb db, System.Data.Common.DbCommand command, long orgId, WhatsAppAutomationExecutionSelectReq req)
        {
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            if (req.automation_rule_id is > 0)
                db.AddParameter(command, "automation_rule_id", DbTypes.Types.Long).Value = req.automation_rule_id.Value;
            if (!string.IsNullOrWhiteSpace(req.status))
                db.AddParameter(command, "status", DbTypes.Types.String).Value = req.status.Trim();
            if (!string.IsNullOrWhiteSpace(req.search))
                db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + req.search.Trim() + "%";
        }

        private static void ValidateRuleUpsert(WhatsAppAutomationRuleUpsertReq req)
        {
            if (string.IsNullOrWhiteSpace(req.name)) throw new Exception("Rule name is required.");
            if (req.whatsapp_connection_id <= 0) throw new Exception("WhatsApp connection is required.");
            if (req.message_template_id <= 0) throw new Exception("Approved template is required.");
            var trigger = (req.trigger_type ?? "").Trim().ToLowerInvariant();
            if (!WhatsAppAutomationTriggers.All.Contains(trigger))
                throw new Exception($"Unsupported trigger type '{req.trigger_type}'.");
            if (WhatsAppAutomationTriggers.IsReminder(trigger) &&
                (req.reminder_offset_minutes is null or <= 0))
            {
                req.reminder_offset_minutes = 1440;
            }
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

        private static WhatsAppAutomationRuleDto ReadRule(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            name = reader["name"]?.ToString() ?? "",
            trigger_type = reader["trigger_type"]?.ToString() ?? "",
            whatsapp_connection_id = Convert.ToInt64(reader["whatsapp_connection_id"]),
            message_template_id = Convert.ToInt64(reader["message_template_id"]),
            is_enabled = reader["is_enabled"] != DBNull.Value && Convert.ToBoolean(reader["is_enabled"]),
            purpose = reader["purpose"]?.ToString() ?? WhatsAppConsentPurposes.Utility,
            delay_minutes = reader["delay_minutes"] == DBNull.Value ? 0 : Convert.ToInt32(reader["delay_minutes"]),
            reminder_offset_minutes = reader["reminder_offset_minutes"] == DBNull.Value ? null : Convert.ToInt32(reader["reminder_offset_minutes"]),
            timezone = reader["timezone"]?.ToString() ?? "UTC",
            conditions_json = reader["conditions_json"]?.ToString() ?? "{}",
            variable_mapping = reader["variable_mapping"]?.ToString() ?? "[]",
            version = reader["version"] == DBNull.Value ? 1 : Convert.ToInt32(reader["version"]),
            created_by = reader["created_by"] == DBNull.Value ? null : Convert.ToInt64(reader["created_by"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
            template_name = HasColumn(reader, "template_name") ? reader["template_name"]?.ToString() ?? "" : "",
            template_status = HasColumn(reader, "template_status") ? reader["template_status"]?.ToString() ?? "" : "",
            business_phone = HasColumn(reader, "business_phone") ? reader["business_phone"]?.ToString() ?? "" : "",
        };

        private static WhatsAppAutomationExecutionDto ReadExecution(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            automation_rule_id = Convert.ToInt64(reader["automation_rule_id"]),
            rule_name = HasColumn(reader, "rule_name") ? reader["rule_name"]?.ToString() ?? "" : "",
            business_event_type = reader["business_event_type"]?.ToString() ?? "",
            business_entity_type = reader["business_entity_type"]?.ToString() ?? "",
            business_entity_id = reader["business_entity_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["business_entity_id"]),
            recipient_phone_normalized = reader["recipient_phone_normalized"]?.ToString() ?? "",
            recipient_display_name = reader["recipient_display_name"]?.ToString() ?? "",
            idempotency_key = reader["idempotency_key"]?.ToString() ?? "",
            status = reader["status"]?.ToString() ?? "",
            scheduled_at = reader["scheduled_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["scheduled_at"]),
            processed_at = reader["processed_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["processed_at"]),
            attempt_count = reader["attempt_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["attempt_count"]),
            provider_message_id = reader["provider_message_id"]?.ToString() ?? "",
            provider_status = reader["provider_status"]?.ToString() ?? "",
            failure_category = reader["failure_category"]?.ToString() ?? "",
            failure_reason = reader["failure_reason"]?.ToString() ?? "",
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        private static bool HasColumn(DbDataReader reader, string name)
        {
            for (var i = 0; i < reader.FieldCount; i++)
                if (string.Equals(reader.GetName(i), name, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        private static string NormalizePlaceholder(string? ph)
        {
            ph = (ph ?? "").Trim();
            if (PlaceholderRegex.IsMatch(ph)) return ph;
            if (int.TryParse(ph, out var n)) return "{{" + n + "}}";
            return ph;
        }

        private static string NormalizePurpose(string? purpose)
        {
            purpose = (purpose ?? "").Trim().ToLowerInvariant();
            return purpose switch
            {
                "marketing" => WhatsAppConsentPurposes.Marketing,
                "transactional" => WhatsAppConsentPurposes.Transactional,
                _ => WhatsAppConsentPurposes.Utility,
            };
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

        private static string BuildWorkerId(string role)
        {
            var id = $"{Environment.MachineName}:{role}:{Guid.NewGuid():N}";
            return id.Length <= 100 ? id : id[..100];
        }

        private static string Truncate(string value, int max) =>
            string.IsNullOrEmpty(value) ? "" : value.Length <= max ? value : value[..max];

        private static bool IsUniqueViolation(Exception ex)
        {
            var msg = ex.Message ?? "";
            return msg.Contains("uq_wa_auto_exec_idempotency", StringComparison.OrdinalIgnoreCase) ||
                   msg.Contains("unique", StringComparison.OrdinalIgnoreCase) ||
                   msg.Contains("duplicate key", StringComparison.OrdinalIgnoreCase);
        }

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
    }
}
