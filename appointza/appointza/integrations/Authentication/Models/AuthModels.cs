using System.Text.Json.Serialization;
using System.Text.Json;
using appointza.Models;

namespace appointza.Authentication.Models
{
    // Authentication Request/Response Models
    public class RegisterRequest
    {
        public long organisationimageid { get; set; }
        public string organisationname { get; set; }
        public string organisationgstnumber { get; set; }
        public long organisationtype { get; set; }
        public string secondarytypecode { get; set; }
        public long secondarytype { get; set; }
        public long primarytype { get; set; }
        public string primarytypecode { get; set; }
        public string locationname { get; set; }
        public string locationaddressline1 { get; set; }
        public string locationaddressline2 { get; set; }
        public string locationcity { get; set; }
        public string locationstate { get; set; }
        public string locationcountry { get; set; }
        public string locationpincode { get; set; }
        public double latitude { get; set; }
        public double longitude { get; set; }
        public string googlelocation { get; set; }
        public string username { get; set; }
        public string useremail { get; set; }
        public string usermobile { get; set; }
        public string usermobilecountrycode { get; set; }
        public string userdesignation { get; set; }
        public long profileimage { get; set; }
        /// <summary>starter | basic | pro | free — SaaS plan selected at signup</summary>
        public string plan_code { get; set; }
        /// <summary>Optional referral code from an existing organisation</summary>
        public string referral_code { get; set; }
        /// <summary>
        /// When true (org signup Screen 1), create a draft Organisation and link it to the user
        /// so refresh/login stays in business onboarding even before Screen 2 fills the profile.
        /// </summary>
        public bool is_business_registration { get; set; }
    }

    public class RegisterResponse
    {
        public string mobile { get; set; }
        public string name { get; set; }
    }

    /// <summary>
    /// Screen 2 — attach a business organisation to an authenticated user who has no org yet.
    /// </summary>
    public class CompleteBusinessOnboardingRequest
    {
        public string organisationname { get; set; } = "";
        public string organisationgstnumber { get; set; } = "";
        public long primarytype { get; set; }
        public string primarytypecode { get; set; } = "";
        public long secondarytype { get; set; }
        public string secondarytypecode { get; set; } = "";
        public long organisationlogo { get; set; }
        public string referral_code { get; set; } = "";
        public string plan_code { get; set; } = "";
        public string userdesignation { get; set; } = "";
    }

    public class GetOtpRequest
    {
        public string mobile { get; set; }
        public long organisationtype { get; set; }
    }

    public class GetOtpResponse
    {
        public string mobile { get; set; }
        public string name { get; set; }
    }

    public class LoginRequest
    {
        public string mobile { get; set; }
        public string otp { get; set; }
    }

    public class RefreshTokenRequest
    {
        public long userid { get; set; }
        public string refreshtoken { get; set; }
    }

    public class GenerateJwtTokenRequest
    {
        public long userid { get; set; }
        public string usermobile { get; set; }
        public string username { get; set; }
        public string useremail { get; set; }
        public long profileimage { get; set; }
        public string permissionhex { get; set; }
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public long organisationtype { get; set; }
        public long organisationlocationid { get; set; }
        public string organisationlocationname { get; set; }
    }

    public class GoogleLoginRequest
    {
        public string idToken { get; set; } = string.Empty;
        public string? email { get; set; }
        public string? name { get; set; }
        public string? picture { get; set; }
        /// <summary>
        /// Business signup / Google continue: if the user exists without an organisation,
        /// create a draft Organisation and link it so they stay in org onboarding.
        /// </summary>
        public bool is_business_registration { get; set; }
    }
}

