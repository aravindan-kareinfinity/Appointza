using appointza.Utils;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    /// <summary>
    /// Global outbound kill-switch for WhatsApp Cloud API sends (config + DB).
    /// Pausing does not delete pending campaign/automation jobs.
    /// </summary>
    public class WhatsAppOutboundGuard
    {
        private readonly IDbProvider _dbProvider;
        private readonly ApplicationEnvironmentWhatsAppConfigData _whatsapp;
        private readonly ILogger<WhatsAppOutboundGuard> _logger;
        private DateTime _cacheUntilUtc = DateTime.MinValue;
        private bool _cachedEnabled = true;

        public WhatsAppOutboundGuard(
            IDbProvider dbProvider,
            IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppOutboundGuard> logger)
        {
            _dbProvider = dbProvider;
            _whatsapp = settings.Value.whatsapp ?? new ApplicationEnvironmentWhatsAppConfigData();
            _logger = logger;
        }

        public async Task EnsureOutboundAllowedAsync(CancellationToken cancellationToken = default)
        {
            if (!await IsOutboundEnabledAsync(cancellationToken))
            {
                throw new InvalidOperationException(
                    "WhatsApp outbound messaging is paused by an administrator.");
            }
        }

        public async Task<bool> IsOutboundEnabledAsync(CancellationToken cancellationToken = default)
        {
            if (!_whatsapp.outbound_enabled)
            {
                return false;
            }

            if (DateTime.UtcNow < _cacheUntilUtc)
            {
                return _cachedEnabled;
            }

            try
            {
                using var db = await _dbProvider.GetDb();
                await db.Connect();
                using var command = db.GetCommand(@"
                    SELECT outbound_enabled
                    FROM whatsapp_outbound_control
                    WHERE id = 1
                    LIMIT 1;");
                using var reader = await db.Execute(command);
                if (await reader.ReadAsync())
                {
                    _cachedEnabled = reader["outbound_enabled"] == DBNull.Value ||
                                     Convert.ToBoolean(reader["outbound_enabled"]);
                }
                else
                {
                    _cachedEnabled = true;
                }
            }
            catch (Exception ex)
            {
                // Table may not exist until Phase 8 migration; fail open only if config allows.
                _logger.LogDebug(ex, "whatsapp_outbound_control unavailable; using config flag only");
                _cachedEnabled = true;
            }

            _cacheUntilUtc = DateTime.UtcNow.AddSeconds(5);
            return _cachedEnabled;
        }
    }
}
