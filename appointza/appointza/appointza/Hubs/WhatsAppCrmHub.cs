using appointza.Authentication.Services;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.SignalR;

namespace appointza.Hubs
{
    /// <summary>
    /// Tenant-scoped WhatsApp CRM inbox hub.
    /// Clients join only the organisation group derived from their JWT — never from a client-supplied OrgId.
    /// </summary>
    public class WhatsAppCrmHub : Hub
    {
        public const string HubPath = "/hubs/whatsapp-crm";
        public const string OrgGroupPrefix = "wa-org:";

        private readonly AuthService _authService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WhatsAppCrmHub> _logger;

        public WhatsAppCrmHub(
            AuthService authService,
            IServiceScopeFactory scopeFactory,
            ILogger<WhatsAppCrmHub> logger)
        {
            _authService = authService;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public static string OrgGroup(long organisationId) => $"{OrgGroupPrefix}{organisationId}";

        public override async Task OnConnectedAsync()
        {
            var user = ResolveUser();
            if (user == null || user.organisationid <= 0)
            {
                _logger.LogWarning("WhatsApp CRM hub rejected unauthenticated or org-less connection {ConnectionId}", Context.ConnectionId);
                Context.Abort();
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, OrgGroup(user.organisationid));
            _logger.LogInformation(
                "WhatsApp CRM hub connected user {UserId} org {OrganisationId}",
                user.userid,
                user.organisationid);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Optional conversation-scoped subscription. JWT org membership and conversation ownership are required.
        /// </summary>
        public async Task SubscribeConversation(long conversationId)
        {
            var user = ResolveUser();
            if (user == null || user.organisationid <= 0 || conversationId <= 0)
            {
                throw new HubException("Unauthorized");
            }

            using var scope = _scopeFactory.CreateScope();
            var crm = scope.ServiceProvider.GetRequiredService<WhatsAppCrmService>();
            var owned = await crm.ConversationBelongsToOrganisation(conversationId, user.organisationid);
            if (!owned)
            {
                _logger.LogWarning(
                    "WhatsApp hub blocked cross-tenant conversation subscribe org={OrganisationId} conversation={ConversationId}",
                    user.organisationid,
                    conversationId);
                throw new HubException("Conversation not found.");
            }

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                ConversationGroup(user.organisationid, conversationId));
        }

        public async Task UnsubscribeConversation(long conversationId)
        {
            var user = ResolveUser();
            if (user == null || user.organisationid <= 0 || conversationId <= 0)
            {
                return;
            }

            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                ConversationGroup(user.organisationid, conversationId));
        }

        public static string ConversationGroup(long organisationId, long conversationId) =>
            $"{OrgGroupPrefix}{organisationId}:conv:{conversationId}";

        private UsersContext? ResolveUser()
        {
            var http = Context.GetHttpContext();
            if (http == null) return null;

            if (http.Items["usercontext"] is UsersContext existing && existing.organisationid > 0)
            {
                return existing;
            }

            var token = ExtractAccessToken(http);
            if (string.IsNullOrWhiteSpace(token)) return null;

            try
            {
                var ctx = _authService.JwtTokenToUserContext(token);
                if (ctx != null && ctx.organisationid > 0)
                {
                    http.Items["usercontext"] = ctx;
                    return ctx;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "WhatsApp CRM hub JWT parse failed");
            }

            return null;
        }

        private static string? ExtractAccessToken(HttpContext http)
        {
            var header = http.Request.Headers.Authorization.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(header) &&
                header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return header["Bearer ".Length..].Trim();
            }

            // Browser WebSocket clients pass the token on the negotiate/connect query string.
            var query = http.Request.Query["access_token"].FirstOrDefault();
            return string.IsNullOrWhiteSpace(query) ? null : query.Trim();
        }
    }

    public static class WhatsAppCrmHubEvents
    {
        public const string ConversationUpdated = "conversationUpdated";
        public const string MessageUpserted = "messageUpserted";
        public const string MessageStatusChanged = "messageStatusChanged";
    }
}
