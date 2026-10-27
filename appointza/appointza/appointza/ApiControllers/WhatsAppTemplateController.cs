using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    /// <summary>
    /// Organization-scoped WhatsApp message template management (Phase 4).
    /// Credentials and WABA ownership are resolved server-side only.
    /// </summary>
    [ApiController]
    [Route("api/crm/whatsapp/templates")]
    [Authenticate]
    public class WhatsAppTemplateController : ControllerBase
    {
        private readonly WhatsAppTemplateService _service;

        public WhatsAppTemplateController(WhatsAppTemplateService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ActionRes<List<WhatsAppTemplateDto>>>> List(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] string? category = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0,
            [FromQuery] bool include_archived = false)
        {
            try
            {
                var item = await _service.Select(new WhatsAppTemplateSelectReq
                {
                    search = search ?? "",
                    status = status ?? "",
                    category = category ?? "",
                    limit = limit,
                    offset = offset,
                    include_archived = include_archived,
                });
                return Ok(new ActionRes<List<WhatsAppTemplateDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppTemplateDto>>> Get(long id)
        {
            try
            {
                var item = await _service.GetById(id);
                if (item == null)
                {
                    return NotFound(new { success = false, message = "Template not found." });
                }
                return Ok(new ActionRes<WhatsAppTemplateDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("sync")]
        public async Task<ActionResult<ActionRes<WhatsAppTemplateSyncResult>>> Sync(
            [FromQuery] long whatsapp_connection_id = 0)
        {
            try
            {
                var item = await _service.Sync(whatsapp_connection_id);
                return Ok(new ActionRes<WhatsAppTemplateSyncResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ActionRes<WhatsAppTemplateDto>>> Create(
            [FromBody] WhatsAppTemplateCreateReq? body)
        {
            try
            {
                var item = await _service.Create(body ?? new WhatsAppTemplateCreateReq());
                return Ok(new ActionRes<WhatsAppTemplateDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/submit")]
        public async Task<ActionResult<ActionRes<WhatsAppTemplateDto>>> Submit(long id)
        {
            try
            {
                var item = await _service.Submit(id);
                return Ok(new ActionRes<WhatsAppTemplateDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/refresh-status")]
        public async Task<ActionResult<ActionRes<WhatsAppTemplateDto>>> RefreshStatus(long id)
        {
            try
            {
                var item = await _service.RefreshStatus(id);
                return Ok(new ActionRes<WhatsAppTemplateDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
