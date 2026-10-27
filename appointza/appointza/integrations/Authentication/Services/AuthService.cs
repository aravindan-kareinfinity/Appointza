using appointza.Models;
using appointza.Utils;
using appointza.Services;
using appointza.Authentication.Models;
using appointza.Sms.Services;
using appointza.Sms.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Data.Common;
using System.Text.Json;

namespace appointza.Authentication.Services
{
    public class AuthService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;
        private readonly UserSessionService usersessionservice;
        private readonly ApplicationEnvironment applicationenvironment;
        private readonly OrganisationLocationService organisationlocationservice;
        private readonly GoogleGeocodingService googlegeocodingservice;
        private readonly ILogger<AuthService> logger;
        private readonly OrganisationService organisationservice;
        private readonly StaffService staffService;
        private readonly UsersService usersService;
        private readonly OrganisationReferralService organisationReferralService;

        public AuthService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            UserSessionService usersessionservice,
            IOptions<ApplicationEnvironment> applicationenvironment,
            OrganisationLocationService organisationlocationservice,
            GoogleGeocodingService googlegeocodingservice,
            ILogger<AuthService> logger,
            OrganisationService organisationService,
            StaffService staffservice,
            UsersService usersService,
            OrganisationReferralService organisationReferralService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.usersessionservice = usersessionservice;
            this.applicationenvironment = applicationenvironment.Value;
            this.organisationlocationservice = organisationlocationservice;
            this.googlegeocodingservice = googlegeocodingservice;
            this.logger = logger;
            this.organisationservice = organisationService;
            this.staffService = staffservice;
            this.usersService = usersService;
            this.organisationReferralService = organisationReferralService;
        }

        public UsersContext JwtTokenToUserContext(string token)
        {
            var usercontext = new UsersContext();
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(applicationenvironment.jwtsecret);
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero,
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;

                usercontext = new UsersContext()
                {
                    userid = long.Parse(jwtToken.Claims.First(x => x.Type == "userid").Value),
                    usermobile = jwtToken.Claims.First(x => x.Type == "usermobile").Value,
                    username = jwtToken.Claims.First(x => x.Type == "username").Value,
                    useremail = jwtToken.Claims.First(x => x.Type == "useremail").Value,
                    profileimage = long.Parse(jwtToken.Claims.First(x => x.Type == "profileimage").Value),
                    userpermission = HexToPermission(jwtToken.Claims.First(x => x.Type == "permissionhex").Value),
                    organisationid = long.Parse(jwtToken.Claims.First(x => x.Type == "organisationid").Value),
                    organisationname = jwtToken.Claims.First(x => x.Type == "organisationname").Value,
                    organisationtype = int.Parse(jwtToken.Claims.First(x => x.Type == "organisationtype").Value),
                    organisationlocationid = long.Parse(jwtToken.Claims.First(x => x.Type == "organisationlocationid").Value),
                    organisationlocationname = jwtToken.Claims.First(x => x.Type == "organisationlocationname").Value,
                };
            }
            catch (SecurityTokenExpiredException)
            {
                // Token expired
            }
            catch (Exception)
            {
                // Invalid token
            }
            return usercontext;
        }

        public string GenerateJwtToken(GenerateJwtTokenRequest req)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(applicationenvironment.jwtsecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Claim values must never be null — Google / draft-org users often lack mobile or location name.
            static string ClaimVal(string? value) => value ?? "";

            var claims = new[]
            {
                new Claim("userid", req.userid.ToString()),
                new Claim("usermobile", ClaimVal(req.usermobile)),
                new Claim("username", ClaimVal(req.username)),
                new Claim("useremail", ClaimVal(req.useremail)),
                new Claim("profileimage", req.profileimage.ToString()),
                new Claim("permissionhex", ClaimVal(req.permissionhex)),
                new Claim("organisationid", req.organisationid.ToString()),
                new Claim("organisationname", ClaimVal(req.organisationname)),
                new Claim("organisationtype", req.organisationtype.ToString()),
                new Claim("organisationlocationid", req.organisationlocationid.ToString()),
                new Claim("organisationlocationname", ClaimVal(req.organisationlocationname)),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddYears(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string PermissionToHex(UsersPermissionData req)
        {
            StringBuilder binary = new StringBuilder();
            binary.Append("1");
            binary.Append(req.editandviewDashboard ? "1" : "0");
            binary.Append(req.editandviewAppointments ? "1" : "0");
            binary.Append(req.editandviewEvents ? "1" : "0");
            binary.Append(req.editandviewCreateService ? "1" : "0");
            binary.Append(req.editandviewCreateEvent ? "1" : "0");
            binary.Append(req.editandviewClients ? "1" : "0");
            binary.Append(req.editandviewBusinessHours ? "1" : "0");
            binary.Append(req.editandviewStaffManagement ? "1" : "0");
            binary.Append(req.editandviewLocationManagement ? "1" : "0");
            binary.Append(req.editandviewTemplates ? "1" : "0");
            binary.Append(req.editandviewPaymentSettings ? "1" : "0");
            binary.Append(req.editandviewBusinessvalues ? "1" : "0");
            var hex = BinaryToHex(binary.ToString());
            return hex;
        }

        public UsersPermissionData HexToPermission(string req)
        {
            var result = new UsersPermissionData();
            string binary = HexToBinary(req);
            Queue<char> queue = new Queue<char>(binary);
            queue.Dequeue();

            result.editandviewDashboard = queue.Dequeue().ToString() == "1";
            result.editandviewAppointments = queue.Dequeue().ToString() == "1";
            result.editandviewEvents = queue.Dequeue().ToString() == "1";
            result.editandviewCreateService = queue.Dequeue().ToString() == "1";
            result.editandviewCreateEvent = queue.Dequeue().ToString() == "1";
            result.editandviewClients = queue.Dequeue().ToString() == "1";
            result.editandviewBusinessHours = queue.Dequeue().ToString() == "1";
            result.editandviewStaffManagement = queue.Dequeue().ToString() == "1";
            result.editandviewLocationManagement = queue.Dequeue().ToString() == "1";
            result.editandviewTemplates = queue.Dequeue().ToString() == "1";
            result.editandviewPaymentSettings = queue.Dequeue().ToString() == "1";
            result.editandviewBusinessvalues = queue.Dequeue().ToString() == "1";

            return result;
        }

        private string BinaryToHex(string binaryString)
        {
            if (string.IsNullOrEmpty(binaryString))
            {
                throw new ArgumentException("Binary string must not be null or empty.");
            }

            int remainder = binaryString.Length % 4;
            if (remainder != 0)
            {
                binaryString = binaryString.PadLeft(binaryString.Length + (4 - remainder), '0');
            }

            string hexString = "";
            for (int i = 0; i < binaryString.Length; i += 4)
            {
                string nibble = binaryString.Substring(i, 4);
                int decimalValue = Convert.ToInt32(nibble, 2);
                hexString += decimalValue.ToString("X");
            }

            return hexString;
        }

        private string HexToBinary(string hexString)
        {
            if (string.IsNullOrEmpty(hexString))
            {
                throw new ArgumentException("Hexadecimal string must not be null or empty.");
            }

            string binaryString = "";
            foreach (char hexChar in hexString)
            {
                int decimalValue = Convert.ToInt32(hexChar.ToString(), 16);
                string binaryNibble = Convert.ToString(decimalValue, 2).PadLeft(4, '0');
                binaryString += binaryNibble;
            }

            return binaryString.TrimStart('0');
        }

        public string GenerateRandomNumber()
        {
            Random random = new Random();
            int randomNumber = random.Next(100000, 1000000);
            return randomNumber.ToString();
        }

        /// <summary>Digits only, last 10 (strips leading 91 / country code for Indian numbers).</summary>
        public static string NormalizeIndianMobile(string? mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile)) return "";
            var digits = new string(mobile.Where(char.IsDigit).ToArray());
            if (digits.Length > 10)
            {
                if (digits.StartsWith("91") && digits.Length >= 12)
                    digits = digits[^10..];
                else
                    digits = digits[^10..];
            }
            return digits;
        }

        async Task TrySendOtpSms(string mobile, string otp, string context)
        {
            try
            {
                var smsService = new Sms.Services.SmsService();
                await smsService.SendOtp(new SmsSendOtpReq
                {
                    mobilenumber = mobile,
                    otp = otp
                });
            }
            catch (Exception ex)
            {
                // OTP is already stored — don't fail login/register if the SMS gateway is down.
                logger.LogError(ex, "SMS OTP send failed ({Context}) for {Mobile}. OTP for local/dev: {Otp}", context, mobile, otp);
            }
        }

        async Task<Users?> FindUserByMobileTransaction(IDb db, string mobile)
        {
            if (string.IsNullOrEmpty(mobile)) return null;

            var user = (await usersService.SelectTransaction(db, new UsersSelectReq
            {
                mobile = mobile,
            })).FirstOrDefault();

            if (user != null) return user;

            // Legacy rows sometimes stored with country code prefix.
            user = (await usersService.SelectTransaction(db, new UsersSelectReq
            {
                mobile = "91" + mobile,
            })).FirstOrDefault();

            return user;
        }

        public async Task<UsersContext> Register(RegisterRequest req)
        {
            UsersContext result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    result = await RegisterTransaction(db, req);
                    await db.CommitTransaction();
                }
                catch (Exception)
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return result;
        }

        /// <summary>Marker stored on Organisation.notes for draft orgs created at business signup.</summary>
        public const string OnboardingDraftOrgNotes = "onboarding_draft";

        public static bool IsOnboardingDraftOrganisation(Organisation? organisation)
        {
            if (organisation == null || organisation.id <= 0) return false;
            if (string.Equals(organisation.notes, OnboardingDraftOrgNotes, StringComparison.OrdinalIgnoreCase))
                return true;
            if (organisation.primarytype <= 0
                && !string.IsNullOrWhiteSpace(organisation.name)
                && organisation.name.StartsWith("Pending setup", StringComparison.OrdinalIgnoreCase))
                return true;
            return organisation.primarytype <= 0
                && string.IsNullOrWhiteSpace(organisation.name);
        }

        public async Task<UsersContext> RegisterTransaction(IDb db, RegisterRequest req)
        {
            var result = new UsersContext();

            var normalizedMobile = NormalizeIndianMobile(req.usermobile);
            if (normalizedMobile.Length != 10)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Enter a valid 10-digit mobile number.");
            }
            req.usermobile = normalizedMobile;

            // Check for duplicate mobile number
            string duplicateUserQuery = @"
                SELECT id, mobile, accountactive, isactive 
                FROM Users 
                WHERE mobile = @mobile AND isactive = true
            ";
            DbCommand duplicateUserCommand = db.GetCommand(duplicateUserQuery);
            db.AddParameter(duplicateUserCommand, "mobile", DbTypes.Types.String).Value = normalizedMobile;

            using (DbDataReader duplicateUserReader = await db.Execute(duplicateUserCommand))
            {
                if (await duplicateUserReader.ReadAsync())
                {
                    long existingUserId = duplicateUserReader["id"] == DBNull.Value ? 0 : Convert.ToInt64(duplicateUserReader["id"]);
                    if (existingUserId > 0)
                    {
                        throw new AppException(AppException.ErrorCodes.UsersDuplicate,
                            $"Mobile number {req.usermobile} is already registered. Please use a different mobile number or login with your existing account.");
                    }
                }
            }

            // Check for duplicate organization name
            Organisation? organisation = null;
            if (req.primarytype > 0 && !string.IsNullOrEmpty(req.organisationname))
            {
                string duplicateOrgNameQuery = @"
                    SELECT id, name, isactive 
                    FROM Organisation 
                    WHERE LOWER(TRIM(name)) = LOWER(TRIM(@name)) AND isactive = true
                ";
                DbCommand duplicateOrgNameCommand = db.GetCommand(duplicateOrgNameQuery);
                db.AddParameter(duplicateOrgNameCommand, "name", DbTypes.Types.String).Value = req.organisationname ?? "";

                using (DbDataReader duplicateOrgNameReader = await db.Execute(duplicateOrgNameCommand))
                {
                    if (await duplicateOrgNameReader.ReadAsync())
                    {
                        long existingOrgId = duplicateOrgNameReader["id"] == DBNull.Value ? 0 : Convert.ToInt64(duplicateOrgNameReader["id"]);
                        if (existingOrgId > 0)
                        {
                            throw new AppException(AppException.ErrorCodes.OrganisationDuplicate,
                                $"Organization name '{req.organisationname}' is already registered. Please use a different organization name.");
                        }
                    }
                }
            }

            // Check for duplicate GST number
            if (req.primarytype > 0 && !string.IsNullOrEmpty(req.organisationgstnumber))
            {
                string duplicateOrgQuery = @"
                    SELECT id, name, gstnumber, isactive 
                    FROM Organisation 
                    WHERE gstnumber = @gstnumber AND isactive = true
                ";
                DbCommand duplicateOrgCommand = db.GetCommand(duplicateOrgQuery);
                db.AddParameter(duplicateOrgCommand, "gstnumber", DbTypes.Types.String).Value = req.organisationgstnumber ?? "";

                using (DbDataReader duplicateOrgReader = await db.Execute(duplicateOrgCommand))
                {
                    if (await duplicateOrgReader.ReadAsync())
                    {
                        long existingOrgId = duplicateOrgReader["id"] == DBNull.Value ? 0 : Convert.ToInt64(duplicateOrgReader["id"]);
                        if (existingOrgId > 0)
                        {
                            throw new AppException(AppException.ErrorCodes.OrganisationDuplicate,
                                $"Organization with GST number {req.organisationgstnumber} is already registered. Please use a different GST number.");
                        }
                    }
                }
            }

            bool createFullOrg = req.primarytype > 0 && !string.IsNullOrWhiteSpace(req.organisationname);
            bool createDraftOrg = !createFullOrg && req.is_business_registration;

            if (createFullOrg || createDraftOrg)
            {
                organisation = new Organisation
                {
                    name = createDraftOrg
                        ? $"Pending setup · {normalizedMobile}"
                        : req.organisationname,
                    primarytype = createDraftOrg ? 0 : req.primarytype,
                    secondarytype = createDraftOrg ? 0 : req.secondarytype,
                    primarytypecode = createDraftOrg ? "" : req.primarytypecode,
                    secondarytypecode = createDraftOrg ? "" : req.secondarytypecode,
                    gstnumber = createDraftOrg ? "" : req.organisationgstnumber,
                    imageid = req.organisationimageid,
                    subscription_plan_code = string.IsNullOrWhiteSpace(req.plan_code) ? "free" : req.plan_code,
                    notes = createDraftOrg ? OnboardingDraftOrgNotes : "",
                };
                await organisationservice.InsertTransaction(db, organisation);

                if (!createDraftOrg && organisation.id > 0 && !string.IsNullOrWhiteSpace(req.referral_code))
                {
                    var referralApplied = await organisationReferralService.TryApplyReferralOnSignupTransaction(
                        db,
                        organisation.id,
                        req.referral_code);
                    if (!referralApplied)
                    {
                        throw new AppException(
                            AppException.ErrorCodes.BadRequest,
                            "Invalid referral code. Please check the code and try again.");
                    }
                }
            }

            // Geocoding + primary location only for full org signup (not draft Screen-1 orgs).
            double latitude = req.latitude;
            double longitude = req.longitude;
            string googlelocation = req.googlelocation ?? "";
            var organisationlocation = new OrganisationLocation();

            if (createFullOrg && organisation != null && organisation.id > 0)
            {
                try
                {
                    var geocodingResult = await googlegeocodingservice.GeocodeAddressAsync(
                        req.locationaddressline1 ?? "",
                        req.locationaddressline2 ?? "",
                        req.locationpincode ?? "",
                        req.locationcity ?? "",
                        req.locationstate ?? "",
                        req.locationcountry ?? "India"
                    );

                    if (geocodingResult.Success)
                    {
                        latitude = geocodingResult.Latitude;
                        longitude = geocodingResult.Longitude;
                        googlelocation = geocodingResult.GoogleMapsLink;
                    }
                    else
                    {
                        logger.LogWarning($"Geocoding failed for organization location: {geocodingResult.ErrorMessage}");
                        latitude = req.latitude != 0 ? req.latitude : 0;
                        longitude = req.longitude != 0 ? req.longitude : 0;
                        googlelocation = req.googlelocation ?? $"{req.locationcity}, {req.locationstate}, {req.locationcountry}";
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error during geocoding for organization registration");
                    latitude = req.latitude != 0 ? req.latitude : 0;
                    longitude = req.longitude != 0 ? req.longitude : 0;
                    googlelocation = req.googlelocation ?? $"{req.locationcity}, {req.locationstate}, {req.locationcountry}";
                }

                organisationlocation = new OrganisationLocation
                {
                    organisationid = organisation.id,
                    name = req.locationname,
                    addressline1 = req.locationaddressline1,
                    addressline2 = req.locationaddressline2,
                    city = req.locationcity,
                    state = req.locationstate,
                    country = req.locationcountry,
                    pincode = req.locationpincode,
                    longitude = longitude,
                    latitude = latitude,
                    googlelocation = googlelocation,
                    templateid = 0
                };
                await organisationlocationservice.InsertTransaction(db, organisationlocation);
            }

            Users user = new Users
            {
                name = req.username,
                email = req.useremail,
                mobile = normalizedMobile,
                mobilecountrycode = req.usermobilecountrycode,
                designation = req.userdesignation,
                organisationid = organisation?.id ?? 0,
                locationid = organisationlocation.id,
                profileimage = req.profileimage,
                otp = GenerateRandomNumber(),
                otpexpirationtime = DateTime.UtcNow.AddMinutes(5),
                accountactive = false,
                attributes = new Users.AttributesData
                {
                    permission = new UsersPermissionData
                    {
                        editandviewDashboard = false,
                        editandviewAppointments = false,
                        editandviewEvents = false,
                        editandviewCreateService = false,
                        editandviewCreateEvent = false,
                        editandviewClients = false,
                        editandviewBusinessHours = false,
                        editandviewStaffManagement = false,
                        editandviewLocationManagement = false,
                        editandviewTemplates = false,
                        editandviewPaymentSettings = false,
                        editandviewBusinessvalues = false
                    }
                }
            };

            await usersService.InsertTransaction(db, user);

            await TrySendOtpSms(user.mobile, user.otp, "Register");

            UsersContext userContext = new UsersContext();
            userContext.usermobile = req.usermobile;
            return userContext;
        }

        public async Task<GetOtpResponse> GetOtp(GetOtpRequest req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await GetOtpTransaction(db, req);
            }
        }

        public async Task<GetOtpResponse> GetOtpTransaction(IDb db, GetOtpRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.mobile))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Mobile number is required.");
            }

            var result = new GetOtpResponse();
            var mobile = NormalizeIndianMobile(req.mobile);
            if (mobile.Length != 10)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Enter a valid 10-digit mobile number.");
            }

            var user = await FindUserByMobileTransaction(db, mobile);

            if (user == null)
            {
                throw new AppException(
                    AppException.ErrorCodes.UserNotFound,
                    "No account found for this mobile number. Register first, then try again.");
            }

            if (user.organisationid > 0)
            {
                var organisation = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = user.organisationid
                })).FirstOrDefault();

                if (organisation == null)
                {
                    throw new AppException(AppException.ErrorCodes.UnknownOrganisation);
                }
            }

            user.otp = GenerateRandomNumber();
            user.otpexpirationtime = DateTime.UtcNow.AddMinutes(5);
            await usersService.UpdateTransaction(db, user);
            result.mobile = NormalizeIndianMobile(user.mobile);
            result.name = user.name;

            await TrySendOtpSms(result.mobile, user.otp, "GetOtp");

            return result;
        }

        public async Task<UsersContext> Login(LoginRequest req)
        {
            UsersContext result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    result = await LoginTransaction(db, req);
                    await db.CommitTransaction();
                }
                catch (ObjectDisposedException)
                {
                    Console.WriteLine("Database connection was disposed during login");
                    throw new Exception("Database connection lost. Please try again.");
                }
                catch (Exception ex) when (ex.InnerException is System.Net.Sockets.SocketException)
                {
                    Console.WriteLine("Database connection was forcibly closed during login");
                    throw new Exception("Database connection lost. Please try again.");
                }
                catch (Exception)
                {
                    try
                    {
                        await db.RollbackTransaction();
                    }
                    catch (ObjectDisposedException)
                    {
                        Console.WriteLine("Rollback skipped - connection already disposed");
                    }
                    throw;
                }
            }
            return result;
        }

        public async Task<UsersContext> LoginTransaction(IDb db, LoginRequest req)
        {
            var result = new UsersContext();
            var mobile = NormalizeIndianMobile(req.mobile);
            var user = await FindUserByMobileTransaction(db, mobile);

            if (user == null)
            {
                throw new AppException(AppException.ErrorCodes.UsersNotFound);
            }
            if (user.otpexpirationtime.CompareTo(DateTime.UtcNow) < 0)
            {
                throw new AppException(AppException.ErrorCodes.OtpExpired);
            }
            if (user.otp != req.otp)
            {
                throw new AppException(AppException.ErrorCodes.OtpInvalid);
            }

            var organisation = new Organisation();
            if (user.organisationid > 0)
            {
                organisation = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = user.organisationid
                })).FirstOrDefault();
            }

            var organisationlocation = new OrganisationLocation();
            if (user.locationid > 0)
            {
                organisationlocation = (await organisationlocationservice.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = user.locationid
                })).FirstOrDefault();
            }

            var usersession = new UserSession
            {
                userid = user.id,
                code = Guid.NewGuid().ToString(),
                starttime = DateTime.UtcNow,
                endtime = DateTime.UtcNow.AddYears(1),
            };
            user.isactive = true;
            user.accountactive = true;
            await usersService.UpdateTransaction(db, user);
            await usersessionservice.InsertTransaction(db, usersession);

            // Determine user type
            bool isStaff = false;
            if (user.locationid > 0 && user.organisationid == 0)
            {
                isStaff = true;
                result.organisationlocationid = user.locationid;
                result.organisationlocationname = organisationlocation?.name ?? "";
                result.organisationid = 0;
                result.organisationname = "";
            }
            else if (user.organisationid > 0 && user.locationid > 0)
            {
                isStaff = false;
                result.organisationid = organisation?.id ?? 0;
                result.organisationname = organisation?.name ?? "";
                result.organisationlocationid = organisationlocation?.id ?? 0;
                result.organisationlocationname = organisationlocation?.name ?? "";
            }
            else if (user.organisationid > 0 && user.locationid == 0)
            {
                isStaff = false;
                result.organisationid = organisation?.id ?? 0;
                result.organisationname = organisation?.name ?? "";
                result.organisationlocationid = 0;
                result.organisationlocationname = "";
            }
            else
            {
                isStaff = false;
                result.organisationid = 0;
                result.organisationname = "";
                result.organisationlocationid = 0;
                result.organisationlocationname = "";
            }

            result.userid = user.id;
            result.usermobile = user.mobile;
            result.username = user.name;
            result.useremail = user.email;
            result.profileimage = user.profileimage;
            result.userpermission = user.attributes.permission;
            result.isStaff = isStaff;
            result.refreshtoken = usersession.code;
            result.accesstoken = GenerateJwtToken(new GenerateJwtTokenRequest
            {
                userid = user.id,
                usermobile = user.mobile,
                useremail = user.email,
                username = user.name,
                profileimage = user.profileimage,
                permissionhex = PermissionToHex(user.attributes.permission),
                organisationid = organisation?.id ?? 0,
                organisationname = organisation?.name ?? "",
                organisationlocationid = organisationlocation?.id ?? 0,
                organisationlocationname = organisationlocation?.name ?? ""
            });

            return result;
        }

        public async Task<UsersContext> RefreshToken(RefreshTokenRequest req)
        {
            UsersContext result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    result = await RefreshTokenTransaction(db, req);
                    await db.CommitTransaction();
                }
                catch (Exception)
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return result;
        }

        public async Task<UsersContext> RefreshTokenTransaction(IDb db, RefreshTokenRequest req)
        {
            var result = new UsersContext();

            var usersession = (await usersessionservice.SelectTransaction(db, new UserSessionSelectReq
            {
                userid = req.userid,
                code = req.refreshtoken
            })).FirstOrDefault();

            if (usersession == null)
            {
                throw new AppException(AppException.ErrorCodes.SessionInvalid);
            }
            if (usersession.endtime.CompareTo(DateTime.UtcNow) > 0)
            {
                throw new AppException(AppException.ErrorCodes.SessionExpired);
            }

            usersession.code = Guid.NewGuid().ToString();
            usersession.endtime = DateTime.UtcNow.AddYears(1);
            await usersessionservice.UpdateTransaction(db, usersession);

            var user = (await usersService.SelectTransaction(db, new UsersSelectReq
            {
                id = req.userid,
            })).FirstOrDefault();

            if (user == null)
            {
                throw new AppException(AppException.ErrorCodes.UserNotFound);
            }

            var organisation = new Organisation();
            if (user.organisationid > 0)
            {
                organisation = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = user.organisationid
                })).FirstOrDefault();

                if (organisation == null)
                {
                    throw new AppException(AppException.ErrorCodes.UnknownOrganisation);
                }
            }

            var organisationlocation = new OrganisationLocation();
            if (user.locationid > 0)
            {
                organisationlocation = (await organisationlocationservice.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = user.locationid
                })).FirstOrDefault();
            }

            if (user.locationid > 0 && organisationlocation == null)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organisation location not found");
            }

            result.userid = user.id;
            result.usermobile = user.mobile;
            result.username = user.name;
            result.useremail = user.email;
            result.profileimage = user.profileimage;
            result.userpermission = user.attributes.permission;
            result.organisationid = organisation.id;
            result.organisationlocationid = organisationlocation.id;
            result.organisationlocationname = organisationlocation.name;
            result.refreshtoken = usersession.code;
            result.accesstoken = GenerateJwtToken(new GenerateJwtTokenRequest
            {
                userid = user.id,
                usermobile = user.mobile,
                useremail = user.email,
                username = user.name,
                profileimage = user.profileimage,
                permissionhex = PermissionToHex(user.attributes.permission),
                organisationid = organisation.id,
                organisationname = organisation.name,
                organisationlocationid = organisationlocation.id,
                organisationlocationname = organisationlocation.name
            });
            return result;
        }

        /// <summary>
        /// Screen 2 of guided onboarding: create organisation + primary location for a user
        /// who registered with account details only (organisationid = 0).
        /// </summary>
        public async Task<UsersContext> CompleteBusinessOnboarding(CompleteBusinessOnboardingRequest req)
        {
            long userId = requeststate.usercontext?.userid ?? 0;
            if (userId <= 0)
            {
                throw new AppException(AppException.ErrorCodes.SessionInvalid, "Sign in to continue.");
            }

            if (req == null || string.IsNullOrWhiteSpace(req.organisationname))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization name is required.");
            }

            if (req.primarytype <= 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Business type is required.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            try
            {
                await db.BeginTransaction();
                var result = await CompleteBusinessOnboardingTransaction(db, userId, req);
                await db.CommitTransaction();
                return result;
            }
            catch
            {
                try { await db.RollbackTransaction(); } catch { /* ignore */ }
                throw;
            }
        }

        public async Task<UsersContext> CompleteBusinessOnboardingTransaction(
            IDb db,
            long userId,
            CompleteBusinessOnboardingRequest req)
        {
            var users = await usersService.SelectTransaction(db, new UsersSelectReq { id = userId });
            var user = users?.FirstOrDefault();
            if (user == null || !user.isactive)
            {
                throw new AppException(AppException.ErrorCodes.UserNotFound);
            }

            string orgName = req.organisationname.Trim();

            Organisation? existingOrg = null;
            if (user.organisationid > 0)
            {
                existingOrg = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = user.organisationid
                })).FirstOrDefault();

                // Profile already finished for this org — idempotent return.
                if (existingOrg != null && !IsOnboardingDraftOrganisation(existingOrg))
                {
                    return await BuildContextForUserTransaction(db, user);
                }
            }

            // Unique name (exclude the draft org being updated).
            string duplicateOrgNameQuery = @"
                SELECT id FROM Organisation
                WHERE LOWER(TRIM(name)) = LOWER(TRIM(@name)) AND isactive = true
                  AND id <> @excludeId
                LIMIT 1";
            DbCommand dupNameCmd = db.GetCommand(duplicateOrgNameQuery);
            db.AddParameter(dupNameCmd, "name", DbTypes.Types.String).Value = orgName;
            db.AddParameter(dupNameCmd, "excludeId", DbTypes.Types.Long).Value = existingOrg?.id ?? 0L;
            using (DbDataReader reader = await db.Execute(dupNameCmd))
            {
                if (await reader.ReadAsync())
                {
                    throw new AppException(
                        AppException.ErrorCodes.OrganisationDuplicate,
                        $"Organization name '{orgName}' is already registered. Please use a different name.");
                }
            }

            if (!string.IsNullOrWhiteSpace(req.organisationgstnumber))
            {
                string gst = req.organisationgstnumber.Trim();
                string duplicateGstQuery = @"
                    SELECT id FROM Organisation
                    WHERE gstnumber = @gstnumber AND isactive = true
                      AND id <> @excludeId
                    LIMIT 1";
                DbCommand dupGstCmd = db.GetCommand(duplicateGstQuery);
                db.AddParameter(dupGstCmd, "gstnumber", DbTypes.Types.String).Value = gst;
                db.AddParameter(dupGstCmd, "excludeId", DbTypes.Types.Long).Value = existingOrg?.id ?? 0L;
                using DbDataReader gstReader = await db.Execute(dupGstCmd);
                if (await gstReader.ReadAsync())
                {
                    throw new AppException(
                        AppException.ErrorCodes.OrganisationDuplicate,
                        $"Organization with GST number {gst} is already registered.");
                }
            }

            Organisation organisation;
            if (existingOrg != null && IsOnboardingDraftOrganisation(existingOrg))
            {
                organisation = existingOrg;
                organisation.name = orgName;
                organisation.primarytype = req.primarytype;
                organisation.secondarytype = req.secondarytype;
                organisation.primarytypecode = req.primarytypecode ?? "";
                organisation.secondarytypecode = req.secondarytypecode ?? "";
                organisation.gstnumber = req.organisationgstnumber?.Trim() ?? "";
                organisation.organisationlogo = req.organisationlogo;
                organisation.notes = "";
                organisation.subscription_plan_code =
                    string.IsNullOrWhiteSpace(req.plan_code) ? "free" : req.plan_code.Trim();
                await organisationservice.UpdateTransaction(db, organisation);
            }
            else
            {
                organisation = new Organisation
                {
                    name = orgName,
                    primarytype = req.primarytype,
                    secondarytype = req.secondarytype,
                    primarytypecode = req.primarytypecode ?? "",
                    secondarytypecode = req.secondarytypecode ?? "",
                    gstnumber = req.organisationgstnumber?.Trim() ?? "",
                    organisationlogo = req.organisationlogo,
                    subscription_plan_code = string.IsNullOrWhiteSpace(req.plan_code) ? "free" : req.plan_code.Trim(),
                };
                await organisationservice.InsertTransaction(db, organisation);
            }

            if (organisation.id > 0 && !string.IsNullOrWhiteSpace(req.referral_code)
                && organisation.referred_by_organisation_id <= 0)
            {
                var referralApplied = await organisationReferralService.TryApplyReferralOnSignupTransaction(
                    db, organisation.id, req.referral_code);
                if (!referralApplied)
                {
                    throw new AppException(
                        AppException.ErrorCodes.BadRequest,
                        "Invalid referral code. Please check the code and try again.");
                }
            }

            // Ensure a primary location exists (draft signup creates org without location).
            if (user.locationid <= 0)
            {
                string locationSlug = new string(orgName.Where(char.IsLetterOrDigit).Take(24).ToArray());
                if (string.IsNullOrWhiteSpace(locationSlug))
                {
                    locationSlug = "Main";
                }

                var organisationlocation = new OrganisationLocation
                {
                    organisationid = organisation.id,
                    name = locationSlug,
                    addressline1 = "",
                    addressline2 = "",
                    city = "",
                    state = "",
                    country = "India",
                    pincode = "",
                    latitude = 0,
                    longitude = 0,
                    googlelocation = "",
                    templateid = 0,
                };
                await organisationlocationservice.InsertTransaction(db, organisationlocation);
                user.locationid = organisationlocation.id;
            }

            user.organisationid = organisation.id;
            if (!string.IsNullOrWhiteSpace(req.userdesignation))
            {
                user.designation = req.userdesignation.Trim();
            }
            user.modifiedon = DateTime.UtcNow;
            await usersService.UpdateTransaction(db, user);

            return await BuildContextForUserTransaction(db, user);
        }

        async Task<UsersContext> BuildContextForUserTransaction(IDb db, Users user)
        {
            Organisation? organisation = null;
            if (user.organisationid > 0)
            {
                organisation = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = user.organisationid
                })).FirstOrDefault();
            }

            OrganisationLocation? organisationlocation = null;
            if (user.locationid > 0)
            {
                organisationlocation = (await organisationlocationservice.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = user.locationid
                })).FirstOrDefault();
            }

            var usersession = new UserSession
            {
                userid = user.id,
                code = Guid.NewGuid().ToString(),
                starttime = DateTime.UtcNow,
                endtime = DateTime.UtcNow.AddYears(1),
            };
            await usersessionservice.InsertTransaction(db, usersession);

            var result = new UsersContext
            {
                userid = user.id,
                usermobile = user.mobile ?? "",
                username = user.name ?? "",
                useremail = user.email ?? "",
                profileimage = user.profileimage,
                userpermission = user.attributes?.permission ?? new UsersPermissionData(),
                isStaff = false,
                organisationid = organisation?.id ?? 0,
                organisationname = organisation?.name ?? "",
                organisationlocationid = organisationlocation?.id ?? 0,
                organisationlocationname = organisationlocation?.name ?? "",
                refreshtoken = usersession.code,
            };
            result.accesstoken = GenerateJwtToken(new GenerateJwtTokenRequest
            {
                userid = user.id,
                usermobile = user.mobile ?? "",
                useremail = user.email ?? "",
                username = user.name ?? "",
                profileimage = user.profileimage,
                permissionhex = PermissionToHex(user.attributes?.permission ?? new UsersPermissionData()),
                organisationid = organisation?.id ?? 0,
                organisationname = organisation?.name ?? "",
                organisationlocationid = organisationlocation?.id ?? 0,
                organisationlocationname = organisationlocation?.name ?? "",
            });
            return result;
        }

        public async Task<UsersContext> GoogleLogin(GoogleLoginRequest req)
        {
            UsersContext result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    result = await GoogleLoginTransaction(db, req);
                    await db.CommitTransaction();
                }
                catch (Exception)
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return result;
        }

        public async Task<UsersContext> GoogleLoginTransaction(IDb db, GoogleLoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.email))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Google account email is required.");
            }

            var email = req.email.Trim();
            var users = await usersService.SelectTransaction(db, new UsersSelectReq
            {
                email = email
            });

            if (users == null || users.Count == 0)
            {
                throw new AppException(
                    AppException.ErrorCodes.UsersNotFound,
                    "No account found for this Google email. Please sign up first.");
            }

            var user = users.First();
            if (!string.IsNullOrWhiteSpace(req.name) && string.IsNullOrWhiteSpace(user.name))
            {
                user.name = req.name.Trim();
            }

            // Business Google continue: attach a draft org when the user has none yet.
            if (req.is_business_registration && user.organisationid <= 0)
            {
                var draftKey = !string.IsNullOrWhiteSpace(user.mobile)
                    ? NormalizeIndianMobile(user.mobile)
                    : email;
                var organisation = new Organisation
                {
                    name = $"Pending setup · {draftKey}",
                    primarytype = 0,
                    secondarytype = 0,
                    primarytypecode = "",
                    secondarytypecode = "",
                    gstnumber = "",
                    subscription_plan_code = "free",
                    notes = OnboardingDraftOrgNotes,
                };
                await organisationservice.InsertTransaction(db, organisation);
                user.organisationid = organisation.id;
            }

            user.isactive = true;
            user.accountactive = true;
            user.modifiedon = DateTime.UtcNow;
            await usersService.UpdateTransaction(db, user);

            return await BuildContextForUserTransaction(db, user);
        }
    }
}

