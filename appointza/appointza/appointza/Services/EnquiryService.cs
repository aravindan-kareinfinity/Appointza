using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class EnquiryService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public EnquiryService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        private static string ReadString(DbDataReader reader, string column)
        {
            return reader[column] == DBNull.Value ? "" : reader[column].ToString();
        }

        private Enquiry MapEnquiry(DbDataReader reader)
        {
            Enquiry temp = new Enquiry();
            temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
            temp.name = ReadString(reader, "name");
            temp.email = ReadString(reader, "email");
            temp.mobile = ReadString(reader, "mobile");
            temp.message = ReadString(reader, "message");
            temp.organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]);
            temp.created_by = reader["created_by"] == DBNull.Value ? 0 : Convert.ToInt64(reader["created_by"]);
            temp.notes = ReadString(reader, "notes");
            temp.status = string.IsNullOrEmpty(ReadString(reader, "status")) ? "new" : ReadString(reader, "status");
            temp.source = ReadString(reader, "source");
            temp.is_active = reader["is_active"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_active"]);
            temp.ip_address = ReadString(reader, "ip_address");
            temp.created_at = reader["created_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["created_at"]);
            temp.updated_at = reader["updated_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["updated_at"]);
            temp.business_name = ReadString(reader, "business_name");
            temp.owner_name = ReadString(reader, "owner_name");
            temp.category = ReadString(reader, "category");
            temp.website = ReadString(reader, "website");
            temp.google_maps_link = ReadString(reader, "google_maps_link");
            temp.address = ReadString(reader, "address");
            temp.pin_code = ReadString(reader, "pin_code");
            temp.area = ReadString(reader, "area");
            temp.city = ReadString(reader, "city");
            temp.state = ReadString(reader, "state");
            temp.lead_type = ReadString(reader, "lead_type");
            temp.tags = ReadString(reader, "tags");
            return temp;
        }

        public async Task<List<Enquiry>> Select(EnquirySelectReq req)
        {
            List<Enquiry> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Enquiry>> SelectTransaction(IDb db, EnquirySelectReq req)
        {
            List<Enquiry> result = new List<Enquiry>();
            string query = @"
                SELECT 
                    id, name, email, mobile, message, organisation_id, created_by, notes, 
                    status, source, is_active, ip_address, created_at, updated_at,
                    business_name, owner_name, category, website, google_maps_link,
                    address, pin_code, area, city, state, lead_type, tags
                FROM enquiries
            ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("enquiries.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisation_id > 0)
            {
                queryBuilder.AddParameter("enquiries.organisation_id", "=", "organisation_id", req.organisation_id, DbTypes.Types.Long);
            }
            if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("enquiries.status", "=", "status", req.status, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.source))
            {
                queryBuilder.AddParameter("enquiries.source", "=", "source", req.source, DbTypes.Types.String);
            }
            if (req.is_active.HasValue)
            {
                queryBuilder.AddParameter("enquiries.is_active", "=", "is_active", req.is_active.Value, DbTypes.Types.Boolean);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "enquiries.created_at");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    result.Add(MapEnquiry(reader));
                }
            }
            return result;
        }

        public async Task<Enquiry> Insert(Enquiry enquiry)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, enquiry);
            }
            return enquiry;
        }

        public async Task InsertTransaction(IDb db, Enquiry enquiry)
        {
            String query = @"
                INSERT INTO enquiries (
                    name, email, mobile, message, organisation_id, created_by, notes, 
                    status, source, is_active, ip_address, created_at, updated_at,
                    business_name, owner_name, category, website, google_maps_link,
                    address, pin_code, area, city, state, lead_type, tags
                )
                VALUES (
                    @name, @email, @mobile, @message, @organisation_id, @created_by, @notes,
                    @status, @source, @is_active, 
                    CASE WHEN @ip_address IS NULL OR @ip_address = '' THEN NULL ELSE CAST(@ip_address AS inet) END, 
                    @created_at, @updated_at,
                    @business_name, @owner_name, @category, @website, @google_maps_link,
                    @address, @pin_code, @area, @city, @state, @lead_type, @tags
                )
                RETURNING id;
            ";
            
            enquiry.is_active = true;
            if (string.IsNullOrEmpty(enquiry.status))
            {
                enquiry.status = "new";
            }
            enquiry.created_at = DateTime.UtcNow;
            if (enquiry.created_by == 0 && requeststate?.usercontext != null)
            {
                enquiry.created_by = requeststate.usercontext.id;
            }
            enquiry.updated_at = DateTime.UtcNow;

            using (DbCommand command = db.GetCommand(query))
            {
                BindEnquiryParams(db, command, enquiry, includeId: false);
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        enquiry.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                    else
                    {
                        throw new Exception("INSERT query did not return an ID. The insert may have failed.");
                    }
                }
                
                if (enquiry.id <= 0)
                {
                    throw new Exception($"INSERT completed but ID was not set. ID value: {enquiry.id}");
                }
            }
        }

        public async Task<Enquiry> Update(Enquiry enquiry)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, enquiry);
            }
            return enquiry;
        }

        public async Task<bool> UpdateTransaction(IDb db, Enquiry enquiry)
        {
            bool result = false;
            String query = @"
                UPDATE enquiries
                SET 
                    name = @name,
                    email = @email,
                    mobile = @mobile,
                    message = @message,
                    notes = @notes,
                    status = @status,
                    source = @source,
                    is_active = @is_active,
                    updated_at = @updated_at,
                    business_name = @business_name,
                    owner_name = @owner_name,
                    category = @category,
                    website = @website,
                    google_maps_link = @google_maps_link,
                    address = @address,
                    pin_code = @pin_code,
                    area = @area,
                    city = @city,
                    state = @state,
                    lead_type = @lead_type,
                    tags = @tags
                WHERE id = @id
            ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", enquiry.id, DbTypes.Types.Long);
            var command = queryBuilder.GetCommand(db);
            
            enquiry.updated_at = DateTime.UtcNow;
            BindEnquiryParams(db, command, enquiry, includeId: true);

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        private void BindEnquiryParams(IDb db, DbCommand command, Enquiry enquiry, bool includeId)
        {
            if (includeId)
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = enquiry.id;
            }
            db.AddParameter(command, "name", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.name) ? "" : enquiry.name;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.email) ? (object)DBNull.Value : enquiry.email;
            db.AddParameter(command, "mobile", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.mobile) ? (object)DBNull.Value : enquiry.mobile;
            db.AddParameter(command, "message", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.message) ? (object)DBNull.Value : enquiry.message;
            if (!includeId)
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = enquiry.organisation_id;
                db.AddParameter(command, "created_by", DbTypes.Types.Long).Value = enquiry.created_by == 0 ? (object)DBNull.Value : enquiry.created_by;
                db.AddParameter(command, "ip_address", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.ip_address) ? (object)DBNull.Value : enquiry.ip_address;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = enquiry.created_at;
            }
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.notes) ? (object)DBNull.Value : enquiry.notes;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.status) ? "new" : enquiry.status;
            db.AddParameter(command, "source", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.source) ? (object)DBNull.Value : enquiry.source;
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = enquiry.is_active;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = enquiry.updated_at;
            db.AddParameter(command, "business_name", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.business_name) ? (object)DBNull.Value : enquiry.business_name;
            db.AddParameter(command, "owner_name", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.owner_name) ? (object)DBNull.Value : enquiry.owner_name;
            db.AddParameter(command, "category", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.category) ? (object)DBNull.Value : enquiry.category;
            db.AddParameter(command, "website", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.website) ? (object)DBNull.Value : enquiry.website;
            db.AddParameter(command, "google_maps_link", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.google_maps_link) ? (object)DBNull.Value : enquiry.google_maps_link;
            db.AddParameter(command, "address", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.address) ? (object)DBNull.Value : enquiry.address;
            db.AddParameter(command, "pin_code", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.pin_code) ? (object)DBNull.Value : enquiry.pin_code;
            db.AddParameter(command, "area", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.area) ? (object)DBNull.Value : enquiry.area;
            db.AddParameter(command, "city", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.city) ? (object)DBNull.Value : enquiry.city;
            db.AddParameter(command, "state", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.state) ? (object)DBNull.Value : enquiry.state;
            db.AddParameter(command, "lead_type", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.lead_type) ? (object)DBNull.Value : enquiry.lead_type;
            db.AddParameter(command, "tags", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.tags) ? (object)DBNull.Value : enquiry.tags;
        }

        public async Task<bool> Delete(EnquiryDeleteReq enquiry)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, enquiry);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, EnquiryDeleteReq enquiry)
        {
            bool result = false;
            
            String query = @"
                UPDATE enquiries
                SET is_active = false,
                    updated_at = @updated_at
                WHERE id = @id
            ";
            
            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = enquiry.id;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            }
            
            return result;
        }
    }
}
