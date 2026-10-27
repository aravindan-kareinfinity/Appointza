using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using appointza.Utils;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationController : ControllerBase
    {
        ILogger<OrganisationController> logger;
        OrganisationService organisationService;
        OrganisationReferralService organisationReferralService;
        RequestState requeststate;

        public OrganisationController(
            ILogger<OrganisationController> logger,
            OrganisationService organisationService,
            OrganisationReferralService organisationReferralService,
            RequestState requeststate)
        {
            this.logger = logger;
            this.organisationService = organisationService;
            this.organisationReferralService = organisationReferralService;
            this.requeststate = requeststate;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Organisation>>> Entity()
        {
            ActionRes<Organisation> result = new ActionRes<Organisation>()
            {
               item = new Organisation()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Organisation>>>> Select(ActionReq<OrganisationSelectReq> req)
        {
            try
            {
                ActionRes<List<Organisation>> result = new ActionRes<List<Organisation>>();

                result.item = await organisationService.Select(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Organisation Select endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<List<Organisation>> 
                { 
                    item = new List<Organisation>(),
                    error = $"Error: {ex.Message}"
                });
            }
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Organisation>>> Insert(ActionReq<Organisation> req)
        {
            try
            {
                ActionRes<Organisation> result = new ActionRes<Organisation>();

                result.item = await organisationService.Insert(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Organisation Insert endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<Organisation> 
                { 
                    item = null,
                    error = $"Error: {ex.Message}"
                });
            }
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Organisation>>> Update(ActionReq<Organisation> req)
        {
            try
            {
                ActionRes<Organisation> result = new ActionRes<Organisation>();

                result.item = await organisationService.Update(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Organisation Update endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<Organisation> 
                { 
                    item = null,
                    error = $"Error: {ex.Message}"
                });
            }
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Organisation>>> Save(ActionReq<Organisation> req)
        {
            try
            {
                ActionRes<Organisation> result = new ActionRes<Organisation>();

                if(req.item.id > 0){
                    result.item = await organisationService.Update(req.item);
                }else{
                    result.item = await organisationService.Insert(req.item);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Organisation Save endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<Organisation> 
                { 
                    item = null,
                    error = $"Error: {ex.Message}"
                });
            }
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationDeleteReq> req)
        {
            try
            {
                ActionRes<bool> result = new ActionRes<bool>();

                result.item = await organisationService.Delete(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Organisation Delete endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<bool> 
                { 
                    item = false,
                    error = $"Error: {ex.Message}"
                });
            }
        }

        [HttpPost("SelectOrganisationDetail")]
        public async Task<ActionResult<ActionRes<List<OrganisationDetail>>>> SelectOrganisationDetail(ActionReq<OrganisationSelectReq> req)
        {
            try
            {
                ActionRes<List<OrganisationDetail>> result = new ActionRes<List<OrganisationDetail>>();

                result.item = await organisationService.SelectOrganisationDetail(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in SelectOrganisationDetail endpoint: {Message}\n{StackTrace}", ex.Message, ex.StackTrace);
                return StatusCode(500, new ActionRes<List<OrganisationDetail>> 
                { 
                    item = new List<OrganisationDetail>(),
                    error = $"Error: {ex.Message}"
                });
            }
        }

        [HttpPost("GetOrganisationByCustomUrl")]
        public async Task<ActionResult<dynamic>> GetOrganisationByCustomUrl([FromBody] CustomUrlReq req)
        {
            try
            {
                logger.LogInformation($"🔍 Getting organisation by custom URL slug: {req.customUrl}");

                var organisationDetail = await organisationService.GetOrganisationByCustomUrl(req.customUrl);

                if (organisationDetail == null)
                {
                    logger.LogWarning("⚠️ Organisation not found for custom URL slug");
                    return NotFound(new { error = "Organisation not found" });
                }

                logger.LogInformation($"✅ Found organisation: {organisationDetail.organisationname} (ID: {organisationDetail.organisationid})");

                return Ok(new
                {
                    organisationid = organisationDetail.organisationid,
                    organisationname = organisationDetail.organisationname,
                    organisationlocationid = organisationDetail.organisationlocationid
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting organisation by custom URL");
                return BadRequest(new { error = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("GetReferral")]
        public async Task<ActionResult<ActionRes<OrganisationReferralInfoRes>>> GetReferral(
            ActionReq<OrganisationReferralSelectReq>? req)
        {
            try
            {
                long organisationId = req?.item?.organisation_id ?? 0;
                if (organisationId <= 0)
                {
                    organisationId = requeststate.usercontext?.organisationid ?? 0;
                }

                if (organisationId <= 0)
                {
                    return BadRequest(new ActionRes<OrganisationReferralInfoRes>
                    {
                        error = "organisation_id is required",
                    });
                }

                var info = await organisationReferralService.GetReferralInfo(organisationId);
                return Ok(new ActionRes<OrganisationReferralInfoRes> { item = info });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetReferral failed");
                return StatusCode(500, new ActionRes<OrganisationReferralInfoRes>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("VerifyReferral")]
        public async Task<ActionResult<ActionRes<OrganisationReferralVerifyRes>>> VerifyReferral(
            ActionReq<OrganisationReferralVerifyReq>? req)
        {
            try
            {
                var result = await organisationReferralService.VerifyReferralCode(req?.item?.referral_code);
                return Ok(new ActionRes<OrganisationReferralVerifyRes> { item = result });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "VerifyReferral failed");
                return StatusCode(500, new ActionRes<OrganisationReferralVerifyRes>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("ApplyReferral")]
        public async Task<ActionResult<ActionRes<OrganisationReferralApplyRes>>> ApplyReferral(
            ActionReq<OrganisationReferralApplyReq>? req)
        {
            try
            {
                long organisationId = req?.item?.organisation_id ?? 0;
                if (organisationId <= 0)
                {
                    organisationId = requeststate.usercontext?.organisationid ?? 0;
                }

                if (organisationId <= 0)
                {
                    return BadRequest(new ActionRes<OrganisationReferralApplyRes>
                    {
                        error = "organisation_id is required",
                    });
                }

                var result = await organisationReferralService.ApplyReferralCode(
                    organisationId,
                    req?.item?.referral_code);
                return Ok(new ActionRes<OrganisationReferralApplyRes> { item = result });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ApplyReferral failed");
                return StatusCode(500, new ActionRes<OrganisationReferralApplyRes>
                {
                    error = ex.Message,
                });
            }
        }

    }
}
