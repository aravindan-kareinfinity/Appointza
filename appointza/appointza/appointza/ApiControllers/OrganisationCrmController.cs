using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authenticate]
    public class OrganisationCrmController : ControllerBase
    {
        private readonly OrganisationCrmCatalogueService _service;

        public OrganisationCrmController(OrganisationCrmCatalogueService service)
        {
            _service = service;
        }

        /// <summary>
        /// Read-only CRM catalogue: organisation, locations, services, events, rooms.
        /// </summary>
        [HttpPost("GetCatalogueOverview")]
        public async Task<ActionResult<ActionRes<OrganisationCrmCatalogueOverview>>> GetCatalogueOverview(
            ActionReq<OrganisationCrmCatalogueSelectReq> req)
        {
            var result = new ActionRes<OrganisationCrmCatalogueOverview>();
            try
            {
                result.item = await _service.GetOverview(req.item ?? new OrganisationCrmCatalogueSelectReq());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
