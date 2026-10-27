using appointza.Utils;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    /// <summary>
    /// Polls durable whatsapp_webhook_events and processes them with bounded retries.
    /// Webhook HTTP handler only persists + returns 200; this worker owns processing.
    /// </summary>
    public class WhatsAppWebhookWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WhatsAppWebhookWorker> _logger;
        private readonly WhatsAppWebhookWorkerOptions _options;

        public WhatsAppWebhookWorker(
            IServiceScopeFactory scopeFactory,
            IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppWebhookWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = settings.Value.whatsapp?.webhook_worker ?? new WhatsAppWebhookWorkerOptions();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var pollMs = Math.Max(1000, _options.poll_interval_ms <= 0 ? 3000 : _options.poll_interval_ms);
            var batch = Math.Clamp(_options.batch_size <= 0 ? 10 : _options.batch_size, 1, 50);
            var maxRetries = Math.Clamp(_options.max_retries <= 0 ? 5 : _options.max_retries, 1, 20);

            _logger.LogInformation(
                "WhatsApp webhook worker started (poll={PollMs}ms, batch={Batch}, maxRetries={MaxRetries})",
                pollMs,
                batch,
                maxRetries);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var crm = scope.ServiceProvider.GetRequiredService<WhatsAppCrmService>();
                    var claimed = await crm.ClaimWebhookEventsAsync(batch, maxRetries, stoppingToken);
                    foreach (var eventId in claimed)
                    {
                        if (stoppingToken.IsCancellationRequested) break;
                        try
                        {
                            await crm.ProcessWebhookEvent(eventId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "WhatsApp webhook worker failed event {EventId}", eventId);
                        }
                    }
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "WhatsApp webhook worker loop error");
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
