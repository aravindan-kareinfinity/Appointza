using appointza.Models;
using appointza.Authentication.Services;
using appointza.Authentication.Models;
using appointza.Authentication.Utils;
using appointza.Utils;
using appointza.Models.Campusza;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using AppException = appointza.Utils.AppException;

namespace appointza.Authentication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> logger;
        private readonly AuthService authService;
        private readonly CampuszaAuthService campuszaAuthService;
        private readonly RequestState requestState;

        public AuthController(
            ILogger<AuthController> logger,
            AuthService authService,
            CampuszaAuthService campuszaAuthService,
            RequestState requestState)
        {
            this.logger = logger;
            this.authService = authService;
            this.campuszaAuthService = campuszaAuthService;
            this.requestState = requestState;
        }

        [HttpPost("Register")]
        public async Task<ActionResult<ActionRes<UsersContext>>> Register(ActionReq<RegisterRequest> req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                result.item = await authService.Register(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during registration");
                return BadRequest(new { error = ex.Message, message = "Registration failed" });
            }
            return Ok(result);
        }

        [HttpPost("GetOtp")]
        public async Task<ActionResult<ActionRes<GetOtpResponse>>> GetOtp([FromBody] ActionReq<GetOtpRequest> req)
        {
            ActionRes<GetOtpResponse> result = new ActionRes<GetOtpResponse>();
            try
            {
                if (req?.item == null)
                {
                    return BadRequest(new { error = "Mobile number is required.", message = "Failed to get OTP" });
                }
                result.item = await authService.GetOtp(req.item);
            }
            catch (AppException ex)
            {
                logger.LogWarning(ex, "GetOtp rejected: {Code}", ex.code);
                return BadRequest(new { error = ex.Message, key = ex.key, message = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting OTP");
                return BadRequest(new { error = ex.Message, message = "Failed to get OTP" });
            }
            return Ok(result);
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ActionRes<UsersContext>>> Login(ActionReq<LoginRequest> req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                result.item = await authService.Login(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during login");
                return BadRequest(new { error = ex.Message, message = "Login failed" });
            }
            return Ok(result);
        }

        /// <summary>Campusza email/password login — product auth via the central Auth API.</summary>
        [HttpPost("CampuszaLogin")]
        public async Task<ActionResult<ActionRes<CampuszaAuthRes>>> CampuszaLogin(ActionReq<UserLoginReq> req)
        {
            ActionRes<CampuszaAuthRes> result = new ActionRes<CampuszaAuthRes>();
            try
            {
                result.item = await campuszaAuthService.Login(req.item);
            }
            catch (AppException ex)
            {
                logger.LogWarning(ex, "Campusza login rejected");
                return BadRequest(new { error = ex.Message, message = ex.Message, key = ex.code.ToString() });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during Campusza login");
                var message = ex.Message ?? "Login failed";
                if (message.Contains("passwordhash", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("user_product_profile", StringComparison.OrdinalIgnoreCase))
                {
                    message = "Platform database is not migrated yet. Run add_platform_campusza_users.sql on the APPOINTZA database, then retry.";
                }
                return BadRequest(new { error = message, message });
            }
            return Ok(result);
        }

        /// <summary>Campusza profile update — password/email change via the central Auth API.</summary>
        [HttpPost("CampuszaUpdateProfile")]
        public async Task<ActionResult<ActionRes<CampuszaAuthRes>>> CampuszaUpdateProfile(ActionReq<UserProfileUpdateReq> req)
        {
            ActionRes<CampuszaAuthRes> result = new ActionRes<CampuszaAuthRes>();
            try
            {
                result.item = await campuszaAuthService.UpdateProfile(req.item);
            }
            catch (AppException ex)
            {
                logger.LogWarning(ex, "Campusza profile update rejected");
                return BadRequest(new { error = ex.Message, message = ex.Message, key = ex.code.ToString() });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during Campusza profile update");
                return BadRequest(new { error = ex.Message, message = "Profile update failed" });
            }
            return Ok(result);
        }

        [HttpPost("RefreshToken")]
        public async Task<ActionResult<ActionRes<UsersContext>>> RefreshToken(ActionReq<RefreshTokenRequest> req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                result.item = await authService.RefreshToken(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error refreshing token");
                return BadRequest(new { error = ex.Message, message = "Token refresh failed" });
            }
            return Ok(result);
        }

        [HttpGet("ValidateToken")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<UsersContext>>> ValidateToken()
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                var userContext = requestState.usercontext;
                if (userContext == null || userContext.userid <= 0)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }
                result.item = userContext;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating token");
                return BadRequest(new { error = ex.Message, message = "Token validation failed" });
            }
            return Ok(result);
        }

        /// <summary>Screen 2 — create business org for an authenticated user with no organisation yet.</summary>
        [HttpPost("CompleteBusinessOnboarding")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<UsersContext>>> CompleteBusinessOnboarding(
            ActionReq<CompleteBusinessOnboardingRequest>? req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                if (requestState.usercontext == null || requestState.usercontext.userid <= 0)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                result.item = await authService.CompleteBusinessOnboarding(
                    req?.item ?? new CompleteBusinessOnboardingRequest());
                return Ok(result);
            }
            catch (AppException ex)
            {
                logger.LogWarning(ex, "CompleteBusinessOnboarding rejected");
                return BadRequest(new { error = ex.Message, message = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "CompleteBusinessOnboarding failed");
                return BadRequest(new { error = ex.Message, message = "Could not create business profile" });
            }
        }

        [HttpPost("GoogleLogin")]
        public async Task<ActionResult<ActionRes<UsersContext>>> GoogleLogin(ActionReq<GoogleLoginRequest> req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                if (req == null)
                {
                    logger.LogError("GoogleLogin request is null");
                    return BadRequest(new { error = "Request is null", message = "Invalid request format" });
                }
                
                if (req.item == null)
                {
                    logger.LogError("GoogleLogin request.item is null");
                    return BadRequest(new { error = "Request item is null", message = "Invalid request format" });
                }
                
                result.item = await authService.GoogleLogin(req.item);
            }
            catch (AppException ex)
            {
                logger.LogWarning(ex, "GoogleLogin rejected: {Code}", ex.code);
                return BadRequest(new { error = ex.Message, key = ex.key, message = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during Google login");
                return BadRequest(new { error = ex.Message, message = "Google login failed" });
            }
            return Ok(result);
        }



        [HttpGet("partner-data")]
        public IActionResult GetPartnerData()
        {
            var company = HttpContext.Items["CallingCompany"]?.ToString();

            if (company != "appointza")
                return Forbid();

            return Ok("Secure data for Appointza");
        }


        [ApiController]
        [Route("api/b2b/partners")]
        public class PartnerController : ControllerBase
        {
            [HttpGet("data")]
            public IActionResult GetData()
            {
                var company = HttpContext.Items["CallingCompany"];
                return Ok($"Called by {company}");
            }
        }


    }
}

