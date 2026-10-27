using appointza.Hubs;
using appointza.Models;
using Microsoft.AspNetCore.SignalR;

namespace appointza.Services
{
    /// <summary>
    /// Publishes WhatsApp CRM events only to the authenticated organisation's SignalR group.
    /// Payloads never include access tokens or secrets.
    /// </summary>
    public class WhatsAppCrmRealtimePublisher
    {
        private readonly IHubContext<WhatsAppCrmHub> _hub;
        private readonly ILogger<WhatsAppCrmRealtimePublisher> _logger;

        public WhatsAppCrmRealtimePublisher(
            IHubContext<WhatsAppCrmHub> hub,
            ILogger<WhatsAppCrmRealtimePublisher> logger)
        {
            _hub = hub;
            _logger = logger;
        }

        public async Task PublishConversationUpdated(WhatsAppConversationDto conversation)
        {
            if (conversation == null || conversation.organisation_id <= 0) return;
            try
            {
                await _hub.Clients
                    .Group(WhatsAppCrmHub.OrgGroup(conversation.organisation_id))
                    .SendAsync(WhatsAppCrmHubEvents.ConversationUpdated, conversation);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish conversationUpdated for org {OrgId}", conversation.organisation_id);
            }
        }

        public async Task PublishMessageUpserted(WhatsAppMessageDto message, WhatsAppConversationDto? conversation = null)
        {
            if (message == null || message.organisation_id <= 0) return;
            try
            {
                var group = WhatsAppCrmHub.OrgGroup(message.organisation_id);
                await _hub.Clients.Group(group).SendAsync(WhatsAppCrmHubEvents.MessageUpserted, new
                {
                    message,
                    conversation,
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish messageUpserted for org {OrgId}", message.organisation_id);
            }
        }

        public async Task PublishMessageStatusChanged(WhatsAppMessageDto message)
        {
            if (message == null || message.organisation_id <= 0) return;
            try
            {
                await _hub.Clients
                    .Group(WhatsAppCrmHub.OrgGroup(message.organisation_id))
                    .SendAsync(WhatsAppCrmHubEvents.MessageStatusChanged, message);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish messageStatusChanged for org {OrgId}", message.organisation_id);
            }
        }
    }
}
