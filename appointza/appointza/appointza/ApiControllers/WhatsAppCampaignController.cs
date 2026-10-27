using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    /// <summary>
    /// WhatsApp campaign builder (Phase 5) and durable dispatch / reporting (Phase 6).
    /// </summary>
    [ApiController]
    [Route("api/crm/whatsapp/campaigns")]
    [Authenticate]
    public class WhatsAppCampaignController : ControllerBase
    {
        private readonly WhatsAppCampaignService _service;
        private readonly WhatsAppCampaignDispatchService _dispatch;

        public WhatsAppCampaignController(
            WhatsAppCampaignService service,
            WhatsAppCampaignDispatchService dispatch)
        {
            _service = service;
            _dispatch = dispatch;
        }

        [HttpGet]
        public async Task<ActionResult<ActionRes<List<WhatsAppCampaignDto>>>> List(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var item = await _service.Select(new WhatsAppCampaignSelectReq
                {
                    search = search ?? "",
                    status = status ?? "",
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppCampaignDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Get(long id)
        {
            try
            {
                var item = await _service.GetById(id);
                if (item == null) return NotFound(new { success = false, message = "Campaign not found." });
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Create([FromBody] WhatsAppCampaignUpsertReq? body)
        {
            try
            {
                var item = await _service.Create(body ?? new WhatsAppCampaignUpsertReq());
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Update(
            long id,
            [FromBody] WhatsAppCampaignUpsertReq? body)
        {
            try
            {
                var req = body ?? new WhatsAppCampaignUpsertReq();
                req.id = id;
                var item = await _service.Update(id, req);
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("audience/preview")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignAudiencePreviewResult>>> AudiencePreview(
            [FromBody] WhatsAppCampaignAudiencePreviewReq? body)
        {
            try
            {
                var item = await _service.PreviewAudience(body ?? new WhatsAppCampaignAudiencePreviewReq());
                return Ok(new ActionRes<WhatsAppCampaignAudiencePreviewResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/validate")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignValidateResult>>> Validate(long id)
        {
            try
            {
                var item = await _service.Validate(id);
                return Ok(new ActionRes<WhatsAppCampaignValidateResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/preview")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignPreviewResult>>> Preview(
            long id,
            [FromBody] WhatsAppCampaignPreviewReq? body)
        {
            try
            {
                var item = await _service.PreviewMessages(id, body ?? new WhatsAppCampaignPreviewReq());
                return Ok(new ActionRes<WhatsAppCampaignPreviewResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/schedule")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Schedule(
            long id,
            [FromBody] WhatsAppCampaignScheduleReq? body)
        {
            try
            {
                var item = await _service.Schedule(id, body ?? new WhatsAppCampaignScheduleReq());
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/send")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Send(
            long id,
            [FromQuery] int? expected_version = null)
        {
            try
            {
                var item = await _dispatch.QueueForDispatch(id, expected_version);
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/pause")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Pause(
            long id,
            [FromQuery] int? expected_version = null)
        {
            try
            {
                var item = await _dispatch.Pause(id, expected_version);
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/resume")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Resume(
            long id,
            [FromQuery] int? expected_version = null)
        {
            try
            {
                var item = await _dispatch.Resume(id, expected_version);
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/cancel")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignDto>>> Cancel(
            long id,
            [FromQuery] int? expected_version = null)
        {
            try
            {
                var item = await _dispatch.Cancel(id, expected_version);
                return Ok(new ActionRes<WhatsAppCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}/report")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignReportDto>>> Report(long id)
        {
            try
            {
                var item = await _dispatch.GetReport(id);
                return Ok(new ActionRes<WhatsAppCampaignReportDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}/recipients")]
        public async Task<ActionResult<ActionRes<List<WhatsAppCampaignRecipientDto>>>> Recipients(
            long id,
            [FromQuery] string? processing_status = null,
            [FromQuery] string? search = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var (items, total) = await _dispatch.ListRecipients(new WhatsAppCampaignRecipientSelectReq
                {
                    campaign_id = id,
                    processing_status = processing_status ?? "",
                    search = search ?? "",
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppCampaignRecipientDto>>
                {
                    item = items,
                    resultCount = total,
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/recipients/{recipientId:long}/retry")]
        public async Task<ActionResult<ActionRes<WhatsAppCampaignRecipientDto>>> RetryRecipient(
            long id,
            long recipientId)
        {
            try
            {
                var item = await _dispatch.RetryRecipient(id, recipientId);
                return Ok(new ActionRes<WhatsAppCampaignRecipientDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
