using appointza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    /// <summary>
    /// Shared Meta WhatsApp webhook for all organisations.
    /// Resolves tenant from metadata.phone_number_id — never from client OrgId.
    /// Processing is durable via whatsapp_webhook_events + WhatsAppWebhookWorker.
    /// </summary>
    [ApiController]
    [AllowAnonymous]
    // Primary path + short alias (both hit the same handler).
    [Route("api/webhooks/whatsapp")]
    [Route("webhooks/whatsapp")]
    public class WhatsAppWebhookController : ControllerBase
    {
        private readonly WhatsAppCrmService _crmService;
        private readonly ILogger<WhatsAppWebhookController> _logger;

        public WhatsAppWebhookController(
            WhatsAppCrmService crmService,
            ILogger<WhatsAppWebhookController> logger)
        {
            _crmService = crmService;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Verify(
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.verify_token")] string? verifyToken,
            [FromQuery(Name = "hub.challenge")] string? challenge)
        {
            var expected = _crmService.GetWebhookVerifyToken();
            if (string.IsNullOrEmpty(expected))
            {
                _logger.LogError("whatsapp.verify_token is not configured.");
                return Unauthorized();
            }

            if (string.Equals(mode, "subscribe", StringComparison.OrdinalIgnoreCase) &&
                WhatsAppWebhookSecurity.FixedTimeEqualsUtf8(verifyToken, expected) &&
                !string.IsNullOrEmpty(challenge))
            {
                _logger.LogInformation("WhatsApp webhook verification succeeded");
                return Content(challenge, "text/plain");
            }

            _logger.LogWarning("WhatsApp webhook verification failed");
            return Unauthorized();
        }

        [HttpPost]
        public async Task<IActionResult> Receive()
        {
            // Read exact raw body before any JSON re-serialization — required for signature validation.
            Request.EnableBuffering();
            string rawBody;
            using (var reader = new StreamReader(Request.Body, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            var signature = Request.Headers["X-Hub-Signature-256"].FirstOrDefault();

            try
            {
                var eventId = await _crmService.AcceptWebhookEvent(rawBody, signature);
                _logger.LogInformation("WhatsApp webhook accepted event {EventId}", eventId);
                return Ok();
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("WhatsApp webhook rejected: invalid signature");
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WhatsApp webhook durable acceptance failed");
                return StatusCode(500);
            }
        }
    }
}
