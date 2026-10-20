using Newtonsoft.Json;
using appointza.Models;
using appointza.Utils;
using System;
using System.Data.Common;
using System.Linq;

namespace appointza.Services
{
    public class OrganisationLocationService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        StaffService staffService;
        OrganisationService organisationservice;
        QRCoderService qrcoderservice;
        GoogleGeocodingService geocodingService;

        public OrganisationLocationService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, StaffService staffService, OrganisationService organisationservice, QRCoderService qrcoderservice, GoogleGeocodingService geocodingService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.staffService = staffService;
            this.organisationservice = organisationservice;
            this.qrcoderservice = qrcoderservice;
            this.geocodingService = geocodingService;
        }
        public async Task<List<OrganisationLocation>> Select(OrganisationLocationSelectReq req)
        {
            List<OrganisationLocation> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<OrganisationLocation>> SelectTransaction(IDb db, OrganisationLocationSelectReq req)
        {
            List<OrganisationLocation> result = new List<OrganisationLocation>();
                string query = @"
                SELECT OrganisationLocation.id,OrganisationLocation.organisationid,OrganisationLocation.name,OrganisationLocation.addressline1,OrganisationLocation.addressline2,OrganisationLocation.city,OrganisationLocation.state,OrganisationLocation.country,OrganisationLocation.latitude,OrganisationLocation.longitude,OrganisationLocation.googlelocation,OrganisationLocation.geolocation_url,OrganisationLocation.pincode,OrganisationLocation.customurl,OrganisationLocation.orgloctempid,OrganisationLocation.templateid,OrganisationLocation.version,OrganisationLocation.createdby,OrganisationLocation.createdon,OrganisationLocation.modifiedby,OrganisationLocation.modifiedon,OrganisationLocation.images,OrganisationLocation.attributes,OrganisationLocation.isactive,OrganisationLocation.issuspended,OrganisationLocation.parentid,OrganisationLocation.isfactory,OrganisationLocation.notes,OrganisationLocation.isverified,OrganisationLocation.ispaymentrequired as isPaymentRequired,OrganisationLocation.facility_list,OrganisationLocation.email,OrganisationLocation.whatsapp_mobile
                FROM OrganisationLocation
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("OrganisationLocation.id", "=", "id", req.id, DbTypes.Types.Long);
                }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("OrganisationLocation.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.organisationlocationid > 0)
            {
                queryBuilder.AddParameter("OrganisationLocation.id", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
            }
            if (!string.IsNullOrWhiteSpace(req.orgloctempid) && Guid.TryParse(req.orgloctempid.Trim(), out var orgLocTempId))
            {
                queryBuilder.AddParameter("OrganisationLocation.orgloctempid", "=", "orgloctempid", orgLocTempId, DbTypes.Types.Uuid);
            }
            queryBuilder.AddParameter("OrganisationLocation.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganisationLocation.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        OrganisationLocation temp = new OrganisationLocation();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
 temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
temp.addressline1 = reader["addressline1"] == DBNull.Value ? "" : reader["addressline1"].ToString();
temp.addressline2 = reader["addressline2"] == DBNull.Value ? "" : reader["addressline2"].ToString();
temp.city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString();
temp.state = reader["state"] == DBNull.Value ? "" : reader["state"].ToString();
temp.country = reader["country"] == DBNull.Value ? "" : reader["country"].ToString();
 temp.latitude = reader["latitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["latitude"]);
 temp.longitude = reader["longitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["longitude"]);
temp.googlelocation = reader["googlelocation"] == DBNull.Value ? "" : reader["googlelocation"].ToString();
temp.geolocation_url = reader["geolocation_url"] == DBNull.Value ? "" : reader["geolocation_url"].ToString();
temp.pincode = reader["pincode"] == DBNull.Value ? "" : reader["pincode"].ToString();
temp.customurl = reader["customurl"] == DBNull.Value ? "" : reader["customurl"].ToString();
temp.orgloctempid = reader["orgloctempid"] == DBNull.Value ? "" : reader["orgloctempid"].ToString();
 temp.templateid = reader["templateid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["templateid"]);
temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
 temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
 temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
temp.images_json = reader["images"] == DBNull.Value ? "null" : reader["images"].ToString();
temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
temp.facility_list_json = reader["facility_list"] == DBNull.Value ? "null" : reader["facility_list"].ToString();
temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
 temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
 temp.parentid = reader["parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["parentid"]);
 temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
temp.isverified = reader["isverified"] == DBNull.Value ? false : Convert.ToBoolean(reader["isverified"]);
temp.isPaymentRequired = reader["isPaymentRequired"] == DBNull.Value ? false : Convert.ToBoolean(reader["isPaymentRequired"]);
temp.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
temp.whatsapp_mobile = reader["whatsapp_mobile"] == DBNull.Value ? "" : reader["whatsapp_mobile"].ToString();
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<OrganisationLocation> Insert(OrganisationLocation organisationlocation)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                try
                {
                    // 🔍 DEBUGGER BREAKPOINT: Set breakpoint here - First line of Insert method
                    // Inspect: organisationlocation.facility_list
                    var facilityListJsonStart = organisationlocation.facility_list != null 
                        ? System.Text.Json.JsonSerializer.Serialize(organisationlocation.facility_list) 
                        : "null";
                    Console.WriteLine($"🔍 Insert START - facility_list count: {organisationlocation.facility_list?.Count ?? 0}, JSON: {facilityListJsonStart}");
                    Console.WriteLine($"🔍 Starting OrganisationLocation insert for organisation {organisationlocation.organisationid}");
                    Console.WriteLine($"🔍 User context ID: {requeststate.usercontext.id}");
                    
                    // 🔍 DEBUGGER BREAKPOINT: Check facility_list after geocoding
                    // Geocode the address to get latitude, longitude, and Google Maps link
                    await GeocodeLocation(organisationlocation);
                    
                    // 🔍 DEBUGGER: Verify facility_list still has data after GeocodeLocation
                    var afterGeocode = organisationlocation.facility_list?.Count ?? 0;
                    if (afterGeocode == 0 && facilityListJsonStart != "null" && facilityListJsonStart != "[]")
                    {
                        Console.WriteLine($"⚠️ WARNING: facility_list was lost during GeocodeLocation!");
                    }
                    
                    db.BeginTransaction();
                    await this.InsertTransaction(db, organisationlocation);
                    Console.WriteLine($"✅ OrganisationLocation inserted with ID: {organisationlocation.id}");
                    
                    // Only create staff record if user context ID is valid
                    if (requeststate.usercontext.id > 0)
                    {
                        try
                        {
                            await staffService.InsertTransaction(db, new Staff
                            {
                                userid = requeststate.usercontext.id,
                                organisationid = organisationlocation.organisationid,
                                organisationlocationid = organisationlocation.id,
                                roles = requeststate.usercontext.userpermission,
                            });
                            Console.WriteLine($"✅ Staff record created for user {requeststate.usercontext.id}");
                        }
                        catch (Exception staffEx)
                        {
                            Console.WriteLine($"⚠️ Staff creation failed: {staffEx.Message}");
                            // Don't throw - continue with location creation
                        }
                    }
                    else
                    {
                        Console.WriteLine("⚠️ Skipping staff creation - invalid user context ID");
                    }
                    
               
                    db.CommitTransaction();
                    Console.WriteLine("✅ Transaction committed successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Transaction failed: {ex.Message}");
                    await db.RollbackTransaction();
                    throw;
                }
                finally
                {
                    // Safely close the connection before disposal
                    try
                    {
                        if (db is PostgreSQL pgDb)
                        {
                            await pgDb.SafeCloseConnection();
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Warning: Error safely closing connection: {ex.Message}");
                    }
                }
            }
            return organisationlocation;
        }
        public async Task InsertTransaction(IDb db, OrganisationLocation organisationlocation)
        {
                await EnsureCustomUrlAvailableTransaction(db, organisationlocation);

                String query = @"
                INSERT INTO OrganisationLocation (
                    organisationid,name,addressline1,addressline2,city,state,country,latitude,longitude,googlelocation,geolocation_url,pincode,customurl,orgloctempid,templateid,version,createdby,createdon,modifiedby,modifiedon,images,attributes,isactive,issuspended,parentid,isfactory,notes,isverified,isPaymentRequired,facility_list,email,whatsapp_mobile
                )
                VALUES (
                   @organisationid,@name,@addressline1,@addressline2,@city,@state,@country,@latitude,@longitude,@googlelocation,@geolocation_url,@pincode,@customurl,@orgloctempid,@templateid,@version,@createdby,@createdon,@modifiedby,@modifiedon,@images,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes,@isverified,@isPaymentRequired,@facility_list,@email,@whatsapp_mobile
                )
                RETURNING id;
                ";
                organisationlocation.isactive = true;
                organisationlocation.version = 1;
                organisationlocation.orgloctempid = Guid.NewGuid().ToString();
                organisationlocation.createdon = DateTime.UtcNow;
                organisationlocation.createdby = requeststate.usercontext.id;
                organisationlocation.modifiedon = DateTime.UtcNow;
                organisationlocation.modifiedby = requeststate.usercontext.id;
                var orgLocTempId = Guid.Parse(organisationlocation.orgloctempid);

                using (DbCommand command = db.GetCommand(query))
                {
                    db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationlocation.organisationid;
                    db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.name) ? "" : organisationlocation.name;
                    db.AddParameter(command, "addressline1", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.addressline1) ? "" : organisationlocation.addressline1;
                    db.AddParameter(command, "addressline2", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.addressline2) ? "" : organisationlocation.addressline2;
                    db.AddParameter(command, "city", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.city) ? "" : organisationlocation.city;
                    db.AddParameter(command, "state", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.state) ? "" : organisationlocation.state;
                    db.AddParameter(command, "country", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.country) ? "" : organisationlocation.country;
                    db.AddParameter(command, "latitude", DbTypes.Types.Decimal).Value = organisationlocation.latitude;
                    db.AddParameter(command, "longitude", DbTypes.Types.Decimal).Value = organisationlocation.longitude;
                    db.AddParameter(command, "googlelocation", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.googlelocation) ? "" : organisationlocation.googlelocation;
                    db.AddParameter(command, "geolocation_url", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.geolocation_url) ? "" : organisationlocation.geolocation_url;
                    db.AddParameter(command, "pincode", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.pincode) ? "" : organisationlocation.pincode;
                    db.AddParameter(command, "customurl", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.customurl) ? "" : organisationlocation.customurl;
                    db.AddParameter(command, "orgloctempid", DbTypes.Types.Uuid).Value = orgLocTempId;
                    db.AddParameter(command, "templateid", DbTypes.Types.Long).Value = organisationlocation.templateid;
                    db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationlocation.version;
                    db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = organisationlocation.createdby;
                    db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = organisationlocation.createdon;
                    db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationlocation.modifiedby;
                    db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationlocation.modifiedon;
                    db.AddParameter(command, "images", DbTypes.Types.Json).Value = organisationlocation.images_json;
                    db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationlocation.attributes_json;
                    // Ensure facility_list is not null, then serialize it
                    if (organisationlocation.facility_list == null)
                    {
                        organisationlocation.facility_list = new List<long>();
                    }
                    string facilityListJson = System.Text.Json.JsonSerializer.Serialize(organisationlocation.facility_list);
                    Console.WriteLine($"💾 Insert - facility_list count: {organisationlocation.facility_list.Count}, JSON: {facilityListJson}");
                    db.AddParameter(command, "facility_list", DbTypes.Types.Json).Value = facilityListJson;
                    db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = organisationlocation.isactive;
                    db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationlocation.issuspended;
                    db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organisationlocation.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationlocation.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.notes) ? "" : organisationlocation.notes;
db.AddParameter(command, "isverified", DbTypes.Types.Boolean).Value = organisationlocation.isverified;
db.AddParameter(command, "isPaymentRequired", DbTypes.Types.Boolean).Value = organisationlocation.isPaymentRequired;
db.AddParameter(command, "email", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.email) ? "" : organisationlocation.email;
db.AddParameter(command, "whatsapp_mobile", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.whatsapp_mobile) ? "" : organisationlocation.whatsapp_mobile;
                    
                    using (DbDataReader reader = await db.Execute(command))
                    {
                        if (await reader.ReadAsync())
                        {
                            organisationlocation.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                            Console.WriteLine($"✅ OrganisationLocation inserted with ID: {organisationlocation.id}");
                        }
                        else
                        {
                            Console.WriteLine("❌ No ID returned from OrganisationLocation insert");
                        }
                    }
                }


         


        }
        public async Task<OrganisationLocation> Update(OrganisationLocation organisationlocation)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    // 🔍 DEBUGGER BREAKPOINT: Set breakpoint here - First line of Update method
                    // Inspect: organisationlocation.facility_list
                    var facilityListJsonStart = organisationlocation.facility_list != null 
                        ? System.Text.Json.JsonSerializer.Serialize(organisationlocation.facility_list) 
                        : "null";
                    Console.WriteLine($"🔍 Update START - facility_list count: {organisationlocation.facility_list?.Count ?? 0}, JSON: {facilityListJsonStart}");
                    
                    // Preserve facility_list before update
                    var facilityListBackup = organisationlocation.facility_list != null 
                        ? new List<long>(organisationlocation.facility_list) 
                        : new List<long>();
                    
                    // Geocode the address if coordinates are not set or address changed
                    if ((organisationlocation.latitude == 0 && organisationlocation.longitude == 0) ||
                        string.IsNullOrEmpty(organisationlocation.geolocation_url))
                    {
                        await GeocodeLocation(organisationlocation);
                    }
                    
                    await db.BeginTransaction();
                    await this.UpdateTransaction(db, organisationlocation);
                    await db.CommitTransaction();
                    
                    // Ensure facility_list is restored if it was lost
                    if (facilityListBackup.Count > 0 && (organisationlocation.facility_list == null || organisationlocation.facility_list.Count == 0))
                    {
                        organisationlocation.facility_list = facilityListBackup;
                        Console.WriteLine($"🔧 Restored facility_list after UpdateTransaction: {System.Text.Json.JsonSerializer.Serialize(facilityListBackup)}");
                    }
                }
            return organisationlocation;
        }
        public async Task<bool> UpdateTransaction(IDb db, OrganisationLocation organisationlocation)
        {
            bool result = false;
            await EnsureCustomUrlAvailableTransaction(db, organisationlocation);

                String query = @"
                UPDATE OrganisationLocation
                    SET 
                        organisationid = @organisationid,name = @name,addressline1 = @addressline1,addressline2 = @addressline2,city = @city,state = @state,country = @country,latitude = @latitude,longitude = @longitude,googlelocation = @googlelocation,geolocation_url = @geolocation_url,pincode = @pincode,customurl = @customurl,templateid = @templateid,modifiedby = @modifiedby,modifiedon = @modifiedon,images = @images,facility_list = @facility_list,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,isverified = @isverified,isPaymentRequired = @isPaymentRequired,email = @email,whatsapp_mobile = @whatsapp_mobile,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", organisationlocation.id, DbTypes.Types.Long);


                var command = queryBuilder.GetCommand(db);
                
                organisationlocation.modifiedon = DateTime.UtcNow;
                organisationlocation.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationlocation.id;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationlocation.organisationid;
db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.name) ? "" : organisationlocation.name;
db.AddParameter(command, "addressline1", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.addressline1) ? "" : organisationlocation.addressline1;
db.AddParameter(command, "addressline2", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.addressline2) ? "" : organisationlocation.addressline2;
db.AddParameter(command, "city", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.city) ? "" : organisationlocation.city;
db.AddParameter(command, "state", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.state) ? "" : organisationlocation.state;
db.AddParameter(command, "country", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.country) ? "" : organisationlocation.country;
db.AddParameter(command, "latitude", DbTypes.Types.Decimal).Value = organisationlocation.latitude;
db.AddParameter(command, "longitude", DbTypes.Types.Decimal).Value = organisationlocation.longitude;
db.AddParameter(command, "googlelocation", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.googlelocation) ? "" : organisationlocation.googlelocation;
db.AddParameter(command, "geolocation_url", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.geolocation_url) ? "" : organisationlocation.geolocation_url;
db.AddParameter(command, "pincode", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.pincode) ? "" : organisationlocation.pincode;
db.AddParameter(command, "customurl", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.customurl) ? "" : organisationlocation.customurl;
db.AddParameter(command, "templateid", DbTypes.Types.Long).Value = organisationlocation.templateid;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationlocation.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationlocation.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationlocation.modifiedon;
                db.AddParameter(command, "images", DbTypes.Types.Json).Value = organisationlocation.images_json;
            db.AddParameter(command, "facility_list", DbTypes.Types.Json).Value = organisationlocation.facility_list_json;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationlocation.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationlocation.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organisationlocation.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationlocation.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.notes) ? "" : organisationlocation.notes;
db.AddParameter(command, "isverified", DbTypes.Types.Boolean).Value = organisationlocation.isverified;
db.AddParameter(command, "isPaymentRequired", DbTypes.Types.Boolean).Value = organisationlocation.isPaymentRequired;
db.AddParameter(command, "email", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.email) ? "" : organisationlocation.email;
db.AddParameter(command, "whatsapp_mobile", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationlocation.whatsapp_mobile) ? "" : organisationlocation.whatsapp_mobile;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    organisationlocation.version = organisationlocation.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(OrganisationLocationDeleteReq organisationlocation)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, organisationlocation);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, OrganisationLocationDeleteReq organisationlocation)
        {
            bool result = false;
                String query = @"
                UPDATE OrganisationLocation
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            // If specific location id is provided, delete only that location
            if(organisationlocation.id > 0)
            {
                queryBuilder.AddParameter("OrganisationLocation.id", "=", "id", organisationlocation.id, DbTypes.Types.Long);
            }
            // Otherwise, if organisation id is provided, delete all locations for that organisation
            else if (organisationlocation.orgnaisationid > 0)
            {
                queryBuilder.AddParameter("OrganisationLocation.organisationid", "=", "organisationid", organisationlocation.orgnaisationid, DbTypes.Types.Long);
            }
            else
            {
                // If neither id nor organisationid is provided, throw an error to prevent deleting all locations
                throw new ArgumentException("Either id or orgnaisationid must be provided to delete organisation location");
            }
                if (organisationlocation.version > 0)
                {
                    queryBuilder.AddParameter("OrganisationLocation.version", "=", "version", organisationlocation.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                // QueryBuilder already adds the parameters, so we only need to add the ones not handled by QueryBuilder
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            return result;
        }


        public async Task<List<orgnisationlocationstaffres>> Selectlocation(orgnisationlocationstaffreq req)
        {
            List<orgnisationlocationstaffres> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectLocationTransaction(db, req);
            }
            return result;
        }
        public async Task<List<orgnisationlocationstaffres>> SelectLocationTransaction(IDb db, orgnisationlocationstaffreq req)
        {
            List<orgnisationlocationstaffres> result = new List<orgnisationlocationstaffres>();
            string query = @"
                select OrganisationLocation.organisationid,OrganisationLocation.id organisationlocationid,OrganisationLocation.name
 from staff left join  OrganisationLocation on OrganisationLocation.organisationid =staff.organisationid
 
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.userid > 0)
            {
                queryBuilder.AddParameter("staff.userid", "=", "userid", req.userid, DbTypes.Types.Long);
            }
         
            queryBuilder.AddParameter("OrganisationLocation.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganisationLocation.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    orgnisationlocationstaffres temp = new orgnisationlocationstaffres();
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                   
                    result.Add(temp);
                }
            }
            return result;
        }


        public async Task<List<OrgLocationStaffResponse>> SelectlocationDetail(OrgLocationStaffReq req)
        {
            List<OrgLocationStaffResponse> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectLocationDetailTransaction(db, req);
            }
            return result;
        }
        public async Task<List<OrgLocationStaffResponse>> SelectLocationDetailTransaction(IDb db, OrgLocationStaffReq req)
        {
            List<OrgLocationStaffResponse> result = new List<OrgLocationStaffResponse>();
            string query = @"
        SELECT 
            o.name AS BusinessName,
            ol.addressline1 AS StreetName,
            ol.addressline2 AS Area,
            ol.city AS City,
            ol.state AS State,
            ol.pincode AS PostalCode,
            (
                SELECT json_agg(
                    json_build_object(
                        'ServiceName', os.servicename,
                        'Price', os.prize,
                        'OfferPrice', os.offerprize,
                        'Duration', os.timetaken
                    )
                )
                FROM public.OrganisationServices os
                WHERE os.organisationid = o.id
                AND os.organisationlocationid = ol.id
                AND os.isactive = true
            ) AS Services,
            (
                SELECT json_agg(
                    json_build_object(
                        'Day', ost.day_of_week,
                        'StartTime', ost.start_time::time,
                        'EndTime', ost.end_time::time
                    )
                )
                FROM public.OrganisationServiceTiming ost
                WHERE ost.organisationid = o.id 
                AND ost.organisationlocationid = ol.id
                AND ost.isactive = true
            ) AS Timings
        FROM 
            public.Organisation o
        JOIN
            public.OrganisationLocation ol ON o.id = ol.organisationid
     
    ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (req.orglocid > 0)
            {
                queryBuilder.AddParameter("ol.id", "=", "orglocid", req.orglocid, DbTypes.Types.Long);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "ol.id");
            var command = queryBuilder.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    OrgLocationStaffResponse temp = new OrgLocationStaffResponse
                    {
                        BusinessName = reader["BusinessName"] == DBNull.Value ? string.Empty : reader["BusinessName"].ToString(),
                        StreetName = reader["StreetName"] == DBNull.Value ? string.Empty : reader["StreetName"].ToString(),
                        Area = reader["Area"] == DBNull.Value ? string.Empty : reader["Area"].ToString(),
                        City = reader["City"] == DBNull.Value ? string.Empty : reader["City"].ToString(),
                        State = reader["State"] == DBNull.Value ? string.Empty : reader["State"].ToString(),
                        PostalCode = reader["PostalCode"] == DBNull.Value ? string.Empty : reader["PostalCode"].ToString()
                    };

                    // Deserialize Services JSON array
                    if (reader["Services"] != DBNull.Value)
                    {
                        string servicesJson = reader["Services"].ToString();
                        temp.Services = JsonConvert.DeserializeObject<List<Service>>(servicesJson);
                    }

                    // Deserialize Timings JSON array
                    if (reader["Timings"] != DBNull.Value)
                    {
                        string timingsJson = reader["Timings"].ToString();
                        temp.Timings = JsonConvert.DeserializeObject<List<Timing>>(timingsJson);
                    }

                    result.Add(temp);
                }
            }
            return result;
        }



        public async Task<AppointmentPaymentsummary> SelectAppointmentPaymentsummary(OrgLocationStaffReq req)
        {
            AppointmentPaymentsummary result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectAppointmentPaymentsummaryTransaction(db, req);
            }
            return result;
        }

        public async Task<AppointmentPaymentsummary> SelectAppointmentPaymentsummaryTransaction(IDb db, OrgLocationStaffReq req)
        {
            AppointmentPaymentsummary result = new AppointmentPaymentsummary();
            string query = @"
WITH payment_data AS (
    SELECT 
        COALESCE(p.paymentmodetype, CASE 
            WHEN p.mode = 0 THEN 'Cash'
            WHEN p.mode = 1 THEN 'Card'
            WHEN p.mode = 2 THEN 'UPI'
            WHEN p.mode = 3 THEN 'BankTransfer'
            WHEN p.mode = 4 THEN 'Cheque'
            WHEN p.mode = 5 THEN 'OnlineGateway'
            ELSE 'Unknown'
        END) AS paymentmodetype,
        SUM(p.amount) AS total_amount
    FROM payment p
    JOIN appoinment a ON p.appoinmentid = a.id
    WHERE a.organisationlocationid = @orglocid
    GROUP BY COALESCE(p.paymentmodetype, CASE 
            WHEN p.mode = 0 THEN 'Cash'
            WHEN p.mode = 1 THEN 'Card'
            WHEN p.mode = 2 THEN 'UPI'
            WHEN p.mode = 3 THEN 'BankTransfer'
            WHEN p.mode = 4 THEN 'Cheque'
            WHEN p.mode = 5 THEN 'OnlineGateway'
            ELSE 'Unknown'
        END)
),
appointment_counts AS (
    SELECT 
        COUNT(*) AS total_appointments,
        SUM(CASE WHEN statuscode = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN statuscode = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count
    FROM appoinment
    WHERE organisationlocationid = @orglocid
)
SELECT 
    ac.total_appointments,
    ac.confirmed_count,
    ac.completed_count,
    (
        SELECT json_agg(
            json_build_object(
                'paymentmodetype', pd.paymentmodetype,
                'totalamount', pd.total_amount
            )
        ) 
        FROM payment_data pd
    ) AS payment_summary
FROM appointment_counts ac";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

      

            var command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "orglocid", DbTypes.Types.Long).Value = req.orglocid;
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var summary = new AppointmentPaymentsummary
                    {
                        totalappointments = reader.IsDBNull(reader.GetOrdinal("total_appointments"))
        ? 0
        : reader.GetInt32(reader.GetOrdinal("total_appointments")),
                        confirmedcount = reader.IsDBNull(reader.GetOrdinal("confirmed_count"))
        ? 0
        : reader.GetInt32(reader.GetOrdinal("confirmed_count")),
                        completedcount = reader.IsDBNull(reader.GetOrdinal("completed_count"))
        ? 0
        : reader.GetInt32(reader.GetOrdinal("completed_count")),
                        paymentsummary = new List<PaymentSummary>()
                    };

                    if (!reader.IsDBNull(reader.GetOrdinal("payment_summary")))
                    {
                        string paymentSummaryJson = reader.GetString(reader.GetOrdinal("payment_summary"));
                        summary.paymentsummary = JsonConvert.DeserializeObject<List<PaymentSummary>>(paymentSummaryJson)
                            ?? new List<PaymentSummary>();
                    }
                    result = summary;
                }
            }
            return result;
        }

        public async Task<OrganisationDashboardStatsRes> SelectOrganisationDashboardStats(OrgLocationStaffReq req)
        {
            OrganisationDashboardStatsRes result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectOrganisationDashboardStatsTransaction(db, req);
            }
            return result;
        }

        public async Task<OrganisationDashboardStatsRes> SelectOrganisationDashboardStatsTransaction(IDb db, OrgLocationStaffReq req)
        {
            var result = new OrganisationDashboardStatsRes();
            const string query = @"
WITH appointment_counts AS (
    SELECT
        COUNT(*) AS total_appointments,
        SUM(CASE WHEN UPPER(COALESCE(statuscode, '')) = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN UPPER(COALESCE(statuscode, '')) = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN UPPER(COALESCE(statuscode, '')) = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
        -- Pending = needs action on today or a future date (matches what staff look for on the calendar)
        SUM(CASE
            WHEN UPPER(COALESCE(statuscode, '')) NOT IN ('CONFIRMED', 'COMPLETED', 'CANCELLED')
             AND DATE(appoinmentdate) >= CURRENT_DATE
            THEN 1 ELSE 0 END) AS pending_count
    FROM appoinment
    WHERE organisationlocationid = @orglocid
),
revenue_total AS (
    SELECT COALESCE(SUM(p.amount), 0) AS total_revenue
    FROM payment p
    INNER JOIN appoinment a ON p.appoinmentid = a.id
    WHERE a.organisationlocationid = @orglocid
),
trend AS (
    SELECT
        d::date AS day,
        TRIM(TO_CHAR(d::date, 'Dy')) AS day_name,
        COALESCE(COUNT(a.id), 0) AS appointment_count
    FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS d
    LEFT JOIN appoinment a
        ON DATE(a.appoinmentdate) = d::date
        AND a.organisationlocationid = @orglocid
    GROUP BY d::date
    ORDER BY d::date
),
revenue_weeks AS (
    SELECT
        CASE
            WHEN EXTRACT(DAY FROM a.appoinmentdate) <= 7 THEN 1
            WHEN EXTRACT(DAY FROM a.appoinmentdate) <= 14 THEN 2
            WHEN EXTRACT(DAY FROM a.appoinmentdate) <= 21 THEN 3
            ELSE 4
        END AS week_num,
        COALESCE(SUM(p.amount), 0) AS revenue
    FROM appoinment a
    LEFT JOIN payment p ON p.appoinmentid = a.id
    WHERE a.organisationlocationid = @orglocid
      AND DATE_TRUNC('month', a.appoinmentdate) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY week_num
)
SELECT
    ac.total_appointments,
    ac.confirmed_count,
    ac.completed_count,
    ac.pending_count,
    ac.cancelled_count,
    rt.total_revenue,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'name', t.day_name,
                'date', TO_CHAR(t.day, 'YYYY-MM-DD'),
                'appointments', t.appointment_count
            ) ORDER BY t.day
        ), '[]'::json)
        FROM trend t
    ) AS trend_json,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'name', w.week_label,
                'revenue', COALESCE(rw.revenue, 0)
            ) ORDER BY w.week_num
        ), '[]'::json)
        FROM (
            VALUES
                (1, 'Week 1'),
                (2, 'Week 2'),
                (3, 'Week 3'),
                (4, 'Week 4')
        ) AS w(week_num, week_label)
        LEFT JOIN revenue_weeks rw ON rw.week_num = w.week_num
    ) AS revenue_weeks_json
FROM appointment_counts ac
CROSS JOIN revenue_total rt";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            var command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "orglocid", DbTypes.Types.Long).Value = req.orglocid;
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    result.totalappointments = reader.IsDBNull(reader.GetOrdinal("total_appointments"))
                        ? 0
                        : reader.GetInt32(reader.GetOrdinal("total_appointments"));
                    result.confirmedcount = reader.IsDBNull(reader.GetOrdinal("confirmed_count"))
                        ? 0
                        : reader.GetInt32(reader.GetOrdinal("confirmed_count"));
                    result.completedcount = reader.IsDBNull(reader.GetOrdinal("completed_count"))
                        ? 0
                        : reader.GetInt32(reader.GetOrdinal("completed_count"));
                    result.pendingcount = reader.IsDBNull(reader.GetOrdinal("pending_count"))
                        ? 0
                        : reader.GetInt32(reader.GetOrdinal("pending_count"));
                    result.cancelledcount = reader.IsDBNull(reader.GetOrdinal("cancelled_count"))
                        ? 0
                        : reader.GetInt32(reader.GetOrdinal("cancelled_count"));
                    result.totalrevenue = reader.IsDBNull(reader.GetOrdinal("total_revenue"))
                        ? 0
                        : reader.GetDecimal(reader.GetOrdinal("total_revenue"));

                    if (!reader.IsDBNull(reader.GetOrdinal("trend_json")))
                    {
                        var trendJson = reader.GetString(reader.GetOrdinal("trend_json"));
                        result.trend_last_7_days = JsonConvert.DeserializeObject<List<OrganisationDashboardTrendPoint>>(trendJson)
                            ?? new List<OrganisationDashboardTrendPoint>();
                    }

                    if (!reader.IsDBNull(reader.GetOrdinal("revenue_weeks_json")))
                    {
                        var revenueJson = reader.GetString(reader.GetOrdinal("revenue_weeks_json"));
                        result.revenue_by_week_this_month = JsonConvert.DeserializeObject<List<OrganisationDashboardRevenueWeekPoint>>(revenueJson)
                            ?? new List<OrganisationDashboardRevenueWeekPoint>();
                    }

                    result.status_breakdown = new List<OrganisationDashboardStatusPoint>
                    {
                        new OrganisationDashboardStatusPoint { name = "Completed", value = result.completedcount },
                        new OrganisationDashboardStatusPoint { name = "Confirmed", value = result.confirmedcount },
                        new OrganisationDashboardStatusPoint { name = "Pending", value = result.pendingcount },
                        new OrganisationDashboardStatusPoint { name = "Cancelled", value = result.cancelledcount },
                    };
                }
            }

            return result;
        }

        public async Task<UsersGenerateQRCodeRes> GenerateQRCode(long organisationid, long locationid)
        {
            UsersGenerateQRCodeRes result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    result = await this.GenerateQRCodeTransaction(db, organisationid, locationid);
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

        public async Task<UsersGenerateQRCodeRes> GenerateQRCodeTransaction(IDb db, long organisationid, long locationid)
        {
            if (organisationid <= 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid organisation ID");
            }

            if (locationid <= 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid location ID");
            }

            var organisation = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
            {
                id = organisationid
            })).FirstOrDefault();

            if (organisation == null)
            {
                throw new AppException(AppException.ErrorCodes.UnknownOrganisation);
            }

            var orglocations = (await SelectTransaction(db, new OrganisationLocationSelectReq
            {
                id = locationid,
                organisationid = organisation.id
            })).FirstOrDefault();

            if (orglocations == null)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "No organisation location found for the specified location ID");
            }

            /* var request = httpContext.Request;
             string baseUrl = $"{request.Scheme}://{request.Host}";*/


            var qrdata = new QrcodeDataRes
            {
                id = orglocations.id,
                organisationid = organisation.id,
                name = orglocations.name,
                addressline1 = orglocations.addressline1,
                addressline2 = orglocations.addressline2,
                city = orglocations.city,
                state = orglocations.state,
                country = orglocations.country,
                latitude = orglocations.latitude,
                longitude = orglocations.longitude,
                googlelocation = orglocations.googlelocation,
                pincode = orglocations.pincode,
                customurl = orglocations.customurl,
                images = orglocations.images
            };

            var result = new UsersGenerateQRCodeRes();
            result.qrcodebase64string = "data:image/png;base64," + Convert.ToBase64String(qrcoderservice.GenerateQRCodeAsByteArray(JsonConvert.SerializeObject(qrdata)));


            return result;
        }

        static readonly HashSet<string> ReservedCustomUrlSlugs = new(StringComparer.OrdinalIgnoreCase)
        {
            "www", "api", "admin", "appointza", "login", "register", "app", "mail", "support", "help",
        };

        /// <summary>Normalize slug the same way as public URL lookup (stored on organisationlocation.customurl).</summary>
        public static string PrepareCustomUrlSlug(string? customUrl)
        {
            var slug = SlugHelper.ExtractCustomUrlSlug(customUrl);
            if (!string.IsNullOrEmpty(slug))
            {
                return slug;
            }

            return SlugHelper.Normalize(customUrl);
        }

        public async Task<CustomUrlAvailabilityRes> CheckCustomUrlAvailability(
            string customUrl,
            long excludeLocationId = 0)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await CheckCustomUrlAvailabilityTransaction(db, customUrl, excludeLocationId);
        }

        public async Task<CustomUrlAvailabilityRes> CheckCustomUrlAvailabilityTransaction(
            IDb db,
            string customUrl,
            long excludeLocationId = 0)
        {
            var slug = PrepareCustomUrlSlug(customUrl);
            if (string.IsNullOrEmpty(slug))
            {
                return new CustomUrlAvailabilityRes
                {
                    available = false,
                    normalized_slug = "",
                    message = "Enter a subdomain name.",
                };
            }

            if (ReservedCustomUrlSlugs.Contains(slug))
            {
                return new CustomUrlAvailabilityRes
                {
                    available = false,
                    normalized_slug = slug,
                    message = "This subdomain is reserved. Please choose another name.",
                };
            }

            var taken = await FindCustomUrlConflictTransaction(db, slug, excludeLocationId);
            if (taken != null)
            {
                return new CustomUrlAvailabilityRes
                {
                    available = false,
                    normalized_slug = slug,
                    message = "This subdomain is already taken. Please choose another name.",
                };
            }

            return new CustomUrlAvailabilityRes
            {
                available = true,
                normalized_slug = slug,
                message = "This subdomain is available.",
            };
        }

        async Task EnsureCustomUrlAvailableTransaction(
            IDb db,
            OrganisationLocation organisationlocation)
        {
            if (string.IsNullOrWhiteSpace(organisationlocation.customurl))
            {
                organisationlocation.customurl = "";
                return;
            }

            var slug = PrepareCustomUrlSlug(organisationlocation.customurl);
            if (string.IsNullOrEmpty(slug))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Custom URL must contain letters or numbers.");
            }

            if (ReservedCustomUrlSlugs.Contains(slug))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "This subdomain is reserved. Please choose another name.");
            }

            var conflict = await FindCustomUrlConflictTransaction(db, slug, organisationlocation.id);
            if (conflict != null)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "This subdomain is already taken by another location. Please choose a different name.");
            }

            organisationlocation.customurl = slug;
        }

        async Task<OrganisationLocation?> FindCustomUrlConflictTransaction(
            IDb db,
            string normalizedSlug,
            long excludeLocationId)
        {
            const string query = @"
                SELECT id, organisationid, name, customurl
                FROM OrganisationLocation
                WHERE isactive = true
                  AND customurl IS NOT NULL
                  AND TRIM(customurl) <> ''
                  AND (@exclude_id <= 0 OR id <> @exclude_id)
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "exclude_id", DbTypes.Types.Long).Value = excludeLocationId;

            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                var stored = reader["customurl"] == DBNull.Value ? "" : reader["customurl"].ToString() ?? "";
                if (SlugHelper.CustomUrlSlugMatches(stored, normalizedSlug))
                {
                    return new OrganisationLocation
                    {
                        id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                        organisationid = reader["organisationid"] == DBNull.Value
                            ? 0
                            : Convert.ToInt64(reader["organisationid"]),
                        name = reader["name"]?.ToString() ?? "",
                        customurl = stored,
                    };
                }
            }

            return null;
        }

        /// <summary>
        /// Resolve a public booking location by organisationlocation.customurl slug (no isverified gate).
        /// </summary>
        public async Task<PublicSiteLocationResolve?> ResolvePublicSiteByCustomUrl(string customUrl)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await ResolvePublicSiteByCustomUrlTransaction(db, customUrl);
        }

        public async Task<PublicSiteLocationResolve?> ResolvePublicSiteByCustomUrlTransaction(IDb db, string customUrl)
        {
            var normalizedSlug = PrepareCustomUrlSlug(customUrl);
            if (string.IsNullOrEmpty(normalizedSlug))
            {
                return null;
            }

            const string query = @"
                SELECT id, organisationid, orgloctempid::text AS orgloctempid, templateid, customurl
                FROM OrganisationLocation
                WHERE isactive = true
                  AND customurl IS NOT NULL
                  AND TRIM(customurl) <> ''";

            using DbCommand command = db.GetCommand(query);
            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                var stored = reader["customurl"] == DBNull.Value ? "" : reader["customurl"].ToString() ?? "";
                if (!SlugHelper.CustomUrlSlugMatches(stored, normalizedSlug))
                {
                    continue;
                }

                return new PublicSiteLocationResolve
                {
                    id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                    organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]),
                    orgloctempid = reader["orgloctempid"] == DBNull.Value ? "" : reader["orgloctempid"].ToString() ?? "",
                    templateid = reader["templateid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["templateid"]),
                    customurl = stored,
                };
            }

            return null;
        }

        public async Task<long> GetLocationIdByOrgLocTempId(string orgloctempid)
        {
            if (string.IsNullOrWhiteSpace(orgloctempid))
            {
                return 0;
            }

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await GetLocationIdByOrgLocTempIdTransaction(db, orgloctempid);
            }
        }

        public async Task<long> GetLocationIdByOrgLocTempIdTransaction(IDb db, string orgloctempid)
        {
            if (string.IsNullOrWhiteSpace(orgloctempid))
            {
                return 0;
            }

            const string query = @"
                SELECT id
                FROM OrganisationLocation
                WHERE orgloctempid::text = @orgloctempid
                  AND isactive = true
                LIMIT 1";

            using DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "orgloctempid", DbTypes.Types.String).Value = orgloctempid.Trim();

            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
            }

            return 0;
        }

        public async Task<string> GetOrgLocTempIdByLocationId(long locationId)
        {
            if (locationId <= 0)
            {
                return "";
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await GetOrgLocTempIdByLocationIdTransaction(db, locationId);
        }

        public async Task<string> GetOrgLocTempIdByLocationIdTransaction(IDb db, long locationId)
        {
            if (locationId <= 0)
            {
                return "";
            }

            const string query = @"
                SELECT orgloctempid::text AS orgloctempid
                FROM OrganisationLocation
                WHERE id = @locationId
                  AND isactive = true
                LIMIT 1";

            using DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "locationId", DbTypes.Types.Long).Value = locationId;

            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return reader["orgloctempid"] == DBNull.Value ? "" : reader["orgloctempid"].ToString() ?? "";
            }

            return "";
        }

        /// <summary>
        /// Updates only the templateid for a specific organisation location
        /// </summary>
        public async Task<long> UpdateLocationTemplateId(long organisationLocationId, long templateId)
        {
            long result = 0;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.UpdateLocationTemplateIdTransaction(db, organisationLocationId, templateId);
            }
            return result;
        }

        public async Task<OrganisationLocation> UpdateLocationMedia(UpdateLocationMediaReq req)
        {
            if (req == null || req.organisationid <= 0 || req.organisationlocationid <= 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organisation and location are required.");
            }

            var authenticatedOrganisationId = requeststate.usercontext?.organisationid ?? 0;
            var authenticatedLocationId = requeststate.usercontext?.organisationlocationid ?? 0;
            var canManageLocation =
                (authenticatedOrganisationId > 0 && authenticatedOrganisationId == req.organisationid) ||
                (authenticatedOrganisationId <= 0 &&
                 authenticatedLocationId > 0 &&
                 authenticatedLocationId == req.organisationlocationid);
            if (!canManageLocation)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "The location does not belong to this organisation.");
            }

            var images = (req.images ?? new List<long>())
                .Where(id => id > 0)
                .Distinct()
                .Take(30)
                .ToList();

            var videoUrls = new List<string>();
            foreach (var raw in req.video_urls ?? new List<string>())
            {
                var value = (raw ?? "").Trim();
                if (value.Length == 0 || value.Length > 2048)
                {
                    continue;
                }

                if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
                    (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Video URLs must use http or https.");
                }

                if (!videoUrls.Contains(uri.AbsoluteUri, StringComparer.OrdinalIgnoreCase))
                {
                    videoUrls.Add(uri.AbsoluteUri);
                }

                if (videoUrls.Count == 12)
                {
                    break;
                }
            }

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                const string query = @"
                    UPDATE OrganisationLocation
                    SET images = @images,
                        attributes = jsonb_set(
                            COALESCE(attributes::jsonb, '{}'::jsonb),
                            '{video_urls}',
                            CAST(@video_urls AS jsonb),
                            true
                        ),
                        modifiedby = @modifiedby,
                        modifiedon = @modifiedon,
                        version = version + 1
                    WHERE id = @id
                      AND organisationid = @organisationid
                      AND isactive = true
                    RETURNING id";

                using DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.organisationlocationid;
                db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = req.organisationid;
                db.AddParameter(command, "images", DbTypes.Types.Json).Value =
                    System.Text.Json.JsonSerializer.Serialize(images);
                db.AddParameter(command, "video_urls", DbTypes.Types.Json).Value =
                    System.Text.Json.JsonSerializer.Serialize(videoUrls);
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value =
                    requeststate.usercontext?.id ?? 0;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

                var updated = false;
                using (DbDataReader reader = await db.Execute(command))
                {
                    updated = await reader.ReadAsync();
                }

                if (!updated)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Location was not found.");
                }
            }

            return (await Select(new OrganisationLocationSelectReq
            {
                id = req.organisationlocationid,
                organisationid = req.organisationid
            })).FirstOrDefault();
        }

        /// <summary>
        /// Updates only the templateid for a specific organisation location (transaction version)
        /// Returns the updated templateid from the database
        /// </summary>
        public async Task<long> UpdateLocationTemplateIdTransaction(IDb db, long organisationLocationId, long templateId)
        {
            long result = 0;
            try
            {
                string updateQuery = @"
                    UPDATE OrganisationLocation
                    SET 
                        templateid = @templateid,
                        modifiedby = @modifiedby,
                        modifiedon = @modifiedon,
                        version = version + 1
                    WHERE id = @id AND isactive = true
                ";

                DbCommand updateCommand = db.GetCommand(updateQuery);
                
                db.AddParameter(updateCommand, "id", DbTypes.Types.Long).Value = organisationLocationId;
                db.AddParameter(updateCommand, "templateid", DbTypes.Types.Long).Value = templateId;
                db.AddParameter(updateCommand, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext?.id ?? 0;
                db.AddParameter(updateCommand, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

                int rowsAffected = await db.ExecuteNonQuery(updateCommand);

                if (rowsAffected > 0)
                {
                    // Select the updated templateid from the database
                    string selectQuery = @"
                        SELECT templateid 
                        FROM OrganisationLocation 
                        WHERE id = @id AND isactive = true
                    ";

                    DbCommand selectCommand = db.GetCommand(selectQuery);
                    db.AddParameter(selectCommand, "id", DbTypes.Types.Long).Value = organisationLocationId;

                    using (DbDataReader reader = await db.Execute(selectCommand))
                    {
                        if (await reader.ReadAsync())
                        {
                            result = reader["templateid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["templateid"]);
                            Console.WriteLine($"✅ Successfully updated templateid for location {organisationLocationId} to template {result}");
                        }
                    }
                }
                else
                {
                    Console.WriteLine($"❌ No location found with ID {organisationLocationId} or location is inactive");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error updating templateid for location {organisationLocationId}: {ex.Message}");
                throw;
            }

            return result;
        }

        /// <summary>
        /// Returns the default HTML template for new organizations
        /// </summary>
        private string GetDefaultTemplateHtml()
        {
            return @"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{{organisationdetail.name}} - Book Appointment | Appointza</title>
    <link href=""https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"" rel=""stylesheet"">
    <link href=""https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"" rel=""stylesheet"">
    <link href=""https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"" rel=""stylesheet"">
    <style>
        :root { --primary-color: #1AAFCC; --secondary-color: #2D3748; --accent-color: #F7FAFC; --text-dark: #2D3748; --text-light: #718096; --border-color: #E2E8F0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: var(--text-dark); background-color: #ffffff; }
        .hero-section { background: linear-gradient(135deg, var(--primary-color) 0%, #2B6CB0 100%); color: white; padding: 80px 0; position: relative; overflow: hidden; }
        .hero-content { position: relative; z-index: 2; }
        .booking-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .service-card { background: white; border-radius: 16px; padding: 30px; margin-bottom: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid var(--border-color); transition: all 0.3s ease; }
        .service-card:hover { transform: translateY(-5px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        .location-card { background: white; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid var(--border-color); }
        .timing-section { background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; }
        .price { font-size: 2rem; font-weight: 700; color: var(--primary-color); }
        .btn-primary { background: linear-gradient(135deg, var(--primary-color) 0%, #2B6CB0 100%); border: none; padding: 15px 40px; font-size: 1.1rem; font-weight: 600; border-radius: 50px; transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26, 175, 204, 0.3); }
        .image-gallery { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px; }
        .gallery-image { flex: 0 0 calc(50% - 7.5px); height: 150px; object-fit: cover; object-position: center; border-radius: 12px; transition: transform 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .gallery-image:hover { transform: scale(1.05); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .single-image-container { width: 100%; height: 250px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .single-image { width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.3s ease; }
        .single-image:hover { transform: scale(1.05); }
        .footer { background: linear-gradient(135deg, #2D3748 0%, #1A202C 100%); color: white; padding: 60px 0 30px; margin-top: 80px; }
        .footer-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .footer-logo { font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 15px; }
        .footer-description { color: #A0AEC0; margin-bottom: 30px; max-width: 400px; }
        .footer-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px; }
        .footer-section h5 { color: white; margin-bottom: 20px; font-weight: 600; }
        .footer-section a { color: #A0AEC0; text-decoration: none; display: block; margin-bottom: 10px; transition: color 0.3s ease; }
        .footer-section a:hover { color: var(--primary-color); }
        .footer-bottom { border-top: 1px solid #4A5568; padding-top: 30px; text-align: center; color: #A0AEC0; }
        .badge { background: linear-gradient(135deg, var(--primary-color) 0%, #2B6CB0 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 500; }
        .section-title { font-size: 2rem; font-weight: 700; margin-bottom: 30px; color: var(--text-dark); }
        .section-subtitle { color: var(--text-light); font-size: 1.1rem; margin-bottom: 40px; }
        @@media (max-width: 768px) { .hero-section { padding: 60px 0; } .booking-container { padding: 0 15px; } .service-card, .location-card { padding: 20px; } .footer-links { grid-template-columns: 1fr; gap: 30px; } .image-gallery { flex-direction: column; } .gallery-image { flex: 0 0 100%; height: 200px; } .single-image-container { height: 200px; } }
    </style>
</head>
<body>
    <div class=""hero-section"">
        <div class=""booking-container"">
            <div class=""hero-content text-center"">
                <h1 class=""display-4 fw-bold mb-4"">{{organisationdetail.name}}</h1>
                <p class=""lead fs-4 mb-0"">{{organisationdetail.tagline}}</p>
            </div>
        </div>
    </div>
    
    <div class=""booking-container"">
        <div class=""location-card"">
            <h2 class=""section-title""><i class=""fas fa-map-marker-alt text-primary me-3""></i>Location Details</h2>
            <div class=""row"">
                <div class=""col-md-8"">
                    <p class=""fs-5 mb-2""><strong>Address:</strong> {{locationdetail.addressline1}}</p>
                    <p class=""fs-5 mb-2""><strong>Area:</strong> {{locationdetail.addressline2}}</p>
                    <p class=""fs-5 mb-2""><strong>City:</strong> {{locationdetail.city}}, {{locationdetail.state}}</p>
                    <p class=""fs-5 mb-2""><strong>Pincode:</strong> {{locationdetail.pincode}}</p>
                </div>
                <div class=""col-md-4"">
                    {{#if locationdetail.images}}
                        {{#if (eq locationdetail.images.length 1)}}
                            <div class=""single-image-container"">
                                <img src=""{{environment.baseurl}}/api/Files/Get?id={{locationdetail.images.0}}"" alt=""Location Image"" class=""single-image"">
                            </div>
                        {{else}}
                            <div class=""image-gallery"">
                                {{#each locationdetail.images}}
                                <img src=""{{environment.baseurl}}/api/Files/Get?id={{this}}"" alt=""Location Image"" class=""gallery-image"">
                                {{/each}}
                            </div>
                        {{/if}}
                    {{else}}
                        <div class=""single-image-container"" style=""background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); display: flex; align-items: center; justify-content: center;"">
                            <i class=""fas fa-image text-muted"" style=""font-size: 3rem;""></i>
                        </div>
                    {{/if}}
                </div>
            </div>
        </div>
        
        <div class=""service-card"">
            <h2 class=""section-title""><i class=""fas fa-briefcase text-primary me-3""></i>Our Services</h2>
            <p class=""section-subtitle"">Choose from our professional services</p>
            {{#orgnaisatinservice}}
            <div class=""service-card"">
                <div class=""row align-items-center"">
                    <div class=""col-md-8"">
                        <h4 class=""fw-bold mb-2"">{{Servicename}}</h4>
                        <p class=""text-muted mb-3"">{{notes}}</p>
                    </div>
                    <div class=""col-md-4 text-md-end"">
                        <div class=""price mb-2"">₹{{prize}}</div>
                        <span class=""badge"">{{timetaken}} minutes</span>
                    </div>
                </div>
            </div>
            {{/orgnaisatinservice}}
        </div>
        
        <div class=""timing-section"">
            <h3 class=""section-title""><i class=""fas fa-clock text-primary me-3""></i>Business Hours</h3>
            <div class=""row"">
                {{#OrganisationServiceTiming}}
                <div class=""col-md-6 col-lg-4 mb-3"">
                    <div class=""d-flex justify-content-between align-items-center p-3 bg-white rounded"">
                        <span class=""fw-semibold"">
                            {{#if (eq day_of_week 1)}}Monday{{/if}}
                            {{#if (eq day_of_week 2)}}Tuesday{{/if}}
                            {{#if (eq day_of_week 3)}}Wednesday{{/if}}
                            {{#if (eq day_of_week 4)}}Thursday{{/if}}
                            {{#if (eq day_of_week 5)}}Friday{{/if}}
                            {{#if (eq day_of_week 6)}}Saturday{{/if}}
                            {{#if (eq day_of_week 7)}}Sunday{{/if}}
                        </span>
                        <span class=""text-primary fw-semibold"">{{start_time}} - {{end_time}}</span>
                    </div>
                </div>
                {{/OrganisationServiceTiming}}
            </div>
        </div>
        
        <div class=""text-center my-5"">
            <button class=""btn btn-primary btn-lg px-5 py-3"">
                <i class=""fas fa-calendar-plus me-2""></i>Book Appointment Now
            </button>
        </div>
    </div>
    
    <footer class=""footer"">
        <div class=""footer-content"">
            <div class=""row"">
                <div class=""col-lg-4 mb-4"">
                    <div class=""footer-logo"">Appointza</div>
                    <p class=""footer-description"">Appointza simplifies scheduling for every kind of service — from healthcare to salons.</p>
                </div>
                <div class=""col-lg-8"">
                    <div class=""footer-links"">
                        <div class=""footer-section"">
                            <h5>Quick Links</h5>
                            <a href=""/"">Home</a>
                            <a href=""/features"">Features</a>
                            <a href=""/use-cases"">Use Cases</a>
                            <a href=""/contact"">Contact</a>
                        </div>
                        <div class=""footer-section"">
                            <h5>Resources</h5>
                            <a href=""/login"">Login</a>
                            <a href=""/register"">Sign Up</a>
                            <a href=""/help"">Help Center</a>
                            <a href=""/blog"">Blog</a>
                        </div>
                        <div class=""footer-section"">
                            <h5>Legal</h5>
                            <a href=""/terms"">Terms</a>
                            <a href=""/privacy"">Privacy</a>
                            <a href=""/contact"">Contact Us</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class=""footer-bottom"">
                <p>&copy; 2025 Appointza. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <script src=""https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js""></script>
</body>
</html>";
        }

        private async Task GeocodeLocation(OrganisationLocation location)
        {
            try
            {
                // If coordinates are already set, just generate geolocation_url if missing
                if (location.latitude != 0 && location.longitude != 0)
                {
                    // Generate geolocation_url if it's missing (preserve if already set)
                    if (string.IsNullOrEmpty(location.geolocation_url))
                    {
                        location.geolocation_url = $"https://www.google.com/maps?q={location.latitude},{location.longitude}";
                        Console.WriteLine($"✅ Generated geolocation_url from existing coordinates: {location.geolocation_url}");
                    }
                    else
                    {
                        Console.WriteLine($"ℹ️ geolocation_url already provided: {location.geolocation_url}");
                    }
                    
                    // If googlelocation is missing but we have coordinates, construct it from address fields
                    if (string.IsNullOrEmpty(location.googlelocation))
                    {
                        var addressParts = new List<string>();
                        if (!string.IsNullOrWhiteSpace(location.addressline1)) addressParts.Add(location.addressline1);
                        if (!string.IsNullOrWhiteSpace(location.addressline2)) addressParts.Add(location.addressline2);
                        if (!string.IsNullOrWhiteSpace(location.city)) addressParts.Add(location.city);
                        if (!string.IsNullOrWhiteSpace(location.state)) addressParts.Add(location.state);
                        if (!string.IsNullOrWhiteSpace(location.country)) addressParts.Add(location.country);
                        if (!string.IsNullOrWhiteSpace(location.pincode)) addressParts.Add(location.pincode);
                        
                        location.googlelocation = string.Join(", ", addressParts);
                        Console.WriteLine($"✅ Constructed googlelocation from address fields: {location.googlelocation}");
                    }
                    
                    Console.WriteLine($"ℹ️ Coordinates already set - preserving provided values");
                    return;
                }
                
                // Only geocode if we have address information and no existing coordinates
                if ((location.latitude == 0 && location.longitude == 0) && 
                    (!string.IsNullOrWhiteSpace(location.addressline1) || !string.IsNullOrWhiteSpace(location.pincode)))
                {
                    Console.WriteLine($"🌍 Geocoding address: {location.addressline1}, {location.addressline2}, {location.pincode}");
                    
                    var geocodingResult = await geocodingService.GeocodeAddressAsync(
                        location.addressline1 ?? "",
                        location.addressline2 ?? "",
                        location.pincode ?? "",
                        location.city ?? "",
                        location.state ?? "",
                        location.country ?? "India"
                    );

                    if (geocodingResult.Success)
                    {
                        location.latitude = geocodingResult.Latitude;
                        location.longitude = geocodingResult.Longitude;
                        location.googlelocation = geocodingResult.GoogleMapsLink;
                        // Generate geolocation URL from coordinates
                        location.geolocation_url = $"https://www.google.com/maps?q={geocodingResult.Latitude},{geocodingResult.Longitude}";
                        
                        Console.WriteLine($"✅ Geocoding successful: {location.latitude}, {location.longitude}");
                        Console.WriteLine($"🔗 Google Maps link: {location.googlelocation}");
                        Console.WriteLine($"🔗 Geolocation URL: {location.geolocation_url}");
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Geocoding failed: {geocodingResult.ErrorMessage}");
                        // Set default values or leave as 0,0
                        location.latitude = 0;
                        location.longitude = 0;
                        location.googlelocation = "";
                    }
                }
                else
                {
                    Console.WriteLine($"ℹ️ Skipping geocoding - coordinates already set or no address provided");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Geocoding error: {ex.Message}");
                // Don't throw - continue with location creation even if geocoding fails
                // Only reset coordinates if they were 0,0 to begin with
                if (location.latitude == 0 && location.longitude == 0)
                {
                    location.googlelocation = "";
                }
            }
        }
    }
}
