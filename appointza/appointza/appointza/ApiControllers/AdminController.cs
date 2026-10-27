using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AdminAuthenticate]
    public class AdminController : ControllerBase
    {
        private readonly ILogger<AdminController> logger;
        private readonly AdminService adminService;

        public AdminController(ILogger<AdminController> logger, AdminService adminService)
        {
            this.logger = logger;
            this.adminService = adminService;
        }

        [HttpGet("Entity")]
        public ActionResult<ActionRes<Admin>> Entity()
        {
            return Ok(new ActionRes<Admin> { item = new Admin() });
        }

        [AllowAnonymous]
        [HttpPost("Login")]
        public async Task<ActionResult<ActionRes<AdminContext>>> Login(ActionReq<AdminLoginReq> req)
        {
            try
            {
                var item = await adminService.Login(req?.item ?? new AdminLoginReq());
                return Ok(new ActionRes<AdminContext> { item = item });
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Admin login failed");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("ChangePassword")]
        public async Task<ActionResult<ActionRes<AdminContext>>> ChangePassword(ActionReq<AdminChangePasswordReq> req)
        {
            try
            {
                var admin = HttpContext.Items["admincontext"] as AdminContext;
                var item = await adminService.ChangePassword(admin?.adminid ?? 0, req?.item ?? new AdminChangePasswordReq());
                return Ok(new ActionRes<AdminContext> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("Me")]
        public ActionResult<ActionRes<AdminContext>> Me()
        {
            var admin = HttpContext.Items["admincontext"] as AdminContext;
            if (admin == null || admin.adminid <= 0)
            {
                return Unauthorized(new { message = "Unauthorized" });
            }
            return Ok(new ActionRes<AdminContext> { item = admin });
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Admin>>>> Select(ActionReq<AdminSelectReq> req)
        {
            return Ok(new ActionRes<List<Admin>> { item = await adminService.Select(req.item) });
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Admin>>> Insert(ActionReq<Admin> req)
        {
            return Ok(new ActionRes<Admin> { item = await adminService.Insert(req.item) });
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Admin>>> Update(ActionReq<Admin> req)
        {
            return Ok(new ActionRes<Admin> { item = await adminService.Update(req.item) });
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Admin>>> Save(ActionReq<Admin> req)
        {
            var item = req.item.id > 0
                ? await adminService.Update(req.item)
                : await adminService.Insert(req.item);
            return Ok(new ActionRes<Admin> { item = item });
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<AdminDeleteReq> req)
        {
            return Ok(new ActionRes<bool> { item = await adminService.Delete(req.item) });
        }

        [HttpPost("GetDashboardStats")]
        public async Task<ActionResult<ActionRes<AdminDashboardStats>>> GetDashboardStats(ActionReq<AdminDashboardStatsReq> req)
        {
            return Ok(new ActionRes<AdminDashboardStats> { item = await adminService.GetDashboardStats(req.item) });
        }

        [HttpPost("GetAllUsers")]
        public async Task<ActionResult<ActionRes<List<Users>>>> GetAllUsers(ActionReq<AdminGetAllUsersReq> req)
        {
            return Ok(new ActionRes<List<Users>> { item = await adminService.GetAllUsers(req.item) });
        }

        [HttpPost("GetAllOrganisations")]
        public async Task<ActionResult<ActionRes<List<Organisation>>>> GetAllOrganisations(ActionReq<AdminGetAllOrganisationsReq> req)
        {
            return Ok(new ActionRes<List<Organisation>> { item = await adminService.GetAllOrganisations(req.item) });
        }

        [HttpPost("SuspendUser")]
        public async Task<ActionResult<ActionRes<bool>>> SuspendUser(ActionReq<AdminSuspendUserReq> req)
        {
            return Ok(new ActionRes<bool> { item = await adminService.SuspendUser(req.item) });
        }

        [HttpPost("ActivateUser")]
        public async Task<ActionResult<ActionRes<bool>>> ActivateUser(ActionReq<AdminActivateUserReq> req)
        {
            return Ok(new ActionRes<bool> { item = await adminService.ActivateUser(req.item) });
        }

        [HttpPost("SuspendOrganisation")]
        public async Task<ActionResult<ActionRes<bool>>> SuspendOrganisation(ActionReq<AdminSuspendOrganisationReq> req)
        {
            return Ok(new ActionRes<bool> { item = await adminService.SuspendOrganisation(req.item) });
        }

        [HttpPost("ActivateOrganisation")]
        public async Task<ActionResult<ActionRes<bool>>> ActivateOrganisation(ActionReq<AdminActivateOrganisationReq> req)
        {
            return Ok(new ActionRes<bool> { item = await adminService.ActivateOrganisation(req.item) });
        }

        [HttpGet("GetOrganizationVerificationStats")]
        public async Task<ActionResult<ActionRes<AdminOrganizationStats>>> GetOrganizationVerificationStats()
        {
            return Ok(new ActionRes<AdminOrganizationStats> { item = await adminService.GetOrganizationVerificationStats() });
        }

        [HttpGet("GetOrganizationLocationStats")]
        public async Task<ActionResult<ActionRes<AdminOrganizationLocationStats>>> GetOrganizationLocationStats()
        {
            return Ok(new ActionRes<AdminOrganizationLocationStats> { item = await adminService.GetOrganizationLocationStats() });
        }

        [HttpPost("GetAppointmentStats")]
        public async Task<ActionResult<ActionRes<AdminAppointmentStats>>> GetAppointmentStats(ActionReq<AdminAppointmentStatsReq> req)
        {
            return Ok(new ActionRes<AdminAppointmentStats> { item = await adminService.GetAppointmentStats(req.item) });
        }

        [HttpGet("GetAllOrganisationLocations")]
        public async Task<ActionResult<ActionRes<List<AdminOrganisationLocation>>>> GetAllOrganisationLocations()
        {
            return Ok(new ActionRes<List<AdminOrganisationLocation>> { item = await adminService.GetAllOrganisationLocations() });
        }

        [HttpPost("ToggleOrganisationVerification")]
        public async Task<ActionResult<ActionRes<bool>>> ToggleOrganisationVerification(ActionReq<AdminToggleOrganisationVerificationReq> req)
        {
            return Ok(new ActionRes<bool>
            {
                item = await adminService.ToggleOrganisationVerification(req.item.OrganisationId, req.item.IsVerified)
            });
        }

        [HttpPost("ToggleLocationVerification")]
        public async Task<ActionResult<ActionRes<bool>>> ToggleLocationVerification(ActionReq<AdminToggleLocationVerificationReq> req)
        {
            return Ok(new ActionRes<bool>
            {
                item = await adminService.ToggleLocationVerification(req.item.LocationId, req.item.IsVerified)
            });
        }

        [HttpPost("DeleteLocation")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteLocation(ActionReq<AdminDeleteLocationReq> req)
        {
            return Ok(new ActionRes<bool> { item = await adminService.DeleteLocation(req.item.LocationId) });
        }

    }
}
