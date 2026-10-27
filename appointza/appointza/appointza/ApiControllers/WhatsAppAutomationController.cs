using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/crm/whatsapp/automations")]
    [Authenticate]
    public class WhatsAppAutomationController : ControllerBase
    {
        private readonly WhatsAppAutomationService _service;

        public WhatsAppAutomationController(WhatsAppAutomationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ActionRes<List<WhatsAppAutomationRuleDto>>>> List(
            [FromQuery] string? search = null,
            [FromQuery] string? trigger_type = null,
            [FromQuery] bool? is_enabled = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var item = await _service.SelectRules(new WhatsAppAutomationSelectReq
                {
                    search = search ?? "",
                    trigger_type = trigger_type ?? "",
                    is_enabled = is_enabled,
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppAutomationRuleDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppAutomationRuleDto>>> Get(long id)
        {
            try
            {
                var item = await _service.GetRule(id);
                if (item == null) return NotFound(new { success = false, message = "Rule not found." });
                return Ok(new ActionRes<WhatsAppAutomationRuleDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ActionRes<WhatsAppAutomationRuleDto>>> Create(
            [FromBody] WhatsAppAutomationRuleUpsertReq? body)
        {
            try
            {
                var item = await _service.CreateRule(body ?? new WhatsAppAutomationRuleUpsertReq());
                return Ok(new ActionRes<WhatsAppAutomationRuleDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppAutomationRuleDto>>> Update(
            long id,
            [FromBody] WhatsAppAutomationRuleUpsertReq? body)
        {
            try
            {
                var req = body ?? new WhatsAppAutomationRuleUpsertReq();
                req.id = id;
                var item = await _service.UpdateRule(id, req);
                return Ok(new ActionRes<WhatsAppAutomationRuleDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/enable")]
        public async Task<ActionResult<ActionRes<WhatsAppAutomationRuleDto>>> Enable(
            long id,
            [FromQuery] int? expected_version = null)
        {
            try
            {
                var item = await _service.SetEnabled(id, true, expected_version);
                return Ok(new ActionRes<WhatsAppAutomationRuleDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/disable")]
        public async Task<ActionResult<ActionRes<WhatsAppAutomationRuleDto>>> Disable(
            long id,
            [FromQuery] int? expected_version = null)
        {
            try
            {
                var item = await _service.SetEnabled(id, false, expected_version);
                return Ok(new ActionRes<WhatsAppAutomationRuleDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}/executions")]
        public async Task<ActionResult<ActionRes<List<WhatsAppAutomationExecutionDto>>>> RuleExecutions(
            long id,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var (items, total) = await _service.SelectExecutions(new WhatsAppAutomationExecutionSelectReq
                {
                    automation_rule_id = id,
                    status = status ?? "",
                    search = search ?? "",
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppAutomationExecutionDto>>
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

        [HttpGet("~/api/crm/whatsapp/automation-executions/{id:long}")]
        public async Task<ActionResult<ActionRes<WhatsAppAutomationExecutionDto>>> GetExecution(long id)
        {
            try
            {
                var item = await _service.GetExecution(id);
                if (item == null) return NotFound(new { success = false, message = "Execution not found." });
                return Ok(new ActionRes<WhatsAppAutomationExecutionDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("~/api/crm/whatsapp/automation-executions")]
        public async Task<ActionResult<ActionRes<List<WhatsAppAutomationExecutionDto>>>> ListExecutions(
            [FromQuery] long? automation_rule_id = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var (items, total) = await _service.SelectExecutions(new WhatsAppAutomationExecutionSelectReq
                {
                    automation_rule_id = automation_rule_id,
                    status = status ?? "",
                    search = search ?? "",
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<WhatsAppAutomationExecutionDto>>
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
    }
}
