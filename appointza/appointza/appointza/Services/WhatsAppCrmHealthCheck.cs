using appointza.Utils;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace appointza.Services
{
    /// <summary>
    /// Reports WhatsApp durable queue backlog for readiness/ops. Does not expose payloads or secrets.
    /// </summary>
    public class WhatsAppCrmHealthCheck : IHealthCheck
    {
        private readonly IDbProvider _dbProvider;

        public WhatsAppCrmHealthCheck(IDbProvider dbProvider)
        {
            _dbProvider = dbProvider;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using var db = await _dbProvider.GetDb();
                await db.Connect();

                long webhookPending = 0;
                long campaignQueued = 0;
                long automationPending = 0;
                bool outboundEnabled = true;

                try
                {
                    using var wh = db.GetCommand(@"
                        SELECT COUNT(*)::bigint AS c
                        FROM whatsapp_webhook_events
                        WHERE processing_status IN ('received', 'processing', 'failed')
                          AND retry_count < 20;");
                    using var r = await db.Execute(wh);
                    if (await r.ReadAsync())
                        webhookPending = Convert.ToInt64(r["c"]);
                }
                catch
                {
                    // tables may not exist yet
                }

                try
                {
                    using var cq = db.GetCommand(@"
                        SELECT COUNT(*)::bigint AS c
                        FROM whatsapp_campaign_recipients
                        WHERE processing_status IN ('queued', 'processing');");
                    using var r = await db.Execute(cq);
                    if (await r.ReadAsync())
                        campaignQueued = Convert.ToInt64(r["c"]);
                }
                catch
                {
                    // ignore
                }

                try
                {
                    using var aq = db.GetCommand(@"
                        SELECT COUNT(*)::bigint AS c
                        FROM whatsapp_automation_executions
                        WHERE status IN ('pending', 'scheduled', 'queued', 'processing');");
                    using var r = await db.Execute(aq);
                    if (await r.ReadAsync())
                        automationPending = Convert.ToInt64(r["c"]);
                }
                catch
                {
                    // ignore
                }

                try
                {
                    using var oc = db.GetCommand(@"
                        SELECT outbound_enabled FROM whatsapp_outbound_control WHERE id = 1 LIMIT 1;");
                    using var r = await db.Execute(oc);
                    if (await r.ReadAsync() && r["outbound_enabled"] != DBNull.Value)
                        outboundEnabled = Convert.ToBoolean(r["outbound_enabled"]);
                }
                catch
                {
                    // ignore
                }

                var data = new Dictionary<string, object>
                {
                    ["webhook_pending"] = webhookPending,
                    ["campaign_recipients_active"] = campaignQueued,
                    ["automation_pending"] = automationPending,
                    ["outbound_enabled"] = outboundEnabled,
                };

                if (webhookPending > 5000)
                {
                    return HealthCheckResult.Degraded(
                        $"WhatsApp webhook backlog high ({webhookPending})",
                        data: data);
                }

                return HealthCheckResult.Healthy("WhatsApp CRM queues reachable", data);
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("WhatsApp CRM health check failed", ex);
            }
        }
    }
}
