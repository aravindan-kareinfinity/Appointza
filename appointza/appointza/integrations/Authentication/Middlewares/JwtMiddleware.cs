using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using appointza.Models;
using appointza.Authentication.Services;
using appointza.Authentication.Utils;
using appointza.Services;
using appointza.Utils;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace appointza.Authentication.Middlewares
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate next;
        ILogger logger;
        ApplicationEnvironment applicationsettings;
        IHttpContextAccessor httpcontextaccessor;
        
        public JwtMiddleware(
            RequestDelegate next, ILogger<JwtMiddleware> logger,
            IOptions<ApplicationEnvironment> applicationsettings,
            IHttpContextAccessor httpcontextaccessor
            )
        {
            this.next = next;
            this.logger = logger;
            this.applicationsettings = applicationsettings.Value;
            this.httpcontextaccessor = httpcontextaccessor;
            
        }

        public async Task Invoke(HttpContext context, AuthService authService, AdminService adminService)
        {
            try
            {
                var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (token == null)
                {
                    token = httpcontextaccessor.HttpContext.Request.Cookies[AppConstants.AccessTokenKey];
                }
                if (token != null)
                    await attachUserToContext(context, token, authService, adminService);
                await next(context);
            }
            catch (Exception)
            {
                throw;
            }
        }
        private async Task attachUserToContext(
            HttpContext context,
            string token,
            AuthService authService,
            AdminService adminService)
        {
            try
            {
                var campuszaUser = CampuszaAuthService.JwtTokenToCampuszaUser(token, applicationsettings.jwtsecret);
                if (campuszaUser != null)
                {
                    httpcontextaccessor.HttpContext!.Items["campusza_usercontext"] = campuszaUser;
                    return;
                }

                var admin = adminService.JwtTokenToAdminContext(token);
                if (admin != null)
                {
                    httpcontextaccessor.HttpContext!.Items["admincontext"] = admin;
                    return;
                }

                httpcontextaccessor.HttpContext!.Items["usercontext"] = authService.JwtTokenToUserContext(token);
            }
            catch (Exception)
            {

            }
        }

    }
}

