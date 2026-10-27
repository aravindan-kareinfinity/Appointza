using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using appointza.Models;
using System.Reflection;

namespace appointza.Authentication.Utils
{
    /// <summary>Requires a platform-admin JWT (token_kind=platform_admin).</summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class AdminAuthenticateAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            if (AllowsAnonymous(context))
                return;

            var admin = context.HttpContext.Items["admincontext"] as AdminContext;
            if (admin == null || admin.adminid <= 0)
            {
                context.Result = new JsonResult(new { message = "Unauthorized" })
                {
                    StatusCode = StatusCodes.Status401Unauthorized
                };
            }
        }

        private static bool AllowsAnonymous(AuthorizationFilterContext context)
        {
            if (context.ActionDescriptor.EndpointMetadata.Any(m => m is AllowAnonymousAttribute))
                return true;

            if (context.ActionDescriptor is ControllerActionDescriptor cad)
            {
                if (cad.MethodInfo.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) != null)
                    return true;
                if (cad.ControllerTypeInfo.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) != null)
                    return true;
            }

            return false;
        }
    }
}
