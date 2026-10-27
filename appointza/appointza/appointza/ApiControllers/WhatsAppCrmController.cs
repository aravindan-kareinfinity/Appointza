using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    /// <summary>
    /// Organization-scoped WhatsApp CRM APIs (Phase 2).
    /// Ownership is always enforced server-side via authenticated organisation_id.
    /// </summary>
    [ApiController]
    [Route("api/crm/whatsapp")]
    [Authenticate]
    public class WhatsAppCrmController : ControllerBase
    {
        private readonly WhatsAppCrmService _service;

        public WhatsAppCrmController(WhatsAppCrmService service)
        {
            _service = service;
        }

        /// <summary>Webhook callback path + verify token for Meta Configuration (org admins).</summary>
        [HttpGet("webhook-setup")]
        public ActionResult<ActionRes<WhatsAppWebhookSetupDto>> GetWebhookSetup()
        {
            try
            {
                return Ok(new ActionRes<WhatsAppWebhookSetupDto> { item = _service.GetWebhookSetup() });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("conversations")]
        public async Task<ActionResult<ActionRes<List<WhatsAppConversationDto>>>> ListConversations(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] bool unread_only = false,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var item = await _service.SelectConversations(new WhatsAppConversationSelectReq
                {
                    search = search ?? "",
                    status = status ?? "",
                    unread_only = unread_only,
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppConversationDto>> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("messaging-contacts")]
        public async Task<ActionResult<ActionRes<List<WhatsAppMessagingContactDto>>>> ListMessagingContacts(
            [FromQuery] string? search = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var item = await _service.SelectMessagingContacts(new WhatsAppMessagingContactSelectReq
                {
                    search = search ?? "",
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppMessagingContactDto>> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("conversations/ensure")]
        public async Task<ActionResult<ActionRes<WhatsAppConversationDto>>> EnsureConversation(
            [FromBody] WhatsAppEnsureConversationReq? body)
        {
            try
            {
                var req = body ?? new WhatsAppEnsureConversationReq();
                req.organisation_id = 0;
                var item = await _service.EnsureConversation(req);
                return Ok(new ActionRes<WhatsAppConversationDto> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("conversations/{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppConversationDto>>> GetConversation(long id)
        {
            try
            {
                var item = await _service.GetConversationById(id);
                if (item == null)
                {
                    return NotFound(new { success = false, message = "Conversation not found." });
                }
                return Ok(new ActionRes<WhatsAppConversationDto> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("conversations/{id:long}/messages")]
        public async Task<ActionResult<ActionRes<List<WhatsAppMessageDto>>>> ListMessages(
            long id,
            [FromQuery] int limit = 100)
        {
            try
            {
                var item = await _service.SelectMessages(new WhatsAppMessageSelectReq
                {
                    conversation_id = id,
                    limit = limit,
                });
                return Ok(new ActionRes<List<WhatsAppMessageDto>> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("conversations/{id:long}/messages/template")]
        public async Task<ActionResult<ActionRes<WhatsAppMessageDto>>> SendTemplateMessage(
            long id,
            [FromBody] WhatsAppSendTemplateReq? body)
        {
            try
            {
                var req = body ?? new WhatsAppSendTemplateReq();
                req.conversation_id = id;
                req.organisation_id = 0;
                var item = await _service.SendTemplate(req);
                return Ok(new ActionRes<WhatsAppMessageDto> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("conversations/{id:long}/messages")]
        public async Task<ActionResult<ActionRes<WhatsAppMessageDto>>> SendMessage(
            long id,
            [FromBody] WhatsAppSendTextReq? body)
        {
            try
            {
                var req = body ?? new WhatsAppSendTextReq();
                req.conversation_id = id;
                // organisation_id / connection / credentials resolved server-side only
                req.organisation_id = 0;
                var item = await _service.SendText(req);
                return Ok(new ActionRes<WhatsAppMessageDto> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPatch("conversations/{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppConversationDto>>> PatchConversation(
            long id,
            [FromBody] WhatsAppConversationPatchReq? body)
        {
            try
            {
                var req = body ?? new WhatsAppConversationPatchReq();
                req.conversation_id = id;
                req.organisation_id = 0;
                var item = await _service.PatchConversation(req);
                return Ok(new ActionRes<WhatsAppConversationDto> { item = item });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
