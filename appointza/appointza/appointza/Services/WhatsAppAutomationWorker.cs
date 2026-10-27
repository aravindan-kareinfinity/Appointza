using appointza.Utils;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    public class WhatsAppAutomationWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WhatsAppAutomationWorker> _logger;
        private readonly WhatsAppAutomationWorkerOptions _options;

        public WhatsAppAutomationWorker(
            IServiceScopeFactory scopeFactory,
            IOptions<ApplicationEnvironment> settings,
            ILogger<WhatsAppAutomationWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = settings.Value.whatsapp?.automation_worker ?? new WhatsAppAutomationWorkerOptions();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var pollMs = Math.Max(1000, _options.poll_interval_ms <= 0 ? 5000 : _options.poll_interval_ms);
            _logger.LogInformation(
                "WhatsApp automation worker started (poll={PollMs}ms, batch={Batch})",
                pollMs,
                _options.batch_size);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<WhatsAppAutomationService>();
                    await service.ProcessCycleAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "WhatsApp automation worker loop error");
                }

                try { await Task.Delay(pollMs, stoppingToken); }
                catch (OperationCanceledException) { break; }
            }
        }
    }
}
