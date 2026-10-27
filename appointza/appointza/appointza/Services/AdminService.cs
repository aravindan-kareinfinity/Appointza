using System.Data.Common;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using appointza.Models;
using appointza.Utils;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace appointza.Services
{
    public class AdminService
    {
        public const string TokenKindPlatformAdmin = "platform_admin";
        private const string PasswordPepperPrefix = "appointza-platform-admin:";

        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        ApplicationEnvironment applicationenvironment;
        ILogger<AdminService> logger;

        public AdminService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, 
            IOptions<ApplicationEnvironment> applicationenvironment, ILogger<AdminService> logger)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.applicationenvironment = applicationenvironment.Value;
            this.logger = logger;
        }

        public static string HashPassword(string password)
        {
            var bytes = Encoding.UTF8.GetBytes(PasswordPepperPrefix + (password ?? ""));
            return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        }

        public string GenerateAdminJwtToken(Admin admin)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(applicationenvironment.jwtsecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim("token_kind", TokenKindPlatformAdmin),
                new Claim("adminid", admin.id.ToString()),
                new Claim("adminemail", admin.email ?? ""),
                new Claim("adminname", admin.name ?? ""),
                new Claim("adminmobile", admin.mobile ?? ""),
            };
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public AdminContext? JwtTokenToAdminContext(string token)
        {
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

                var jwt = (JwtSecurityToken)validatedToken;
                var kind = jwt.Claims.FirstOrDefault(c => c.Type == "token_kind")?.Value ?? "";
                if (!string.Equals(kind, TokenKindPlatformAdmin, StringComparison.Ordinal))
                {
                    return null;
                }

                return new AdminContext
                {
                    adminid = long.Parse(jwt.Claims.First(c => c.Type == "adminid").Value),
                    adminemail = jwt.Claims.FirstOrDefault(c => c.Type == "adminemail")?.Value ?? "",
                    adminname = jwt.Claims.FirstOrDefault(c => c.Type == "adminname")?.Value ?? "",
                    adminmobile = jwt.Claims.FirstOrDefault(c => c.Type == "adminmobile")?.Value ?? "",
                    role = TokenKindPlatformAdmin,
                    accesstoken = token,
                };
            }
            catch
            {
                return null;
            }
        }

        // 1. API to get total count organization total isverified and not verified
        public async Task<AdminOrganizationStats> GetOrganizationVerificationStats()
        {
            AdminOrganizationStats result = new AdminOrganizationStats();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetOrganizationVerificationStatsTransaction(db);
            }
            return result;
        }

        public async Task<AdminOrganizationStats> GetOrganizationVerificationStatsTransaction(IDb db)
        {
            var result = new AdminOrganizationStats();
            
            // Get total organizations
            string totalQuery = @"
                SELECT COUNT(*) as total_count
                FROM Organisation
                WHERE isactive = true
            ";
            
            DbCommand totalCommand = db.GetCommand(totalQuery);
            using (DbDataReader reader = await db.Execute(totalCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.TotalOrganizations = reader["total_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_count"]);
                }
            }

            // Get verified organizations (assuming there's an isverified field or similar logic)
            string verifiedQuery = @"
                SELECT COUNT(*) as verified_count
                FROM Organisation
                WHERE isactive = true AND issuspended = false
            ";
            
            DbCommand verifiedCommand = db.GetCommand(verifiedQuery);
            using (DbDataReader reader = await db.Execute(verifiedCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.VerifiedOrganizations = reader["verified_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["verified_count"]);
                }
            }

            result.NotVerifiedOrganizations = result.TotalOrganizations - result.VerifiedOrganizations;
            
            return result;
        }

        // Organization Location Stats
        public async Task<AdminOrganizationLocationStats> GetOrganizationLocationStats()
        {
            AdminOrganizationLocationStats result = new AdminOrganizationLocationStats();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetOrganizationLocationStatsTransaction(db);
            }
            return result;
        }

        public async Task<AdminOrganizationLocationStats> GetOrganizationLocationStatsTransaction(IDb db)
        {
            var result = new AdminOrganizationLocationStats();
            
            // Get total organizations
            string totalOrgQuery = @"
                SELECT COUNT(*) as total_count
                FROM Organisation
                WHERE isactive = true
            ";
            
            DbCommand totalOrgCommand = db.GetCommand(totalOrgQuery);
            using (DbDataReader reader = await db.Execute(totalOrgCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.TotalOrganizations = reader["total_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_count"]);
                }
            }

            // Get total locations
            string totalLocQuery = @"
                SELECT COUNT(*) as total_count
                FROM OrganisationLocation
            ";
            
            DbCommand totalLocCommand = db.GetCommand(totalLocQuery);
            using (DbDataReader reader = await db.Execute(totalLocCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.TotalLocations = reader["total_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_count"]);
                }
            }

            // Get verified locations (isverified = true AND isactive = true)
            string verifiedQuery = @"
                SELECT COUNT(*) as verified_count
                FROM OrganisationLocation
                WHERE isverified = true AND isactive = true
            ";
            
            DbCommand verifiedCommand = db.GetCommand(verifiedQuery);
            using (DbDataReader reader = await db.Execute(verifiedCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.VerifiedLocations = reader["verified_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["verified_count"]);
                }
            }

            // Get not verified locations (isverified = false AND isactive = true)
            string notVerifiedQuery = @"
                SELECT COUNT(*) as not_verified_count
                FROM OrganisationLocation
                WHERE isverified = false AND isactive = true
            ";
            
            DbCommand notVerifiedCommand = db.GetCommand(notVerifiedQuery);
            using (DbDataReader reader = await db.Execute(notVerifiedCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.NotVerifiedLocations = reader["not_verified_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["not_verified_count"]);
                }
            }

            // Get rejected locations (isactive = false)
            string rejectedQuery = @"
                SELECT COUNT(*) as rejected_count
                FROM OrganisationLocation
                WHERE isactive = false
            ";
            
            DbCommand rejectedCommand = db.GetCommand(rejectedQuery);
            using (DbDataReader reader = await db.Execute(rejectedCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.RejectedLocations = reader["rejected_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["rejected_count"]);
                }
            }
            
            return result;
        }

        // 2. API to get total appointment count and confirmed count and pending and cancel count
        public async Task<AdminAppointmentStats> GetAppointmentStats(AdminAppointmentStatsReq req)
        {
            AdminAppointmentStats result = new AdminAppointmentStats();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetAppointmentStatsTransaction(db, req);
            }
            return result;
        }

        public async Task<AdminAppointmentStats> GetAppointmentStatsTransaction(IDb db, AdminAppointmentStatsReq req)
        {
            var result = new AdminAppointmentStats();
            
            // Build date filter
            string dateFilter = "";
            if (req.SingleDate.HasValue)
            {
                dateFilter = $" AND appoinmentdate = @singleDate";
            }
            else if (req.FromDate.HasValue && req.ToDate.HasValue)
            {
                dateFilter = $" AND appoinmentdate >= @fromDate AND appoinmentdate <= @toDate";
            }
            else if (req.FromDate.HasValue)
            {
                dateFilter = $" AND appoinmentdate >= @fromDate";
            }
            else if (req.ToDate.HasValue)
            {
                dateFilter = $" AND appoinmentdate <= @toDate";
            }
            
            // Build location filter
            string locationFilter = "";
            if (req.OrganisationLocationId.HasValue && req.OrganisationLocationId.Value > 0)
            {
                locationFilter = $" AND organisationlocationid = @organisationLocationId";
            }
            
            // Get total appointments
            string totalQuery = $@"
                SELECT COUNT(*) as total_count
                FROM Appoinment
                WHERE isactive = true {dateFilter} {locationFilter}
            ";
            
            DbCommand totalCommand = db.GetCommand(totalQuery);
            if (req.SingleDate.HasValue)
            {
                db.AddParameter(totalCommand, "singleDate", DbTypes.Types.Date).Value = req.SingleDate.Value.Date;
            }
            if (req.FromDate.HasValue)
            {
                db.AddParameter(totalCommand, "fromDate", DbTypes.Types.Date).Value = req.FromDate.Value.Date;
            }
            if (req.ToDate.HasValue)
            {
                db.AddParameter(totalCommand, "toDate", DbTypes.Types.Date).Value = req.ToDate.Value.Date;
            }
            if (req.OrganisationLocationId.HasValue && req.OrganisationLocationId.Value > 0)
            {
                db.AddParameter(totalCommand, "organisationLocationId", DbTypes.Types.Long).Value = req.OrganisationLocationId.Value;
            }
            
            using (DbDataReader reader = await db.Execute(totalCommand))
            {
                if (await reader.ReadAsync())
                {
                    result.TotalAppointments = reader["total_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_count"]);
                }
            }

            // Group by statuscode and get counts for each distinct statuscode
            string groupedQuery = $@"
                SELECT 
                    COALESCE(statuscode, 'Not Responsed') as statuscode,
                    COUNT(*) as count
                FROM Appoinment
                WHERE isactive = true {dateFilter} {locationFilter}
                GROUP BY statuscode
                ORDER BY count DESC
            ";
            
            DbCommand groupedCommand = db.GetCommand(groupedQuery);
            if (req.SingleDate.HasValue)
            {
                db.AddParameter(groupedCommand, "singleDate", DbTypes.Types.Date).Value = req.SingleDate.Value.Date;
            }
            if (req.FromDate.HasValue)
            {
                db.AddParameter(groupedCommand, "fromDate", DbTypes.Types.Date).Value = req.FromDate.Value.Date;
            }
            if (req.ToDate.HasValue)
            {
                db.AddParameter(groupedCommand, "toDate", DbTypes.Types.Date).Value = req.ToDate.Value.Date;
            }
            if (req.OrganisationLocationId.HasValue && req.OrganisationLocationId.Value > 0)
            {
                db.AddParameter(groupedCommand, "organisationLocationId", DbTypes.Types.Long).Value = req.OrganisationLocationId.Value;
            }
            
            using (DbDataReader reader = await db.Execute(groupedCommand))
            {
                while (await reader.ReadAsync())
                {
                    string statusCode = reader["statuscode"]?.ToString() ?? "Not Responsed";
                    int count = reader["count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["count"]);
                    
                    result.StatusCounts.Add(new AppointmentStatusCount
                    {
                        StatusCode = statusCode,
                        Count = count
                    });
                }
            }
            
            return result;
        }

        // 3. API that lists all the organisation locations
        public async Task<List<AdminOrganisationLocation>> GetAllOrganisationLocations()
        {
            List<AdminOrganisationLocation> result = new List<AdminOrganisationLocation>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetAllOrganisationLocationsTransaction(db);
            }
            return result;
        }

        public async Task<List<AdminOrganisationLocation>> GetAllOrganisationLocationsTransaction(IDb db)
        {
            List<AdminOrganisationLocation> result = new List<AdminOrganisationLocation>();
            
            string query = @"
                SELECT 
                    ol.id,
                    ol.name,
                    ol.addressline1,
                    ol.addressline2,
                    ol.city,
                    ol.state,
                    ol.country,
                    ol.pincode,
                    ol.latitude,
                    ol.longitude,
                    ol.googlelocation,
                    ol.createdon,
                    ol.isactive,
                    ol.isverified,
                    o.id as organisationid,
                    o.name as organisationname,
                    o.gstnumber,
                    o.primarytypecode,
                    o.secondarytypecode,
                    COALESCE(
                        (o.attributes::json->>'mobile')::text,
                        (o.attributes::json->>'phone')::text,
                        (o.attributes::json->>'mobilenumber')::text,
                        (o.attributes::json->>'phonenumber')::text,
                        ''
                    ) as organisationmobile,
                    COALESCE(
                        (SELECT u.mobile FROM Users u 
                         WHERE u.organisationid = o.id 
                         AND (u.locationid = ol.id OR u.locationid = 0)
                         AND u.isactive = true
                         ORDER BY u.createdon ASC
                         LIMIT 1),
                        ''
                    ) as usermobile
                FROM OrganisationLocation ol
                LEFT JOIN Organisation o ON ol.organisationid = o.id
                ORDER BY ol.createdon DESC
            ";
            
            DbCommand command = db.GetCommand(query);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var location = new AdminOrganisationLocation
                    {
                        id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                        name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString(),
                        addressline1 = reader["addressline1"] == DBNull.Value ? "" : reader["addressline1"].ToString(),
                        addressline2 = reader["addressline2"] == DBNull.Value ? "" : reader["addressline2"].ToString(),
                        city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString(),
                        state = reader["state"] == DBNull.Value ? "" : reader["state"].ToString(),
                        country = reader["country"] == DBNull.Value ? "" : reader["country"].ToString(),
                        pincode = reader["pincode"] == DBNull.Value ? "" : reader["pincode"].ToString(),
                        latitude = reader["latitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["latitude"]),
                        longitude = reader["longitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["longitude"]),
                        googlelocation = reader["googlelocation"] == DBNull.Value ? "" : reader["googlelocation"].ToString(),
                        createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]),
                        isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]),
                        isverified = reader["isverified"] == DBNull.Value ? false : Convert.ToBoolean(reader["isverified"]),
                        organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]),
                        organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString(),
                        organisationgstnumber = reader["gstnumber"] == DBNull.Value ? "" : reader["gstnumber"].ToString(),
                        organisationprimarytypecode = reader["primarytypecode"] == DBNull.Value ? "" : reader["primarytypecode"].ToString(),
                        organisationsecondarytypecode = reader["secondarytypecode"] == DBNull.Value ? "" : reader["secondarytypecode"].ToString(),
                        organisationmobile = reader["organisationmobile"] == DBNull.Value ? "" : reader["organisationmobile"].ToString(),
                        usermobile = reader["usermobile"] == DBNull.Value ? "" : reader["usermobile"].ToString()
                    };
                    result.Add(location);
                }
            }
            
            return result;
        }

        // 4. API that makes organisation isverified true and false
        public async Task<bool> ToggleOrganisationVerification(long organisationId, bool isVerified)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await ToggleOrganisationVerificationTransaction(db, organisationId, isVerified);
            }
            return result;
        }

        public async Task<bool> ToggleOrganisationVerificationTransaction(IDb db, long organisationId, bool isVerified)
        {
            bool result = false;
            
            // Update the organisation's verification status
            // Assuming we use issuspended field to represent verification status
            // If issuspended = false, it means verified
            // If issuspended = true, it means not verified
            string query = @"
                UPDATE Organisation
                SET issuspended = @issuspended,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = version + 1
                WHERE id = @id AND isactive = true
            ";
            
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = !isVerified; // Inverted because issuspended = false means verified
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.userid;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            
            return result;
        }

        // Additional helper methods for the controller
        public async Task<List<Admin>> Select(AdminSelectReq req)
        {
            List<Admin> result = new List<Admin>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Admin>> SelectTransaction(IDb db, AdminSelectReq req)
        {
            var result = new List<Admin>();
            var sql = @"
                SELECT id, email, name, '' AS mobile, isactive, 0 AS version,
                       0 AS createdby, created_at AS createdon, 0 AS modifiedby, updated_at AS modifiedon, '' AS notes
                FROM platform_admins
                WHERE (@id = 0 OR id = @id)
                  AND (@email = '' OR LOWER(email) = LOWER(@email))
                ORDER BY id ASC;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req?.id ?? 0;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = req?.email?.Trim() ?? "";
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                result.Add(MapAdmin(reader));
            }
            return result;
        }

        public async Task<Admin> Insert(Admin admin)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, admin);
            }
            return admin;
        }

        public async Task InsertTransaction(IDb db, Admin admin)
        {
            var email = (admin.email ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(email))
                throw new Exception("Admin email is required.");
            if (string.IsNullOrWhiteSpace(admin.password))
                throw new Exception("Admin password is required.");

            var sql = @"
                INSERT INTO platform_admins (email, name, password_hash, isactive, created_at, updated_at)
                VALUES (@email, @name, @password_hash, @isactive, @created_at, @updated_at)
                RETURNING id;";
            using var command = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = admin.name?.Trim() ?? "";
            db.AddParameter(command, "password_hash", DbTypes.Types.String).Value = HashPassword(admin.password);
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            using var reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                admin.id = Convert.ToInt64(reader["id"]);
            }
            admin.password = "";
            admin.isactive = true;
        }

        public async Task<Admin> Update(Admin admin)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, admin);
            }
            return admin;
        }

        public async Task<bool> UpdateTransaction(IDb db, Admin admin)
        {
            var sql = @"
                UPDATE platform_admins
                SET name = @name,
                    isactive = @isactive,
                    updated_at = @updated_at
                WHERE id = @id;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = admin.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = admin.name?.Trim() ?? "";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = admin.isactive;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<bool> Delete(AdminDeleteReq admin)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await DeleteTransaction(db, admin);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, AdminDeleteReq admin)
        {
            using var command = db.GetCommand(@"
                UPDATE platform_admins
                SET isactive = FALSE, updated_at = @updated_at
                WHERE id = @id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = admin.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<AdminContext> Login(AdminLoginReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await LoginTransaction(db, req);
            }
        }

        public async Task<AdminContext> LoginTransaction(IDb db, AdminLoginReq req)
        {
            var email = (req?.email ?? "").Trim();
            var password = req?.password ?? "";
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                throw new Exception("Email and password are required.");
            }

            using var command = db.GetCommand(@"
                SELECT id, email, name, password_hash, isactive
                FROM platform_admins
                WHERE LOWER(email) = LOWER(@email)
                LIMIT 1;");
            db.AddParameter(command, "email", DbTypes.Types.String).Value = email;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception("Invalid admin email or password.");
            }

            var isActive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]);
            if (!isActive)
            {
                throw new Exception("Admin account is inactive.");
            }

            var storedHash = reader["password_hash"]?.ToString() ?? "";
            var incomingHash = HashPassword(password);
            if (!FixedTimeEqualsHex(storedHash, incomingHash))
            {
                throw new Exception("Invalid admin email or password.");
            }

            var admin = new Admin
            {
                id = Convert.ToInt64(reader["id"]),
                email = reader["email"]?.ToString() ?? "",
                name = reader["name"]?.ToString() ?? "",
                mobile = "",
                isactive = true,
            };

            var token = GenerateAdminJwtToken(admin);
            return new AdminContext
            {
                adminid = admin.id,
                adminemail = admin.email,
                adminname = admin.name,
                adminmobile = "",
                accesstoken = token,
                refreshtoken = "",
                role = TokenKindPlatformAdmin,
            };
        }

        public async Task<AdminContext> ChangePassword(long adminId, AdminChangePasswordReq req)
        {
            using var db = await dbprovider.GetDb();
            await db.Connect();

            if (adminId <= 0)
                throw new Exception("Admin session required.");
            if (string.IsNullOrWhiteSpace(req?.new_password) || req.new_password.Length < 8)
                throw new Exception("New password must be at least 8 characters.");

            using var find = db.GetCommand(@"
                SELECT id, email, name, password_hash, isactive
                FROM platform_admins WHERE id = @id LIMIT 1;");
            db.AddParameter(find, "id", DbTypes.Types.Long).Value = adminId;
            using var reader = await db.Execute(find);
            if (!await reader.ReadAsync())
                throw new Exception("Admin not found.");

            var storedHash = reader["password_hash"]?.ToString() ?? "";
            if (!FixedTimeEqualsHex(storedHash, HashPassword(req.current_password ?? "")))
                throw new Exception("Current password is incorrect.");

            var email = reader["email"]?.ToString() ?? "";
            var name = reader["name"]?.ToString() ?? "";

            using var update = db.GetCommand(@"
                UPDATE platform_admins
                SET password_hash = @password_hash, updated_at = @updated_at
                WHERE id = @id;");
            db.AddParameter(update, "id", DbTypes.Types.Long).Value = adminId;
            db.AddParameter(update, "password_hash", DbTypes.Types.String).Value = HashPassword(req.new_password);
            db.AddParameter(update, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(update);

            var admin = new Admin { id = adminId, email = email, name = name };
            var token = GenerateAdminJwtToken(admin);
            return new AdminContext
            {
                adminid = admin.id,
                adminemail = admin.email,
                adminname = admin.name,
                accesstoken = token,
                role = TokenKindPlatformAdmin,
            };
        }

        private static Admin MapAdmin(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            email = reader["email"]?.ToString() ?? "",
            name = reader["name"]?.ToString() ?? "",
            mobile = reader["mobile"]?.ToString() ?? "",
            password = "",
            isactive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]),
            version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]),
            createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]),
            createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]),
            modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]),
            modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]),
            notes = reader["notes"]?.ToString() ?? "",
        };

        private static bool FixedTimeEqualsHex(string a, string b)
        {
            var ba = Encoding.UTF8.GetBytes((a ?? "").Trim().ToLowerInvariant());
            var bb = Encoding.UTF8.GetBytes((b ?? "").Trim().ToLowerInvariant());
            if (ba.Length != bb.Length) return false;
            return CryptographicOperations.FixedTimeEquals(ba, bb);
        }

        public async Task<AdminDashboardStats> GetDashboardStats(AdminDashboardStatsReq req)
        {
            AdminDashboardStats result = new AdminDashboardStats();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetDashboardStatsTransaction(db, req);
            }
            return result;
        }

        public async Task<AdminDashboardStats> GetDashboardStatsTransaction(IDb db, AdminDashboardStatsReq req)
        {
            var result = new AdminDashboardStats();
            
            // Get organization stats
            result.OrganizationStats = await GetOrganizationVerificationStatsTransaction(db);
            
            // Get appointment stats (all appointments, no date filter)
            var appointmentStatsReq = new AdminAppointmentStatsReq();
            result.AppointmentStats = await GetAppointmentStatsTransaction(db, appointmentStatsReq);
            
            return result;
        }

        public async Task<List<Users>> GetAllUsers(AdminGetAllUsersReq req)
        {
            List<Users> result = new List<Users>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetAllUsersTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Users>> GetAllUsersTransaction(IDb db, AdminGetAllUsersReq req)
        {
            List<Users> result = new List<Users>();
            
            string query = @"
                SELECT 
                    Users.id,
                    Users.name,
                    Users.email,
                    Users.mobile,
                    Users.mobilecountrycode,
                    Users.designation,
                    Users.organisationid,
                    Users.locationid,
                    Users.profileimage,
                    Users.version,
                    Users.createdby,
                    Users.createdon,
                    Users.modifiedby,
                    Users.modifiedon,
                    Users.attributes,
                    Users.isactive,
                    Users.issuspended,
                    Users.parentid,
                    Users.isfactory,
                    Users.notes,
                    Users.isverified,
                    Users.accountactive,
                    Users.push_token
                FROM Users
            ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.OrganisationId.HasValue && req.OrganisationId.Value > 0)
            {
                queryBuilder.AddParameter("Users.organisationid", "=", "organisationid", req.OrganisationId.Value, DbTypes.Types.Long);
            }
            
            if (req.IsActive.HasValue)
            {
                queryBuilder.AddParameter("Users.isactive", "=", "isactive", req.IsActive.Value, DbTypes.Types.Boolean);
            }
            else
            {
                // By default, show active users
                queryBuilder.AddParameter("Users.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            }
            
            if (!string.IsNullOrEmpty(req.SearchTerm))
            {
                queryBuilder.AddParameter("(LOWER(Users.name) LIKE @searchterm OR LOWER(Users.mobile) LIKE @searchterm OR LOWER(Users.email) LIKE @searchterm)", "searchterm", $"%{req.SearchTerm.ToLower()}%", DbTypes.Types.String);
            }
            
            // Pagination
            long offset = (req.PageNumber - 1) * req.PageSize;
            queryBuilder.AddLimitOffset(req.PageSize, offset);
            
            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "Users.createdon");
            
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Users user = new Users();
                    user.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    user.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    user.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    user.mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    user.mobilecountrycode = reader["mobilecountrycode"] == DBNull.Value ? "" : reader["mobilecountrycode"].ToString();
                    user.designation = reader["designation"] == DBNull.Value ? "" : reader["designation"].ToString();
                    user.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    user.locationid = reader["locationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["locationid"]);
                    user.profileimage = reader["profileimage"] == DBNull.Value ? 0 : Convert.ToInt64(reader["profileimage"]);
                    user.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    user.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    user.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    user.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    user.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);
                    user.attributes_json = reader["attributes"] == DBNull.Value ? "{}" : reader["attributes"].ToString();
                    user.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    user.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    user.parentid = reader["parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["parentid"]);
                    user.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
                    user.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    user.isverified = reader["isverified"] == DBNull.Value ? false : Convert.ToBoolean(reader["isverified"]);
                    user.accountactive = reader["accountactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["accountactive"]);
                    user.push_token = reader["push_token"] == DBNull.Value ? "" : reader["push_token"].ToString();
                    
                    result.Add(user);
                }
            }
            
            return result;
        }

        public async Task<List<Organisation>> GetAllOrganisations(AdminGetAllOrganisationsReq req)
        {
            List<Organisation> result = new List<Organisation>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await GetAllOrganisationsTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Organisation>> GetAllOrganisationsTransaction(IDb db, AdminGetAllOrganisationsReq req)
        {
            List<Organisation> result = new List<Organisation>();
            
            string query = @"
                SELECT Organisation.id,Organisation.name,Organisation.gstnumber,Organisation.secondarytypecode,Organisation.secondarytype,Organisation.primarytype,Organisation.imageid,Organisation.organisationlogo,Organisation.tagline,Organisation.primarytypecode,Organisation.version,Organisation.createdby,Organisation.createdon,Organisation.modifiedby,Organisation.modifiedon,Organisation.attributes,Organisation.isactive,Organisation.issuspended,Organisation.parentid,Organisation.isfactory,Organisation.notes,Organisation.booking_amount,Organisation.isserviceamount
                FROM Organisation
            ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            // Apply filters based on request parameters
            
            // Filter by IsActive only when explicitly requested (admin console lists all by default)
            if (req.IsActive.HasValue)
            {
                queryBuilder.AddParameter("Organisation.isactive", "=", "isactive", req.IsActive.Value, DbTypes.Types.Boolean);
            }
            
            // Filter by IsVerified if provided
            // Note: issuspended = false means verified, issuspended = true means not verified
            if (req.IsVerified.HasValue)
            {
                queryBuilder.AddParameter("Organisation.issuspended", "=", "issuspended", !req.IsVerified.Value, DbTypes.Types.Boolean);
            }
            
            // Search by SearchTerm if provided (search in name and gstnumber)
            if (!string.IsNullOrWhiteSpace(req.SearchTerm))
            {
                queryBuilder.AddParameter("(LOWER(Organisation.name) LIKE @searchterm OR LOWER(Organisation.gstnumber) LIKE @searchterm)", "searchterm", $"%{req.SearchTerm.ToLower()}%", DbTypes.Types.String);
            }
            
            // Add ordering
            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "Organisation.createdon");
            
            // Apply pagination
            int offset = (req.PageNumber - 1) * req.PageSize;
            queryBuilder.AddLimitOffset(req.PageSize, offset);
            
            var command = queryBuilder.GetCommand(db);
            
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Organisation temp = new Organisation();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.gstnumber = reader["gstnumber"] == DBNull.Value ? "" : reader["gstnumber"].ToString();
                    temp.secondarytypecode = reader["secondarytypecode"] == DBNull.Value ? "" : reader["secondarytypecode"].ToString();
                    temp.secondarytype = reader["secondarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["secondarytype"]);
                    temp.primarytype = reader["primarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["primarytype"]);
                    temp.imageid = reader["imageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["imageid"]);
                    temp.organisationlogo = reader["organisationlogo"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlogo"]);
                    temp.tagline = reader["tagline"] == DBNull.Value ? "" : reader["tagline"].ToString();
                    temp.primarytypecode = reader["primarytypecode"] == DBNull.Value ? "" : reader["primarytypecode"].ToString();
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.parentid = reader["parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["parentid"]);
                    temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.booking_amount = reader["booking_amount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["booking_amount"]);
                    temp.isserviceamount = reader["isserviceamount"] == DBNull.Value ? false : Convert.ToBoolean(reader["isserviceamount"]);
                    
                    result.Add(temp);
                }
            }
            
            return result;
        }

        public async Task<bool> SuspendUser(AdminSuspendUserReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SuspendUserTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> SuspendUserTransaction(IDb db, AdminSuspendUserReq req)
        {
            // Implementation for suspending user
            return true;
        }

        public async Task<bool> ActivateUser(AdminActivateUserReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await ActivateUserTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> ActivateUserTransaction(IDb db, AdminActivateUserReq req)
        {
            // Implementation for activating user
            return true;
        }

        public async Task<bool> SuspendOrganisation(AdminSuspendOrganisationReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SuspendOrganisationTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> SuspendOrganisationTransaction(IDb db, AdminSuspendOrganisationReq req)
        {
            using var command = db.GetCommand(@"
                UPDATE Organisation
                SET isactive = FALSE,
                    issuspended = TRUE,
                    notes = CASE
                        WHEN COALESCE(@reason, '') = '' THEN notes
                        ELSE TRIM(BOTH FROM COALESCE(notes, '') || E'\n' || @reason)
                    END,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = COALESCE(version, 0) + 1
                WHERE id = @id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.OrganisationId;
            db.AddParameter(command, "reason", DbTypes.Types.String).Value = req.Reason ?? "";
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext?.userid ?? 0;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<bool> ActivateOrganisation(AdminActivateOrganisationReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await ActivateOrganisationTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> ActivateOrganisationTransaction(IDb db, AdminActivateOrganisationReq req)
        {
            using var command = db.GetCommand(@"
                UPDATE Organisation
                SET isactive = TRUE,
                    issuspended = FALSE,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = COALESCE(version, 0) + 1
                WHERE id = @id;");
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.OrganisationId;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext?.userid ?? 0;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            return await db.ExecuteNonQuery(command) > 0;
        }

        // 5. Toggle location verification
        public async Task<bool> ToggleLocationVerification(long locationId, bool isVerified)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                result = await ToggleLocationVerificationTransaction(db, locationId, isVerified);
                await db.CommitTransaction();
            }
            return result;
        }

        public async Task<bool> ToggleLocationVerificationTransaction(IDb db, long locationId, bool isVerified)
        {
            bool result = false;
            
            string query = @"
                UPDATE OrganisationLocation
                SET isverified = @isverified,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = version + 1
                WHERE id = @id
            ";
            
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(command, "isverified", DbTypes.Types.Boolean).Value = isVerified;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            
            int rowsAffected = await db.ExecuteNonQuery(command);
            result = rowsAffected > 0;
            
            return result;
        }

        // 6. Delete location (set isactive to false)
        public async Task<bool> DeleteLocation(long locationId)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                result = await DeleteLocationTransaction(db, locationId);
                await db.CommitTransaction();
            }
            return result;
        }

        public async Task<bool> DeleteLocationTransaction(IDb db, long locationId)
        {
            bool result = false;
            
            string query = @"
                UPDATE OrganisationLocation
                SET isactive = false,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = version + 1
                WHERE id = @id
            ";
            
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            
            int rowsAffected = await db.ExecuteNonQuery(command);
            result = rowsAffected > 0;
            
            return result;
        }

        // 7. Activate location (set isactive to true)
        public async Task<bool> ActivateLocation(long locationId)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                result = await ActivateLocationTransaction(db, locationId);
                await db.CommitTransaction();
            }
            return result;
        }

        public async Task<bool> ActivateLocationTransaction(IDb db, long locationId)
        {
            bool result = false;
            
            string query = @"
                UPDATE OrganisationLocation
                SET isactive = true,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = version + 1
                WHERE id = @id
            ";
            
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = locationId;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            
            int rowsAffected = await db.ExecuteNonQuery(command);
            result = rowsAffected > 0;
            
            return result;
        }
    }
}
