using appointza.Models;
using Microsoft.Extensions.DependencyInjection;

namespace appointza.Services
{
    /// <summary>
    /// Fire-and-forget safe publisher for domain services. Failures never roll back business commits.
    /// </summary>
    public class WhatsAppAutomationPublisher
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WhatsAppAutomationPublisher> _logger;

        public WhatsAppAutomationPublisher(
            IServiceScopeFactory scopeFactory,
            ILogger<WhatsAppAutomationPublisher> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public void Enqueue(WhatsAppAutomationBusinessEvent evt)
        {
            if (evt.organisation_id <= 0 || string.IsNullOrWhiteSpace(evt.trigger_type)) return;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<WhatsAppAutomationService>();
                    await service.EnqueueBusinessEventAsync(evt);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Automation enqueue failed for {Trigger} org={Org} entity={Type}/{Id}",
                        evt.trigger_type, evt.organisation_id, evt.business_entity_type, evt.business_entity_id);
                }
            });
        }

        public void InvalidatePending(long organisationId, string entityType, long entityId)
        {
            if (organisationId <= 0 || entityId <= 0) return;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<WhatsAppAutomationService>();
                    await service.InvalidatePendingForEntityAsync(organisationId, entityType, entityId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Automation invalidate failed for org={Org} entity={Type}/{Id}",
                        organisationId, entityType, entityId);
                }
            });
        }
    }
}
