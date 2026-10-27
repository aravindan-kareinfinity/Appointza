using System.Text.Json.Serialization;
using System.Text.Json;

namespace appointza.Models
{
    public class Admin
    {
        public long id { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
        public string password { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public string notes { get; set; }
    }

    public class AdminSelectReq
    {
        public long id { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
    }

    public class AdminDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }

    public class AdminLoginReq
    {
        public string email { get; set; } = "";
        public string password { get; set; } = "";
    }

    public class AdminContext
    {
        public long adminid { get; set; }
        public string adminname { get; set; } = "";
        public string adminemail { get; set; } = "";
        public string adminmobile { get; set; } = "";
        public string accesstoken { get; set; } = "";
        public string refreshtoken { get; set; } = "";
        /// <summary>Always platform_admin for this token kind.</summary>
        public string role { get; set; } = "platform_admin";
    }

    public class AdminChangePasswordReq
    {
        public string current_password { get; set; } = "";
        public string new_password { get; set; } = "";
    }

    // 1. Organization verification stats
    public class AdminOrganizationStats
    {
        public int TotalOrganizations { get; set; }
        public int VerifiedOrganizations { get; set; }
        public int NotVerifiedOrganizations { get; set; }
    }

    // Organization Location stats
    public class AdminOrganizationLocationStats
    {
        public int TotalOrganizations { get; set; }
        public int TotalLocations { get; set; }
        public int VerifiedLocations { get; set; }
        public int NotVerifiedLocations { get; set; }
        public int RejectedLocations { get; set; }
    }

    // 2. Appointment stats
    public class AdminAppointmentStats
    {
        public int TotalAppointments { get; set; }
        public List<AppointmentStatusCount> StatusCounts { get; set; } = new List<AppointmentStatusCount>();
    }

    public class AppointmentStatusCount
    {
        public string StatusCode { get; set; } = "";
        public int Count { get; set; }
    }

    public class AdminAppointmentStatsReq
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? SingleDate { get; set; }
        public long? OrganisationLocationId { get; set; }
    }

    // 3. Organization location details
    public class AdminOrganisationLocation
    {
        public long id { get; set; }
        public string name { get; set; }
        public string addressline1 { get; set; }
        public string addressline2 { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string country { get; set; }
        public string pincode { get; set; }
        public double latitude { get; set; }
        public double longitude { get; set; }
        public string googlelocation { get; set; }
        public DateTime createdon { get; set; }
        public bool isactive { get; set; }
        public bool isverified { get; set; }
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public string organisationgstnumber { get; set; }
        public string organisationprimarytypecode { get; set; }
        public string organisationsecondarytypecode { get; set; }
        public string organisationmobile { get; set; }
        public string usermobile { get; set; }
    }

    // 4. Organization verification toggle
    public class AdminToggleOrganisationVerificationReq
    {
        public long OrganisationId { get; set; }
        public bool IsVerified { get; set; }
    }

    // 5. Location verification toggle
    public class AdminToggleLocationVerificationReq
    {
        public long LocationId { get; set; }
        public bool IsVerified { get; set; }
    }

    // 6. Location delete (set isactive to false)
    public class AdminDeleteLocationReq
    {
        public long LocationId { get; set; }
    }

    // 7. Location activate (set isactive to true)
    public class AdminActivateLocationReq
    {
        public long LocationId { get; set; }
    }

    // Dashboard stats
    public class AdminDashboardStats
    {
        public AdminOrganizationStats OrganizationStats { get; set; }
        public AdminAppointmentStats AppointmentStats { get; set; }
    }

    public class AdminDashboardStatsReq
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    // User management
    public class AdminGetAllUsersReq
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public long? OrganisationId { get; set; }
    }

    public class AdminSuspendUserReq
    {
        public long UserId { get; set; }
        public string Reason { get; set; }
    }

    public class AdminActivateUserReq
    {
        public long UserId { get; set; }
    }

    // Organization management
    public class AdminGetAllOrganisationsReq
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsVerified { get; set; }
    }

    public class AdminSuspendOrganisationReq
    {
        public long OrganisationId { get; set; }
        public string Reason { get; set; }
    }

    public class AdminActivateOrganisationReq
    {
        public long OrganisationId { get; set; }
    }
}
