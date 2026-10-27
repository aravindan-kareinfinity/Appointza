using appointza.Utils;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    /// <summary>
    /// Durable campaign dispatch worker. Claims campaigns/recipients via SKIP LOCKED leases.
    /// </summary>
    public class WhatsAppCampaignWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WhatsAppCampaignWorker> _logger;
        private readonly WhatsAppCampaignWorkerOptions _options;

        public WhatsAppCampaignWorker(
            IServiceScopeFactory scopeFactory,
            IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppCampaignWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = settings.Value.whatsapp?.campaign_worker ?? new WhatsAppCampaignWorkerOptions();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var pollMs = Math.Max(1000, _options.poll_interval_ms <= 0 ? 4000 : _options.poll_interval_ms);
            _logger.LogInformation(
                "WhatsApp campaign worker started (poll={PollMs}ms, recipientBatch={Batch}, maxAttempts={Max})",
                pollMs,
                _options.recipient_batch_size,
                _options.max_attempts);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dispatch = scope.ServiceProvider.GetRequiredService<WhatsAppCampaignDispatchService>();
                    await dispatch.ProcessDispatchCycleAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "WhatsApp campaign worker loop error");
                }

                try
                {
                    await Task.Delay(pollMs, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }
}
