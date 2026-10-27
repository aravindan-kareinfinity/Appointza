using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authenticate]
    public class OrganisationOnboardingController : ControllerBase
    {
        readonly ILogger<OrganisationOnboardingController> logger;
        readonly OrganisationOnboardingService onboardingService;
        readonly RequestState requeststate;

        public OrganisationOnboardingController(
            ILogger<OrganisationOnboardingController> logger,
            OrganisationOnboardingService onboardingService,
            RequestState requeststate)
        {
            this.logger = logger;
            this.onboardingService = onboardingService;
            this.requeststate = requeststate;
        }

        long ResolveOrganisationId()
        {
            return requeststate.usercontext?.organisationid ?? 0;
        }

        [HttpPost("GetStatus")]
        public async Task<ActionResult<ActionRes<OrganisationOnboardingState>>> GetStatus()
        {
            try
            {
                long organisationId = ResolveOrganisationId();
                if (organisationId <= 0)
                {
                    return Unauthorized(new ActionRes<OrganisationOnboardingState>
                    {
                        error = "Organisation context required.",
                    });
                }

                var state = await onboardingService.GetStatus(organisationId);
                return Ok(new ActionRes<OrganisationOnboardingState> { item = state });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationOnboarding GetStatus failed");
                return StatusCode(500, new ActionRes<OrganisationOnboardingState>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationOnboardingState>>> Save(
            ActionReq<OrganisationOnboardingSaveReq>? req)
        {
            try
            {
                long organisationId = ResolveOrganisationId();
                if (organisationId <= 0)
                {
                    return Unauthorized(new ActionRes<OrganisationOnboardingState>
                    {
                        error = "Organisation context required.",
                    });
                }

                var state = await onboardingService.Save(
                    organisationId,
                    req?.item ?? new OrganisationOnboardingSaveReq());
                return Ok(new ActionRes<OrganisationOnboardingState> { item = state });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationOnboarding Save failed");
                return StatusCode(500, new ActionRes<OrganisationOnboardingState>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("MarkOffering")]
        public async Task<ActionResult<ActionRes<OrganisationOnboardingState>>> MarkOffering(
            ActionReq<OrganisationOnboardingMarkOfferingReq>? req)
        {
            try
            {
                long organisationId = ResolveOrganisationId();
                if (organisationId <= 0)
                {
                    return Unauthorized(new ActionRes<OrganisationOnboardingState>
                    {
                        error = "Organisation context required.",
                    });
                }

                if (req?.item == null || string.IsNullOrWhiteSpace(req.item.offering))
                {
                    return BadRequest(new ActionRes<OrganisationOnboardingState>
                    {
                        error = "offering is required.",
                    });
                }

                var state = await onboardingService.MarkOffering(organisationId, req.item);
                return Ok(new ActionRes<OrganisationOnboardingState> { item = state });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationOnboarding MarkOffering failed");
                return StatusCode(500, new ActionRes<OrganisationOnboardingState>
                {
                    error = ex.Message,
                });
            }
        }

        [HttpPost("Complete")]
        public async Task<ActionResult<ActionRes<OrganisationOnboardingState>>> Complete()
        {
            try
            {
                long organisationId = ResolveOrganisationId();
                if (organisationId <= 0)
                {
                    return Unauthorized(new ActionRes<OrganisationOnboardingState>
                    {
                        error = "Organisation context required.",
                    });
                }

                var state = await onboardingService.Save(organisationId, new OrganisationOnboardingSaveReq
                {
                    is_complete = true,
                    current_step = OnboardingStepKeys.Complete,
                });
                return Ok(new ActionRes<OrganisationOnboardingState> { item = state });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "OrganisationOnboarding Complete failed");
                return StatusCode(500, new ActionRes<OrganisationOnboardingState>
                {
                    error = ex.Message,
                });
            }
        }
    }
}
