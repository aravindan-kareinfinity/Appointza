using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authenticate]
    public class OrganisationCommunicationIntegrationController : ControllerBase
    {
        private readonly OrganisationCommunicationIntegrationService _service;

        public OrganisationCommunicationIntegrationController(OrganisationCommunicationIntegrationService service)
        {
            _service = service;
        }

        /// <summary>
        /// List WhatsApp/email integrations for an organisation (no raw secrets).
        /// </summary>
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationIntegrationSafe>>>> Select(ActionReq<OrganisationIntegrationSelectReq> req)
        {
            var result = new ActionRes<List<OrganisationIntegrationSafe>>();
            result.item = await _service.Select(req.item ?? new OrganisationIntegrationSelectReq());
            return Ok(result);
        }

        /// <summary>
        /// Create or update WhatsApp Business connection. Access token is encrypted server-side.
        /// </summary>
        [HttpPost("UpsertWhatsApp")]
        public async Task<ActionResult<ActionRes<OrganisationIntegrationSafe>>> UpsertWhatsApp(ActionReq<WhatsAppIntegrationUpsertReq> req)
        {
            var result = new ActionRes<OrganisationIntegrationSafe>();
            try
            {
                result.item = await _service.UpsertWhatsApp(req.item ?? new WhatsAppIntegrationUpsertReq());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Create or update email connection. Tokens/passwords encrypted server-side; never returned.
        /// </summary>
        [HttpPost("UpsertEmail")]
        public async Task<ActionResult<ActionRes<OrganisationIntegrationSafe>>> UpsertEmail(ActionReq<EmailIntegrationUpsertReq> req)
        {
            var result = new ActionRes<OrganisationIntegrationSafe>();
            try
            {
                result.item = await _service.UpsertEmail(req.item ?? new EmailIntegrationUpsertReq());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("Disconnect")]
        public async Task<ActionResult<ActionRes<bool>>> Disconnect(ActionReq<OrganisationIntegrationDisconnectReq> req)
        {
            var result = new ActionRes<bool>();
            try
            {
                result.item = await _service.Disconnect(req.item ?? new OrganisationIntegrationDisconnectReq());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationIntegrationDisconnectReq> req)
        {
            var result = new ActionRes<bool>();
            try
            {
                result.item = await _service.Delete(req.item ?? new OrganisationIntegrationDisconnectReq());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
