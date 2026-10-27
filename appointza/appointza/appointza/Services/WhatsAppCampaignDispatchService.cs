using System.Data.Common;
using System.Text.Json;
using System.Text.RegularExpressions;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    /// <summary>
    /// Phase 6 durable campaign queue, recipient claiming, template dispatch, pause/cancel, reporting.
    /// </summary>
    public class WhatsAppCampaignDispatchService
    {
        private static readonly Regex PlaceholderRegex = new(@"\{\{(\d+)\}\}", RegexOptions.Compiled);
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly WhatsAppCloudApiClient _cloudApi;
        private readonly SecretProtector _secretProtector;
        private readonly WhatsAppOutboundGuard _outboundGuard;
        private readonly WhatsAppCampaignWorkerOptions _options;
        private readonly ILogger<WhatsAppCampaignDispatchService> _logger;
        private readonly string _workerId = BuildWorkerId("campaign");

        public WhatsAppCampaignDispatchService(
            IDbProvider dbProvider,
            RequestState requestState,
            WhatsAppCloudApiClient cloudApi,
            SecretProtector secretProtector,
            WhatsAppOutboundGuard outboundGuard,
            Microsoft.Extensions.Options.IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppCampaignDispatchService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _cloudApi = cloudApi;
            _secretProtector = secretProtector;
            _outboundGuard = outboundGuard;
            _options = settings.Value.whatsapp?.campaign_worker ?? new WhatsAppCampaignWorkerOptions();
            _logger = logger;
        }

        public string WorkerId => _workerId;

        public async Task<WhatsAppCampaignDto> QueueForDispatch(long id, int? expectedVersion = null)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();

            var campaign = await LoadCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.IsDispatchable(campaign.status) &&
                !string.Equals(campaign.status, WhatsAppCampaignStatuses.Ready, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(campaign.status, WhatsAppCampaignStatuses.Scheduled, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception($"Campaign cannot be queued from status '{campaign.status}'.");
            }
            if (campaign.eligible_count <= 0) throw new Exception("Campaign has no eligible recipients.");
            if (campaign.message_template_id is not > 0) throw new Exception("Approved template is required.");

            await EnsureApprovedTemplate(db, orgId, campaign.whatsapp_connection_id, campaign.message_template_id.Value);
            var connection = await LoadConnection(db, campaign.whatsapp_connection_id, orgId);
            if (connection == null || !connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token))
            {
                throw new Exception("WhatsApp connection is not active for this organisation.");
            }

            var expected = expectedVersion ?? campaign.version;
            using (var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @queued,
                    started_at = COALESCE(started_at, @now),
                    version = version + 1,
                    updated_at = @now,
                    dispatch_lease_owner = '',
                    dispatch_lease_until = NULL
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version
                  AND status IN (@ready, @scheduled, @queued);"))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
                db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
                db.AddParameter(command, "ready", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Ready;
                db.AddParameter(command, "scheduled", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Scheduled;
                db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(command);
            }

            await PromoteEligibleRecipients(db, orgId, id);

            var updated = await LoadCampaign(db, orgId, id);
            if (updated == null || updated.status != WhatsAppCampaignStatuses.Queued)
            {
                throw new Exception("Could not queue campaign (concurrency or invalid state).");
            }

            _logger.LogInformation("WhatsApp campaign {CampaignId} queued for dispatch (org {OrgId})", id, orgId);
            return updated;
        }

        public async Task<WhatsAppCampaignDto> Pause(long id, int? expectedVersion = null)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var campaign = await LoadCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.CanTransition(campaign.status, WhatsAppCampaignStatuses.Paused))
            {
                throw new Exception($"Cannot pause campaign in status '{campaign.status}'.");
            }

            var expected = expectedVersion ?? campaign.version;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @paused,
                    paused_at = @now,
                    version = version + 1,
                    updated_at = @now,
                    dispatch_lease_owner = '',
                    dispatch_lease_until = NULL
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version
                  AND status IN (@queued, @dispatching);");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "paused", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Paused;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(command, "dispatching", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Dispatching;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);

            return (await LoadCampaign(db, orgId, id))
                   ?? throw new Exception("Could not pause campaign.");
        }

        public async Task<WhatsAppCampaignDto> Resume(long id, int? expectedVersion = null)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var campaign = await LoadCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");
            if (!WhatsAppCampaignStateMachine.CanTransition(campaign.status, WhatsAppCampaignStatuses.Queued))
            {
                throw new Exception($"Cannot resume campaign in status '{campaign.status}'.");
            }

            var expected = expectedVersion ?? campaign.version;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @queued,
                    paused_at = NULL,
                    version = version + 1,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version
                  AND status = @paused;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(command, "paused", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Paused;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);

            return (await LoadCampaign(db, orgId, id))
                   ?? throw new Exception("Could not resume campaign.");
        }

        public async Task<WhatsAppCampaignDto> Cancel(long id, int? expectedVersion = null)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var campaign = await LoadCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");

            var from = campaign.status;
            var expected = expectedVersion ?? campaign.version;
            var now = DateTime.UtcNow;

            if (WhatsAppCampaignStateMachine.IsActiveDispatch(from) ||
                string.Equals(from, WhatsAppCampaignStatuses.Paused, StringComparison.OrdinalIgnoreCase))
            {
                if (!WhatsAppCampaignStateMachine.CanTransition(from, WhatsAppCampaignStatuses.Cancelling) &&
                    !WhatsAppCampaignStateMachine.CanTransition(from, WhatsAppCampaignStatuses.Cancelled))
                {
                    throw new Exception($"Cannot cancel campaign in status '{from}'.");
                }

                using (var command = db.GetCommand(@"
                    UPDATE whatsapp_campaigns
                    SET status = @cancelling,
                        version = version + 1,
                        updated_at = @now,
                        dispatch_lease_owner = '',
                        dispatch_lease_until = NULL
                    WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version
                      AND status IN (@queued, @dispatching, @paused);"))
                {
                    db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                    db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                    db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
                    db.AddParameter(command, "cancelling", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelling;
                    db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
                    db.AddParameter(command, "dispatching", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Dispatching;
                    db.AddParameter(command, "paused", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Paused;
                    db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
                    await db.ExecuteNonQuery(command);
                }

                await CancelUndispatchedRecipients(db, orgId, id);
                await FinalizeCancellingIfIdle(db, orgId, id);
            }
            else
            {
                if (!WhatsAppCampaignStateMachine.CanTransition(from, WhatsAppCampaignStatuses.Cancelled))
                {
                    throw new Exception($"Cannot cancel campaign in status '{from}'.");
                }

                using (var command = db.GetCommand(@"
                    UPDATE whatsapp_campaigns
                    SET status = @cancelled,
                        scheduled_at = NULL,
                        completed_at = @now,
                        version = version + 1,
                        updated_at = @now
                    WHERE id = @id AND organisation_id = @organisation_id AND version = @expected_version;"))
                {
                    db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                    db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                    db.AddParameter(command, "expected_version", DbTypes.Types.Integer).Value = expected;
                    db.AddParameter(command, "cancelled", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelled;
                    db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
                    await db.ExecuteNonQuery(command);
                }

                await CancelUndispatchedRecipients(db, orgId, id);
            }

            return (await LoadCampaign(db, orgId, id))
                   ?? throw new Exception("Could not cancel campaign.");
        }

        public async Task<WhatsAppCampaignReportDto> GetReport(long id)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var campaign = await LoadCampaign(db, orgId, id) ?? throw new Exception("Campaign not found.");

            var report = new WhatsAppCampaignReportDto { campaign = campaign };
            using (var command = db.GetCommand(@"
                SELECT processing_status, COUNT(*)::int AS cnt
                FROM whatsapp_campaign_recipients
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id
                GROUP BY processing_status;"))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = id;
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    report.processing_status_counts[reader["processing_status"]?.ToString() ?? ""] =
                        Convert.ToInt32(reader["cnt"]);
                }
            }

            using (var command = db.GetCommand(@"
                SELECT COALESCE(NULLIF(provider_status, ''), '(none)') AS provider_status, COUNT(*)::int AS cnt
                FROM whatsapp_campaign_recipients
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id
                GROUP BY 1;"))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = id;
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    report.provider_status_counts[reader["provider_status"]?.ToString() ?? ""] =
                        Convert.ToInt32(reader["cnt"]);
                }
            }

            using (var command = db.GetCommand(@"
                SELECT exclusion_reason, COUNT(*)::int AS cnt
                FROM whatsapp_campaign_recipients
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id
                  AND eligibility_status = 'excluded'
                  AND COALESCE(exclusion_reason, '') <> ''
                GROUP BY exclusion_reason;"))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = id;
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    report.exclusion_reasons[reader["exclusion_reason"]?.ToString() ?? ""] =
                        Convert.ToInt32(reader["cnt"]);
                }
            }

            return report;
        }

        public async Task<(List<WhatsAppCampaignRecipientDto> items, int total)> ListRecipients(
            WhatsAppCampaignRecipientSelectReq req)
        {
            var orgId = RequireOrg();
            var limit = req.limit <= 0 ? 50 : Math.Min(req.limit, 200);
            var offset = Math.Max(0, req.offset);
            var status = (req.processing_status ?? "").Trim();
            var search = (req.search ?? "").Trim();

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            _ = await LoadCampaign(db, orgId, req.campaign_id) ?? throw new Exception("Campaign not found.");

            var where = @"
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id";
            if (!string.IsNullOrEmpty(status)) where += " AND processing_status = @processing_status";
            if (!string.IsNullOrEmpty(search))
                where += " AND (display_name ILIKE @search OR phone_normalized ILIKE @search)";

            int total;
            using (var countCmd = db.GetCommand($"SELECT COUNT(*)::int AS cnt FROM whatsapp_campaign_recipients {where};"))
            {
                db.AddParameter(countCmd, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(countCmd, "campaign_id", DbTypes.Types.Long).Value = req.campaign_id;
                if (!string.IsNullOrEmpty(status))
                    db.AddParameter(countCmd, "processing_status", DbTypes.Types.String).Value = status;
                if (!string.IsNullOrEmpty(search))
                    db.AddParameter(countCmd, "search", DbTypes.Types.String).Value = "%" + search + "%";
                using var reader = await db.Execute(countCmd);
                await reader.ReadAsync();
                total = Convert.ToInt32(reader["cnt"]);
            }

            var list = new List<WhatsAppCampaignRecipientDto>();
            using (var command = db.GetCommand($@"
                SELECT id, campaign_id, source_type, display_name, phone_normalized, eligibility_status, exclusion_reason,
                       processing_status, provider_status, provider_message_id, attempt_count,
                       error_category, error_code, error_message,
                       accepted_at, delivered_at, read_at, failed_at, last_attempt_at, next_attempt_at
                FROM whatsapp_campaign_recipients
                {where}
                ORDER BY id ASC
                LIMIT @limit OFFSET @offset;"))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = req.campaign_id;
                db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;
                db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = offset;
                if (!string.IsNullOrEmpty(status))
                    db.AddParameter(command, "processing_status", DbTypes.Types.String).Value = status;
                if (!string.IsNullOrEmpty(search))
                    db.AddParameter(command, "search", DbTypes.Types.String).Value = "%" + search + "%";
                using var reader = await db.Execute(command);
                while (await reader.ReadAsync())
                {
                    var item = ReadRecipient(reader);
                    item.phone_normalized = MaskPhoneForApi(item.phone_normalized);
                    list.Add(item);
                }
            }

            return (list, total);
        }

        public async Task<WhatsAppCampaignRecipientDto> RetryRecipient(long campaignId, long recipientId)
        {
            var orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            var campaign = await LoadCampaign(db, orgId, campaignId) ?? throw new Exception("Campaign not found.");
            if (WhatsAppCampaignStateMachine.IsTerminal(campaign.status) &&
                !string.Equals(campaign.status, WhatsAppCampaignStatuses.CompletedWithErrors, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(campaign.status, WhatsAppCampaignStatuses.Failed, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("Campaign is not eligible for recipient recovery.");
            }

            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @queued,
                    next_attempt_at = NULL,
                    error_category = '',
                    error_code = '',
                    error_message = '',
                    lease_owner = '',
                    lease_until = NULL,
                    updated_at = @now
                WHERE id = @id
                  AND campaign_id = @campaign_id
                  AND organisation_id = @organisation_id
                  AND processing_status IN (@failed, @unknown, @skipped)
                  AND COALESCE(provider_message_id, '') = ''
                  AND error_category IN (@transient, @rate_limit, @unknown, '')
                RETURNING id, campaign_id, source_type, display_name, phone_normalized, eligibility_status, exclusion_reason,
                          processing_status, provider_status, provider_message_id, attempt_count,
                          error_category, error_code, error_message,
                          accepted_at, delivered_at, read_at, failed_at, last_attempt_at, next_attempt_at;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = recipientId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Queued;
            db.AddParameter(command, "failed", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Failed;
            db.AddParameter(command, "unknown", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Unknown;
            db.AddParameter(command, "skipped", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Skipped;
            db.AddParameter(command, "transient", DbTypes.Types.String).Value = WhatsAppCampaignErrorCategories.Transient;
            db.AddParameter(command, "rate_limit", DbTypes.Types.String).Value = WhatsAppCampaignErrorCategories.RateLimit;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception(
                    "Recipient is not safely recoverable (accepted messages, permanent failures, or missing row).");
            }

            var dto = ReadRecipient(reader);
            if (string.Equals(campaign.status, WhatsAppCampaignStatuses.CompletedWithErrors, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(campaign.status, WhatsAppCampaignStatuses.Failed, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(campaign.status, WhatsAppCampaignStatuses.Paused, StringComparison.OrdinalIgnoreCase))
            {
                using var requeue = db.GetCommand(@"
                    UPDATE whatsapp_campaigns
                    SET status = @queued, completed_at = NULL, updated_at = @now, version = version + 1
                    WHERE id = @id AND organisation_id = @organisation_id;");
                db.AddParameter(requeue, "id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(requeue, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(requeue, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
                db.AddParameter(requeue, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(requeue);
            }

            return dto;
        }

        /// <summary>Background worker entry: promote due schedules, claim campaigns, process recipients.</summary>
        public async Task ProcessDispatchCycleAsync(CancellationToken cancellationToken)
        {
            if (!await _outboundGuard.IsOutboundEnabledAsync(cancellationToken))
            {
                _logger.LogWarning("WhatsApp campaign dispatch paused globally; skipping claim cycle");
                return;
            }

            using var db = await _dbProvider.GetDb();
            await db.Connect();

            await PromoteDueScheduled(db, cancellationToken);
            await RecoverExpiredCampaignLeases(db);

            var campaignBatch = Math.Clamp(
                _options.campaign_batch_size <= 0 ? 3 : _options.campaign_batch_size, 1, 20);
            var claimed = await ClaimCampaigns(db, campaignBatch, cancellationToken);
            foreach (var campaignId in claimed)
            {
                if (cancellationToken.IsCancellationRequested) break;
                try
                {
                    await ProcessClaimedCampaign(db, campaignId, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Campaign dispatch failed for {CampaignId}", campaignId);
                    await ReleaseCampaignLease(db, campaignId, keepDispatching: false);
                }
            }
        }

        /// <summary>
        /// Idempotent webhook reconciliation into campaign recipient + counters.
        /// </summary>
        public async Task ApplyProviderStatusToCampaignAsync(
            IDb db,
            long organisationId,
            long whatsappConnectionId,
            string providerMessageId,
            string mappedStatus,
            string failureReason)
        {
            if (string.IsNullOrWhiteSpace(providerMessageId)) return;

            long? recipientId = null;
            long? campaignId = null;
            string? currentProvider = null;
            string? currentProcessing = null;

            using (var find = db.GetCommand(@"
                SELECT r.id, r.campaign_id, r.provider_status, r.processing_status
                FROM whatsapp_campaign_recipients r
                INNER JOIN whatsapp_campaigns c ON c.id = r.campaign_id
                WHERE r.organisation_id = @organisation_id
                  AND c.whatsapp_connection_id = @whatsapp_connection_id
                  AND r.provider_message_id = @provider_message_id
                LIMIT 1;"))
            {
                db.AddParameter(find, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(find, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
                db.AddParameter(find, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                using var reader = await db.Execute(find);
                if (!await reader.ReadAsync())
                {
                    // Fallback via whatsapp_messages campaign link
                    using var findMsg = db.GetCommand(@"
                        SELECT r.id, r.campaign_id, r.provider_status, r.processing_status
                        FROM whatsapp_messages m
                        INNER JOIN whatsapp_campaign_recipients r ON r.id = m.campaign_recipient_id
                        WHERE m.organisation_id = @organisation_id
                          AND m.whatsapp_connection_id = @whatsapp_connection_id
                          AND m.provider_message_id = @provider_message_id
                          AND m.campaign_recipient_id IS NOT NULL
                        LIMIT 1;");
                    db.AddParameter(findMsg, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                    db.AddParameter(findMsg, "whatsapp_connection_id", DbTypes.Types.Long).Value = whatsappConnectionId;
                    db.AddParameter(findMsg, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                    using var reader2 = await db.Execute(findMsg);
                    if (!await reader2.ReadAsync()) return;
                    recipientId = Convert.ToInt64(reader2["id"]);
                    campaignId = Convert.ToInt64(reader2["campaign_id"]);
                    currentProvider = reader2["provider_status"]?.ToString() ?? "";
                    currentProcessing = reader2["processing_status"]?.ToString() ?? "";
                }
                else
                {
                    recipientId = Convert.ToInt64(reader["id"]);
                    campaignId = Convert.ToInt64(reader["campaign_id"]);
                    currentProvider = reader["provider_status"]?.ToString() ?? "";
                    currentProcessing = reader["processing_status"]?.ToString() ?? "";
                }
            }

            if (!WhatsAppMessageStatusRules.CanApply(
                    string.IsNullOrEmpty(currentProvider) ? WhatsAppMessageStatuses.Sent : currentProvider,
                    mappedStatus) &&
                !string.Equals(mappedStatus, WhatsAppMessageStatuses.Failed, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            // Already at this status — idempotent no-op for counters
            if (string.Equals(currentProvider, mappedStatus, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var now = DateTime.UtcNow;
            var setDelivered = string.Equals(mappedStatus, WhatsAppMessageStatuses.Delivered, StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(mappedStatus, WhatsAppMessageStatuses.Read, StringComparison.OrdinalIgnoreCase);
            var setRead = string.Equals(mappedStatus, WhatsAppMessageStatuses.Read, StringComparison.OrdinalIgnoreCase);
            var setFailed = string.Equals(mappedStatus, WhatsAppMessageStatuses.Failed, StringComparison.OrdinalIgnoreCase);
            var setSent = string.Equals(mappedStatus, WhatsAppMessageStatuses.Sent, StringComparison.OrdinalIgnoreCase);

            using (var upd = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET provider_status = @provider_status,
                    processing_status = CASE
                        WHEN @set_failed THEN @failed_status
                        WHEN processing_status = @unknown THEN @accepted
                        ELSE processing_status
                    END,
                    sent_at = CASE WHEN @set_sent AND sent_at IS NULL THEN @now ELSE sent_at END,
                    delivered_at = CASE WHEN @set_delivered AND delivered_at IS NULL THEN @now ELSE delivered_at END,
                    read_at = CASE WHEN @set_read AND read_at IS NULL THEN @now ELSE read_at END,
                    failed_at = CASE WHEN @set_failed THEN @now ELSE failed_at END,
                    error_message = CASE WHEN @set_failed AND @failure_reason <> '' THEN @failure_reason ELSE error_message END,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(upd, "id", DbTypes.Types.Long).Value = recipientId!.Value;
                db.AddParameter(upd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(upd, "provider_status", DbTypes.Types.String).Value = mappedStatus;
                db.AddParameter(upd, "set_failed", DbTypes.Types.Boolean).Value = setFailed;
                db.AddParameter(upd, "set_sent", DbTypes.Types.Boolean).Value = setSent;
                db.AddParameter(upd, "set_delivered", DbTypes.Types.Boolean).Value = setDelivered;
                db.AddParameter(upd, "set_read", DbTypes.Types.Boolean).Value = setRead;
                db.AddParameter(upd, "failed_status", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Failed;
                db.AddParameter(upd, "unknown", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Unknown;
                db.AddParameter(upd, "accepted", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Accepted;
                db.AddParameter(upd, "failure_reason", DbTypes.Types.String).Value = failureReason ?? "";
                db.AddParameter(upd, "now", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(upd);
            }

            // Counter bumps only on first transition into each status
            var wasDelivered = string.Equals(currentProvider, WhatsAppMessageStatuses.Delivered, StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(currentProvider, WhatsAppMessageStatuses.Read, StringComparison.OrdinalIgnoreCase);
            var wasRead = string.Equals(currentProvider, WhatsAppMessageStatuses.Read, StringComparison.OrdinalIgnoreCase);
            var wasFailed = string.Equals(currentProvider, WhatsAppMessageStatuses.Failed, StringComparison.OrdinalIgnoreCase);

            var incDelivered = setDelivered && !wasDelivered ? 1 : 0;
            var incRead = setRead && !wasRead ? 1 : 0;
            var incFailed = setFailed && !wasFailed ? 1 : 0;

            if (incDelivered == 0 && incRead == 0 && incFailed == 0) return;

            using var bump = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET delivered_count = delivered_count + @inc_delivered,
                    read_count = read_count + @inc_read,
                    failed_count = failed_count + @inc_failed,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;");
            db.AddParameter(bump, "id", DbTypes.Types.Long).Value = campaignId!.Value;
            db.AddParameter(bump, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(bump, "inc_delivered", DbTypes.Types.Integer).Value = incDelivered;
            db.AddParameter(bump, "inc_read", DbTypes.Types.Integer).Value = incRead;
            db.AddParameter(bump, "inc_failed", DbTypes.Types.Integer).Value = incFailed;
            db.AddParameter(bump, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(bump);
        }

        private async Task PromoteDueScheduled(IDb db, CancellationToken cancellationToken)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @queued,
                    started_at = COALESCE(started_at, @now),
                    version = version + 1,
                    updated_at = @now
                WHERE status = @scheduled
                  AND scheduled_at IS NOT NULL
                  AND scheduled_at <= @now
                RETURNING id, organisation_id;");
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(command, "scheduled", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Scheduled;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            var promoted = new List<(long id, long orgId)>();
            using (var reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    promoted.Add((Convert.ToInt64(reader["id"]), Convert.ToInt64(reader["organisation_id"])));
                }
            }

            foreach (var (id, orgId) in promoted)
            {
                await PromoteEligibleRecipients(db, orgId, id);
                _logger.LogInformation("Scheduled campaign {CampaignId} promoted to queued", id);
            }
        }

        private async Task RecoverExpiredCampaignLeases(IDb db)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @queued,
                    dispatch_lease_owner = '',
                    dispatch_lease_until = NULL,
                    updated_at = @now
                WHERE status = @dispatching
                  AND (dispatch_lease_until IS NULL OR dispatch_lease_until < @now);");
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(command, "dispatching", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Dispatching;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);

            using var recipients = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @queued,
                    lease_owner = '',
                    lease_until = NULL,
                    updated_at = @now
                WHERE processing_status = @processing
                  AND (lease_until IS NULL OR lease_until < @now)
                  AND COALESCE(provider_message_id, '') = '';");
            db.AddParameter(recipients, "queued", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Queued;
            db.AddParameter(recipients, "processing", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Processing;
            db.AddParameter(recipients, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(recipients);
        }

        private async Task<List<long>> ClaimCampaigns(IDb db, int batchSize, CancellationToken cancellationToken)
        {
            var leaseSeconds = Math.Clamp(_options.lease_seconds <= 0 ? 90 : _options.lease_seconds, 30, 600);
            using var command = db.GetCommand(@"
                WITH claimable AS (
                    SELECT id
                    FROM whatsapp_campaigns
                    WHERE status IN (@queued, @cancelling)
                       OR (status = @dispatching AND (dispatch_lease_until IS NULL OR dispatch_lease_until < @now))
                    ORDER BY updated_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT @batch_size
                )
                UPDATE whatsapp_campaigns c
                SET status = CASE WHEN c.status = @cancelling THEN @cancelling ELSE @dispatching END,
                    dispatch_lease_owner = @owner,
                    dispatch_lease_until = @lease_until,
                    started_at = COALESCE(c.started_at, @now),
                    updated_at = @now
                FROM claimable x
                WHERE c.id = x.id
                RETURNING c.id;");
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(command, "dispatching", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Dispatching;
            db.AddParameter(command, "cancelling", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelling;
            db.AddParameter(command, "batch_size", DbTypes.Types.Integer).Value = batchSize;
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

        private async Task ProcessClaimedCampaign(IDb db, long campaignId, CancellationToken cancellationToken)
        {
            var campaign = await LoadCampaignById(db, campaignId);
            if (campaign == null) return;

            if (string.Equals(campaign.status, WhatsAppCampaignStatuses.Cancelling, StringComparison.OrdinalIgnoreCase))
            {
                await CancelUndispatchedRecipients(db, campaign.organisation_id, campaignId);
                await FinalizeCancellingIfIdle(db, campaign.organisation_id, campaignId);
                await ReleaseCampaignLease(db, campaignId, keepDispatching: false);
                return;
            }

            if (string.Equals(campaign.status, WhatsAppCampaignStatuses.Paused, StringComparison.OrdinalIgnoreCase))
            {
                await ReleaseCampaignLease(db, campaignId, keepDispatching: false);
                return;
            }

            var recipientBatch = Math.Clamp(
                _options.recipient_batch_size <= 0 ? 10 : _options.recipient_batch_size, 1, 50);
            var delayMs = Math.Max(0, _options.send_delay_ms);
            var maxAttempts = Math.Clamp(_options.max_attempts <= 0 ? 5 : _options.max_attempts, 1, 20);

            var recipients = await ClaimRecipients(db, campaignId, campaign.organisation_id, recipientBatch, maxAttempts);
            if (recipients.Count == 0)
            {
                await FinalizeCampaignIfComplete(db, campaign);
                await ReleaseCampaignLease(db, campaignId, keepDispatching: false);
                return;
            }

            WhatsAppOrgConnectionContext? connection = null;
            WhatsAppTemplateDto? template = null;
            List<WhatsAppCampaignVariableMap> mappings = DeserializeMappings(campaign.variable_mapping);
            string orgName = await GetOrganisationName(db, campaign.organisation_id);

            try
            {
                connection = await LoadConnection(db, campaign.whatsapp_connection_id, campaign.organisation_id);
                if (campaign.message_template_id is > 0)
                {
                    template = await EnsureApprovedTemplate(
                        db, campaign.organisation_id, campaign.whatsapp_connection_id, campaign.message_template_id.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Campaign {CampaignId} preflight failed", campaignId);
            }

            foreach (var recipientId in recipients)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // Re-check pause/cancel between sends
                var status = await GetCampaignStatus(db, campaign.organisation_id, campaignId);
                if (string.Equals(status, WhatsAppCampaignStatuses.Paused, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(status, WhatsAppCampaignStatuses.Cancelling, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(status, WhatsAppCampaignStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
                {
                    await RequeueOrCancelClaimed(db, campaign.organisation_id, campaignId, recipientId, status);
                    break;
                }

                await DispatchOneRecipient(
                    db, campaign, recipientId, connection, template, mappings, orgName, maxAttempts, cancellationToken);

                if (delayMs > 0)
                {
                    try { await Task.Delay(delayMs, cancellationToken); }
                    catch (OperationCanceledException) { break; }
                }
            }

            await RenewCampaignLease(db, campaignId);
            var refreshed = await LoadCampaignById(db, campaignId);
            if (refreshed != null)
            {
                await FinalizeCampaignIfComplete(db, refreshed);
            }
            await ReleaseCampaignLease(db, campaignId, keepDispatching: false);
        }

        private async Task DispatchOneRecipient(
            IDb db,
            WhatsAppCampaignDto campaign,
            long recipientId,
            WhatsAppOrgConnectionContext? connection,
            WhatsAppTemplateDto? template,
            List<WhatsAppCampaignVariableMap> mappings,
            string orgName,
            int maxAttempts,
            CancellationToken cancellationToken)
        {
            var recipient = await LoadRecipient(db, campaign.organisation_id, campaign.id, recipientId);
            if (recipient == null) return;

            // Already accepted — never resend
            if (!string.IsNullOrWhiteSpace(recipient.provider_message_id) ||
                string.Equals(recipient.processing_status, WhatsAppCampaignRecipientProcessingStatuses.Accepted, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (connection == null || !connection.is_active ||
                connection.status != IntegrationStatuses.Connected ||
                string.IsNullOrWhiteSpace(connection.access_token) ||
                string.IsNullOrWhiteSpace(connection.phone_number_id))
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "connection_inactive",
                    "WhatsApp connection is disconnected or credentials are unavailable.",
                    retry: false, maxAttempts);
                return;
            }

            if (connection.organisation_id != campaign.organisation_id ||
                connection.whatsapp_connection_id != campaign.whatsapp_connection_id)
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "connection_mismatch",
                    "Connection does not belong to this organisation/campaign.",
                    retry: false, maxAttempts);
                return;
            }

            if (template == null ||
                !string.Equals(template.status, WhatsAppTemplateStatuses.Approved, StringComparison.OrdinalIgnoreCase))
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "template_unapproved",
                    "Template is not approved for this WABA.",
                    retry: false, maxAttempts);
                return;
            }

            var phone = recipient.phone_normalized;
            if (string.IsNullOrEmpty(phone) || phone.Length < 10)
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "invalid_phone",
                    "Invalid recipient phone.",
                    retry: false, maxAttempts);
                return;
            }

            var consent = await GetConsentStatus(db, campaign.organisation_id, phone, campaign.category);
            if (consent == WhatsAppConsentStatuses.OptedOut)
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "opted_out",
                    "Recipient opted out.",
                    retry: false, maxAttempts);
                return;
            }

            if (IsMarketing(campaign.category) && consent != WhatsAppConsentStatuses.OptedIn)
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Skipped,
                    WhatsAppCampaignErrorCategories.Permanent, "missing_consent",
                    "Marketing consent is required.",
                    retry: false, maxAttempts);
                return;
            }

            var vars = ResolveVariables(mappings, recipient.display_name, phone, orgName);
            var (headerParams, bodyParams, unresolved) = BuildTemplateParameters(template.components_json, vars, mappings);
            if (unresolved.Count > 0)
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Failed,
                    WhatsAppCampaignErrorCategories.Permanent, "variables_unresolved",
                    "Required template variables unresolved: " + string.Join(", ", unresolved),
                    retry: false, maxAttempts);
                return;
            }

            var preview = BuildBodyPreview(template.components_json, vars);
            var conversationId = await UpsertConversation(
                db, campaign.organisation_id, campaign.whatsapp_connection_id, phone, recipient.display_name, preview);

            var messageId = await InsertCampaignMessage(
                db, campaign, recipient, conversationId, preview);

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
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Unknown,
                    WhatsAppCampaignErrorCategories.Unknown, "cancelled",
                    "Worker cancelled during send — outcome uncertain.",
                    retry: false, maxAttempts, messageId: messageId);
                throw;
            }

            if (send.success && !string.IsNullOrWhiteSpace(send.provider_message_id))
            {
                await PersistAccepted(db, campaign, recipient, messageId, send.provider_message_id, vars);
                return;
            }

            if (send.outcome_uncertain)
            {
                await MarkRecipientOutcome(
                    db, campaign, recipient, WhatsAppCampaignRecipientProcessingStatuses.Unknown,
                    WhatsAppCampaignErrorCategories.Unknown, send.error_code,
                    string.IsNullOrWhiteSpace(send.error) ? "Uncertain provider outcome." : Truncate(send.error, 400),
                    retry: false, maxAttempts, messageId: messageId);
                await UpdateMessageStatus(db, messageId, WhatsAppMessageStatuses.Queued, send.error, "");
                await BumpCampaignCounter(db, campaign.organisation_id, campaign.id, unknown: 1);
                return;
            }

            var category = send.is_rate_limited
                ? WhatsAppCampaignErrorCategories.RateLimit
                : send.is_transient
                    ? WhatsAppCampaignErrorCategories.Transient
                    : WhatsAppCampaignErrorCategories.Permanent;

            var canRetry = category is WhatsAppCampaignErrorCategories.Transient or WhatsAppCampaignErrorCategories.RateLimit;
            await MarkRecipientOutcome(
                db, campaign, recipient,
                canRetry ? WhatsAppCampaignRecipientProcessingStatuses.Queued : WhatsAppCampaignRecipientProcessingStatuses.Failed,
                category, send.error_code,
                string.IsNullOrWhiteSpace(send.error) ? "Provider rejected send." : Truncate(send.error, 400),
                retry: canRetry, maxAttempts, messageId: messageId,
                rateLimit: send.is_rate_limited);

            await UpdateMessageStatus(
                db, messageId, WhatsAppMessageStatuses.Failed,
                send.error, send.provider_message_id);

            if (!canRetry)
            {
                await BumpCampaignCounter(db, campaign.organisation_id, campaign.id, failed: 1);
            }
        }

        private async Task PersistAccepted(
            IDb db,
            WhatsAppCampaignDto campaign,
            WhatsAppCampaignRecipientDto recipient,
            long messageId,
            string providerMessageId,
            Dictionary<string, string> vars)
        {
            var now = DateTime.UtcNow;
            using (var updMsg = db.GetCommand(@"
                UPDATE whatsapp_messages
                SET status = @status,
                    provider_message_id = @provider_message_id,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(updMsg, "id", DbTypes.Types.Long).Value = messageId;
                db.AddParameter(updMsg, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
                db.AddParameter(updMsg, "status", DbTypes.Types.String).Value = WhatsAppMessageStatuses.Sent;
                db.AddParameter(updMsg, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                db.AddParameter(updMsg, "now", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(updMsg);
            }

            using (var upd = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @accepted,
                    provider_status = @sent,
                    provider_message_id = @provider_message_id,
                    whatsapp_message_id = @message_id,
                    accepted_at = @now,
                    sent_at = @now,
                    last_attempt_at = @now,
                    lease_owner = '',
                    lease_until = NULL,
                    resolved_variables_json = @vars,
                    error_category = '',
                    error_code = '',
                    error_message = '',
                    updated_at = @now
                WHERE id = @id
                  AND organisation_id = @organisation_id
                  AND campaign_id = @campaign_id
                  AND COALESCE(provider_message_id, '') = '';"))
            {
                db.AddParameter(upd, "id", DbTypes.Types.Long).Value = recipient.id;
                db.AddParameter(upd, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
                db.AddParameter(upd, "campaign_id", DbTypes.Types.Long).Value = campaign.id;
                db.AddParameter(upd, "accepted", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Accepted;
                db.AddParameter(upd, "sent", DbTypes.Types.String).Value = WhatsAppMessageStatuses.Sent;
                db.AddParameter(upd, "provider_message_id", DbTypes.Types.String).Value = providerMessageId;
                db.AddParameter(upd, "message_id", DbTypes.Types.Long).Value = messageId;
                db.AddParameter(upd, "vars", DbTypes.Types.String).Value = JsonSerializer.Serialize(vars);
                db.AddParameter(upd, "now", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(upd);
            }

            await BumpCampaignCounter(db, campaign.organisation_id, campaign.id, accepted: 1);
        }

        private async Task MarkRecipientOutcome(
            IDb db,
            WhatsAppCampaignDto campaign,
            WhatsAppCampaignRecipientDto recipient,
            string processingStatus,
            string errorCategory,
            string errorCode,
            string errorMessage,
            bool retry,
            int maxAttempts,
            long? messageId = null,
            bool rateLimit = false)
        {
            var attempt = recipient.attempt_count + 1;
            var exhausted = retry && attempt >= maxAttempts;
            if (exhausted)
            {
                processingStatus = WhatsAppCampaignRecipientProcessingStatuses.Failed;
                retry = false;
            }

            DateTime? nextAttempt = null;
            if (retry)
            {
                var baseSeconds = rateLimit ? 60 : Math.Min(300, (int)Math.Pow(2, Math.Min(attempt, 6)) * 5);
                var jitter = Random.Shared.Next(0, 15);
                nextAttempt = DateTime.UtcNow.AddSeconds(baseSeconds + jitter);
                processingStatus = WhatsAppCampaignRecipientProcessingStatuses.Queued;
            }

            var now = DateTime.UtcNow;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @processing_status,
                    attempt_count = @attempt_count,
                    max_attempts = @max_attempts,
                    next_attempt_at = @next_attempt_at,
                    last_attempt_at = @now,
                    lease_owner = '',
                    lease_until = NULL,
                    whatsapp_message_id = COALESCE(@message_id, whatsapp_message_id),
                    error_category = @error_category,
                    error_code = @error_code,
                    error_message = @error_message,
                    failed_at = CASE WHEN @processing_status = @failed THEN @now ELSE failed_at END,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id AND campaign_id = @campaign_id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = recipient.id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaign.id;
            db.AddParameter(command, "processing_status", DbTypes.Types.String).Value = processingStatus;
            db.AddParameter(command, "attempt_count", DbTypes.Types.Integer).Value = attempt;
            db.AddParameter(command, "max_attempts", DbTypes.Types.Integer).Value = maxAttempts;
            db.AddParameter(command, "next_attempt_at", DbTypes.Types.DateTime).Value =
                nextAttempt.HasValue ? nextAttempt.Value : DBNull.Value;
            db.AddParameter(command, "message_id", DbTypes.Types.Long).Value =
                messageId.HasValue ? messageId.Value : DBNull.Value;
            db.AddParameter(command, "error_category", DbTypes.Types.String).Value = errorCategory;
            db.AddParameter(command, "error_code", DbTypes.Types.String).Value = Truncate(errorCode, 80);
            db.AddParameter(command, "error_message", DbTypes.Types.String).Value = Truncate(errorMessage, 400);
            db.AddParameter(command, "failed", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Failed;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);

            if (string.Equals(processingStatus, WhatsAppCampaignRecipientProcessingStatuses.Skipped, StringComparison.OrdinalIgnoreCase) ||
                (string.Equals(processingStatus, WhatsAppCampaignRecipientProcessingStatuses.Failed, StringComparison.OrdinalIgnoreCase) && !retry))
            {
                // skipped permanent preflight — count as failed for campaign metrics when failed
                if (string.Equals(processingStatus, WhatsAppCampaignRecipientProcessingStatuses.Failed, StringComparison.OrdinalIgnoreCase))
                {
                    await BumpCampaignCounter(db, campaign.organisation_id, campaign.id, failed: 1);
                }
            }
        }

        private async Task<List<long>> ClaimRecipients(
            IDb db, long campaignId, long organisationId, int batchSize, int maxAttempts)
        {
            var leaseSeconds = Math.Clamp(_options.lease_seconds <= 0 ? 90 : _options.lease_seconds, 30, 600);
            using var command = db.GetCommand(@"
                WITH claimable AS (
                    SELECT id
                    FROM whatsapp_campaign_recipients
                    WHERE campaign_id = @campaign_id
                      AND organisation_id = @organisation_id
                      AND processing_status IN (@queued, @processing)
                      AND COALESCE(provider_message_id, '') = ''
                      AND (next_attempt_at IS NULL OR next_attempt_at <= @now)
                      AND (processing_status = @queued
                           OR (processing_status = @processing AND (lease_until IS NULL OR lease_until < @now)))
                      AND attempt_count < @max_attempts
                    ORDER BY next_attempt_at NULLS FIRST, id ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT @batch_size
                )
                UPDATE whatsapp_campaign_recipients r
                SET processing_status = @processing,
                    lease_owner = @owner,
                    lease_until = @lease_until,
                    updated_at = @now
                FROM claimable c
                WHERE r.id = c.id
                RETURNING r.id;");
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Queued;
            db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Processing;
            db.AddParameter(command, "batch_size", DbTypes.Types.Integer).Value = batchSize;
            db.AddParameter(command, "max_attempts", DbTypes.Types.Integer).Value = maxAttempts;
            db.AddParameter(command, "owner", DbTypes.Types.String).Value = _workerId;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "lease_until", DbTypes.Types.DateTime).Value = DateTime.UtcNow.AddSeconds(leaseSeconds);

            var ids = new List<long>();
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync()) ids.Add(Convert.ToInt64(reader["id"]));
            return ids;
        }

        private async Task FinalizeCampaignIfComplete(IDb db, WhatsAppCampaignDto campaign)
        {
            if (!WhatsAppCampaignStateMachine.IsActiveDispatch(campaign.status) &&
                !string.Equals(campaign.status, WhatsAppCampaignStatuses.Dispatching, StringComparison.OrdinalIgnoreCase))
            {
                // still allow finalize when lease held as dispatching
            }

            int remaining;
            using (var command = db.GetCommand(@"
                SELECT COUNT(*)::int AS cnt
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = @campaign_id AND organisation_id = @organisation_id
                  AND processing_status IN (@queued, @processing)
                  AND COALESCE(provider_message_id, '') = '';"))
            {
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaign.id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
                db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Queued;
                db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Processing;
                using var reader = await db.Execute(command);
                await reader.ReadAsync();
                remaining = Convert.ToInt32(reader["cnt"]);
            }

            if (remaining > 0) return;

            int failedOrUnknown;
            using (var command = db.GetCommand(@"
                SELECT COUNT(*)::int AS cnt
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = @campaign_id AND organisation_id = @organisation_id
                  AND processing_status IN (@failed, @unknown, @skipped);"))
            {
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaign.id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
                db.AddParameter(command, "failed", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Failed;
                db.AddParameter(command, "unknown", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Unknown;
                db.AddParameter(command, "skipped", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Skipped;
                using var reader = await db.Execute(command);
                await reader.ReadAsync();
                failedOrUnknown = Convert.ToInt32(reader["cnt"]);
            }

            var finalStatus = failedOrUnknown > 0
                ? WhatsAppCampaignStatuses.CompletedWithErrors
                : WhatsAppCampaignStatuses.Completed;

            using var upd = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @status,
                    completed_at = @now,
                    dispatch_lease_owner = '',
                    dispatch_lease_until = NULL,
                    updated_at = @now,
                    version = version + 1
                WHERE id = @id AND organisation_id = @organisation_id
                  AND status IN (@queued, @dispatching);");
            db.AddParameter(upd, "id", DbTypes.Types.Long).Value = campaign.id;
            db.AddParameter(upd, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
            db.AddParameter(upd, "status", DbTypes.Types.String).Value = finalStatus;
            db.AddParameter(upd, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(upd, "dispatching", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Dispatching;
            db.AddParameter(upd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(upd);
        }

        private async Task FinalizeCancellingIfIdle(IDb db, long organisationId, long campaignId)
        {
            int inFlight;
            using (var command = db.GetCommand(@"
                SELECT COUNT(*)::int AS cnt
                FROM whatsapp_campaign_recipients
                WHERE campaign_id = @campaign_id AND organisation_id = @organisation_id
                  AND processing_status = @processing
                  AND lease_until IS NOT NULL AND lease_until > @now;"))
            {
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Processing;
                db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                using var reader = await db.Execute(command);
                await reader.ReadAsync();
                inFlight = Convert.ToInt32(reader["cnt"]);
            }

            if (inFlight > 0) return;

            using var upd = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET status = @cancelled,
                    completed_at = @now,
                    dispatch_lease_owner = '',
                    dispatch_lease_until = NULL,
                    updated_at = @now,
                    version = version + 1
                WHERE id = @id AND organisation_id = @organisation_id AND status = @cancelling;");
            db.AddParameter(upd, "id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(upd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(upd, "cancelled", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelled;
            db.AddParameter(upd, "cancelling", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelling;
            db.AddParameter(upd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(upd);
        }

        private async Task CancelUndispatchedRecipients(IDb db, long organisationId, long campaignId)
        {
            int cancelled;
            using (var command = db.GetCommand(@"
                WITH upd AS (
                    UPDATE whatsapp_campaign_recipients
                    SET processing_status = @cancelled,
                        lease_owner = '',
                        lease_until = NULL,
                        updated_at = @now
                    WHERE organisation_id = @organisation_id
                      AND campaign_id = @campaign_id
                      AND processing_status IN (@pending, @queued, @processing)
                      AND COALESCE(provider_message_id, '') = ''
                    RETURNING id
                )
                SELECT COUNT(*)::int AS cnt FROM upd;"))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(command, "cancelled", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Cancelled;
                db.AddParameter(command, "pending", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Pending;
                db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Queued;
                db.AddParameter(command, "processing", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Processing;
                db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                using var reader = await db.Execute(command);
                await reader.ReadAsync();
                cancelled = Convert.ToInt32(reader["cnt"]);
            }

            if (cancelled > 0)
            {
                using var bump = db.GetCommand(@"
                    UPDATE whatsapp_campaigns
                    SET cancelled_count = cancelled_count + @n, updated_at = @now
                    WHERE id = @id AND organisation_id = @organisation_id;");
                db.AddParameter(bump, "id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(bump, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(bump, "n", DbTypes.Types.Integer).Value = cancelled;
                db.AddParameter(bump, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(bump);
            }
        }

        private async Task PromoteEligibleRecipients(IDb db, long organisationId, long campaignId)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @queued, updated_at = @now
                WHERE organisation_id = @organisation_id
                  AND campaign_id = @campaign_id
                  AND eligibility_status = 'eligible'
                  AND processing_status IN (@pending, @queued)
                  AND COALESCE(provider_message_id, '') = '';");
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Queued;
            db.AddParameter(command, "pending", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Pending;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);

            using var skip = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @skipped, updated_at = @now
                WHERE organisation_id = @organisation_id
                  AND campaign_id = @campaign_id
                  AND eligibility_status = 'excluded'
                  AND processing_status = @pending;");
            db.AddParameter(skip, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(skip, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(skip, "skipped", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Skipped;
            db.AddParameter(skip, "pending", DbTypes.Types.String).Value = WhatsAppCampaignRecipientProcessingStatuses.Pending;
            db.AddParameter(skip, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(skip);
        }

        private async Task ReleaseCampaignLease(IDb db, long campaignId, bool keepDispatching)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET dispatch_lease_owner = '',
                    dispatch_lease_until = NULL,
                    status = CASE
                        WHEN status = @cancelling THEN @cancelling
                        WHEN status = @paused THEN @paused
                        WHEN status IN (@completed, @completed_errors, @cancelled, @failed) THEN status
                        WHEN @keep THEN @dispatching
                        WHEN status = @dispatching THEN @queued
                        ELSE status
                    END,
                    updated_at = @now
                WHERE id = @id AND dispatch_lease_owner = @owner;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "owner", DbTypes.Types.String).Value = _workerId;
            db.AddParameter(command, "keep", DbTypes.Types.Boolean).Value = keepDispatching;
            db.AddParameter(command, "cancelling", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelling;
            db.AddParameter(command, "paused", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Paused;
            db.AddParameter(command, "completed", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Completed;
            db.AddParameter(command, "completed_errors", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.CompletedWithErrors;
            db.AddParameter(command, "cancelled", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Cancelled;
            db.AddParameter(command, "failed", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Failed;
            db.AddParameter(command, "dispatching", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Dispatching;
            db.AddParameter(command, "queued", DbTypes.Types.String).Value = WhatsAppCampaignStatuses.Queued;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task RenewCampaignLease(IDb db, long campaignId)
        {
            var leaseSeconds = Math.Clamp(_options.lease_seconds <= 0 ? 90 : _options.lease_seconds, 30, 600);
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET dispatch_lease_until = @lease_until, updated_at = @now
                WHERE id = @id AND dispatch_lease_owner = @owner;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "owner", DbTypes.Types.String).Value = _workerId;
            db.AddParameter(command, "lease_until", DbTypes.Types.DateTime).Value = DateTime.UtcNow.AddSeconds(leaseSeconds);
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task RequeueOrCancelClaimed(
            IDb db, long organisationId, long campaignId, long recipientId, string campaignStatus)
        {
            var cancel = string.Equals(campaignStatus, WhatsAppCampaignStatuses.Cancelling, StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(campaignStatus, WhatsAppCampaignStatuses.Cancelled, StringComparison.OrdinalIgnoreCase);
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaign_recipients
                SET processing_status = @status,
                    lease_owner = '',
                    lease_until = NULL,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id AND campaign_id = @campaign_id
                  AND COALESCE(provider_message_id, '') = '';");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = recipientId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = cancel
                ? WhatsAppCampaignRecipientProcessingStatuses.Cancelled
                : WhatsAppCampaignRecipientProcessingStatuses.Queued;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task BumpCampaignCounter(
            IDb db, long organisationId, long campaignId,
            int accepted = 0, int failed = 0, int unknown = 0)
        {
            if (accepted == 0 && failed == 0 && unknown == 0) return;
            using var command = db.GetCommand(@"
                UPDATE whatsapp_campaigns
                SET accepted_count = accepted_count + @accepted,
                    failed_count = failed_count + @failed,
                    unknown_count = unknown_count + @unknown,
                    updated_at = @now
                WHERE id = @id AND organisation_id = @organisation_id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "accepted", DbTypes.Types.Integer).Value = accepted;
            db.AddParameter(command, "failed", DbTypes.Types.Integer).Value = failed;
            db.AddParameter(command, "unknown", DbTypes.Types.Integer).Value = unknown;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task<long> InsertCampaignMessage(
            IDb db,
            WhatsAppCampaignDto campaign,
            WhatsAppCampaignRecipientDto recipient,
            long conversationId,
            string preview)
        {
            using var command = db.GetCommand(@"
                INSERT INTO whatsapp_messages (
                    organisation_id, whatsapp_connection_id, conversation_id, provider_message_id,
                    direction, message_type, text_content, media_id, status, failure_reason,
                    provider_timestamp, campaign_id, campaign_recipient_id, created_at, updated_at
                ) VALUES (
                    @organisation_id, @whatsapp_connection_id, @conversation_id, '',
                    @direction, @message_type, @text_content, '', @status, '',
                    @provider_timestamp, @campaign_id, @campaign_recipient_id, @now, @now
                )
                RETURNING id;");
            var now = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = campaign.organisation_id;
            db.AddParameter(command, "whatsapp_connection_id", DbTypes.Types.Long).Value = campaign.whatsapp_connection_id;
            db.AddParameter(command, "conversation_id", DbTypes.Types.Long).Value = conversationId;
            db.AddParameter(command, "direction", DbTypes.Types.String).Value = WhatsAppMessageDirections.Outbound;
            db.AddParameter(command, "message_type", DbTypes.Types.String).Value = "template";
            db.AddParameter(command, "text_content", DbTypes.Types.String).Value = Truncate(preview, 2000);
            db.AddParameter(command, "status", DbTypes.Types.String).Value = WhatsAppMessageStatuses.Queued;
            db.AddParameter(command, "provider_timestamp", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaign.id;
            db.AddParameter(command, "campaign_recipient_id", DbTypes.Types.Long).Value = recipient.id;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            using var reader = await db.Execute(command);
            if (await reader.ReadAsync()) return Convert.ToInt64(reader["id"]);
            throw new Exception("Failed to insert campaign message.");
        }

        private async Task UpdateMessageStatus(IDb db, long messageId, string status, string failure, string providerMessageId)
        {
            using var command = db.GetCommand(@"
                UPDATE whatsapp_messages
                SET status = @status,
                    failure_reason = @failure_reason,
                    provider_message_id = CASE WHEN @provider_message_id = '' THEN provider_message_id ELSE @provider_message_id END,
                    updated_at = @now
                WHERE id = @id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = messageId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "failure_reason", DbTypes.Types.String).Value = Truncate(failure ?? "", 500);
            db.AddParameter(command, "provider_message_id", DbTypes.Types.String).Value = providerMessageId ?? "";
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
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
                catch (Exception ex) { _logger.LogError(ex, "Failed to decrypt WhatsApp token for campaign dispatch"); }
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
            {
                throw new Exception($"Template is not approved (status: {status}).");
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

        private async Task<string> GetConsentStatus(IDb db, long organisationId, string phone, string purpose)
        {
            purpose = (purpose ?? "").Trim().ToLowerInvariant() switch
            {
                "utility" => WhatsAppConsentPurposes.Utility,
                "transactional" => WhatsAppConsentPurposes.Transactional,
                _ => WhatsAppConsentPurposes.Marketing,
            };
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

        private async Task<string> GetOrganisationName(IDb db, long organisationId)
        {
            try
            {
                using var command = db.GetCommand("SELECT name FROM organisation WHERE id = @id LIMIT 1;");
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
                using var reader = await db.Execute(command);
                if (await reader.ReadAsync()) return reader["name"]?.ToString() ?? "";
            }
            catch { /* ignore */ }
            return "";
        }

        private async Task<string?> GetCampaignStatus(IDb db, long organisationId, long campaignId)
        {
            using var command = db.GetCommand(@"
                SELECT status FROM whatsapp_campaigns
                WHERE id = @id AND organisation_id = @organisation_id LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = campaignId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return reader["status"]?.ToString();
        }

        private async Task<WhatsAppCampaignDto?> LoadCampaign(IDb db, long organisationId, long id)
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

        private async Task<WhatsAppCampaignDto?> LoadCampaignById(IDb db, long id)
        {
            using var command = db.GetCommand(@"
                SELECT c.*, t.template_name, t.status AS template_status, wc.business_phone, wc.waba_id
                FROM whatsapp_campaigns c
                LEFT JOIN message_templates t ON t.id = c.message_template_id
                LEFT JOIN whatsapp_connections wc ON wc.id = c.whatsapp_connection_id
                WHERE c.id = @id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadCampaign(reader);
        }

        private async Task<WhatsAppCampaignRecipientDto?> LoadRecipient(
            IDb db, long organisationId, long campaignId, long recipientId)
        {
            using var command = db.GetCommand(@"
                SELECT id, campaign_id, source_type, display_name, phone_normalized, eligibility_status, exclusion_reason,
                       processing_status, provider_status, provider_message_id, attempt_count,
                       error_category, error_code, error_message,
                       accepted_at, delivered_at, read_at, failed_at, last_attempt_at, next_attempt_at
                FROM whatsapp_campaign_recipients
                WHERE id = @id AND organisation_id = @organisation_id AND campaign_id = @campaign_id
                LIMIT 1;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = recipientId;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return ReadRecipient(reader);
        }

        private static (List<string> header, List<string> body, List<string> unresolved) BuildTemplateParameters(
            string componentsJson,
            Dictionary<string, string> vars,
            List<WhatsAppCampaignVariableMap> mappings)
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
                    list.Add(value ?? "");
                }
                return list;
            }

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
                        {
                            body = c.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                        }
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
                        _ => m.fallback_value ?? "",
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

        private static List<WhatsAppCampaignVariableMap> DeserializeMappings(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<List<WhatsAppCampaignVariableMap>>(
                    string.IsNullOrWhiteSpace(json) ? "[]" : json) ?? new List<WhatsAppCampaignVariableMap>();
            }
            catch { return new List<WhatsAppCampaignVariableMap>(); }
        }

        private static string NormalizePlaceholder(string? ph)
        {
            ph = (ph ?? "").Trim();
            if (PlaceholderRegex.IsMatch(ph)) return ph;
            if (int.TryParse(ph, out var n)) return "{{" + n + "}}";
            return ph;
        }

        private static bool IsMarketing(string purpose) =>
            !string.Equals(purpose, WhatsAppConsentPurposes.Utility, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(purpose, WhatsAppConsentPurposes.Transactional, StringComparison.OrdinalIgnoreCase);

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
            selected_count = SafeInt(reader, "selected_count"),
            eligible_count = SafeInt(reader, "eligible_count"),
            excluded_count = SafeInt(reader, "excluded_count"),
            accepted_count = SafeInt(reader, "accepted_count"),
            delivered_count = SafeInt(reader, "delivered_count"),
            read_count = SafeInt(reader, "read_count"),
            failed_count = SafeInt(reader, "failed_count"),
            cancelled_count = SafeInt(reader, "cancelled_count"),
            unknown_count = SafeInt(reader, "unknown_count"),
            validation_summary = reader["validation_summary"]?.ToString() ?? "",
            validated_at = reader["validated_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["validated_at"]),
            started_at = HasColumn(reader, "started_at") && reader["started_at"] != DBNull.Value ? Convert.ToDateTime(reader["started_at"]) : null,
            completed_at = HasColumn(reader, "completed_at") && reader["completed_at"] != DBNull.Value ? Convert.ToDateTime(reader["completed_at"]) : null,
            paused_at = HasColumn(reader, "paused_at") && reader["paused_at"] != DBNull.Value ? Convert.ToDateTime(reader["paused_at"]) : null,
            version = SafeInt(reader, "version", 1),
            created_by = reader["created_by"] == DBNull.Value ? null : Convert.ToInt64(reader["created_by"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
            template_name = HasColumn(reader, "template_name") ? reader["template_name"]?.ToString() ?? "" : "",
            template_status = HasColumn(reader, "template_status") ? reader["template_status"]?.ToString() ?? "" : "",
            business_phone = HasColumn(reader, "business_phone") ? reader["business_phone"]?.ToString() ?? "" : "",
            waba_id = HasColumn(reader, "waba_id") ? reader["waba_id"]?.ToString() ?? "" : "",
        };

        private static WhatsAppCampaignRecipientDto ReadRecipient(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            campaign_id = Convert.ToInt64(reader["campaign_id"]),
            source_type = reader["source_type"]?.ToString() ?? "",
            display_name = reader["display_name"]?.ToString() ?? "",
            phone_normalized = reader["phone_normalized"]?.ToString() ?? "",
            eligibility_status = reader["eligibility_status"]?.ToString() ?? "",
            exclusion_reason = reader["exclusion_reason"]?.ToString() ?? "",
            processing_status = HasColumn(reader, "processing_status") ? reader["processing_status"]?.ToString() ?? "" : "",
            provider_status = HasColumn(reader, "provider_status") ? reader["provider_status"]?.ToString() ?? "" : "",
            provider_message_id = reader["provider_message_id"]?.ToString() ?? "",
            attempt_count = SafeInt(reader, "attempt_count"),
            error_category = HasColumn(reader, "error_category") ? reader["error_category"]?.ToString() ?? "" : "",
            error_code = HasColumn(reader, "error_code") ? reader["error_code"]?.ToString() ?? "" : "",
            error_message = HasColumn(reader, "error_message") ? reader["error_message"]?.ToString() ?? "" : "",
            accepted_at = HasColumn(reader, "accepted_at") && reader["accepted_at"] != DBNull.Value ? Convert.ToDateTime(reader["accepted_at"]) : null,
            delivered_at = HasColumn(reader, "delivered_at") && reader["delivered_at"] != DBNull.Value ? Convert.ToDateTime(reader["delivered_at"]) : null,
            read_at = HasColumn(reader, "read_at") && reader["read_at"] != DBNull.Value ? Convert.ToDateTime(reader["read_at"]) : null,
            failed_at = HasColumn(reader, "failed_at") && reader["failed_at"] != DBNull.Value ? Convert.ToDateTime(reader["failed_at"]) : null,
            last_attempt_at = HasColumn(reader, "last_attempt_at") && reader["last_attempt_at"] != DBNull.Value ? Convert.ToDateTime(reader["last_attempt_at"]) : null,
            next_attempt_at = HasColumn(reader, "next_attempt_at") && reader["next_attempt_at"] != DBNull.Value ? Convert.ToDateTime(reader["next_attempt_at"]) : null,
        };

        private static string MaskPhoneForApi(string phone)
        {
            if (string.IsNullOrEmpty(phone) || phone.Length < 4) return phone ?? "";
            return new string('*', Math.Max(0, phone.Length - 4)) + phone[^4..];
        }

        private static int SafeInt(DbDataReader reader, string col, int fallback = 0)
        {
            if (!HasColumn(reader, col) || reader[col] == DBNull.Value) return fallback;
            return Convert.ToInt32(reader[col]);
        }

        private static bool HasColumn(DbDataReader reader, string name)
        {
            for (var i = 0; i < reader.FieldCount; i++)
                if (string.Equals(reader.GetName(i), name, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        private static string BuildWorkerId(string role)
        {
            var id = $"{Environment.MachineName}:{role}:{Guid.NewGuid():N}";
            return id.Length <= 100 ? id : id[..100];
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
    }
}