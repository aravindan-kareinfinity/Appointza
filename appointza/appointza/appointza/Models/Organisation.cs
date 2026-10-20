using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class Organisation
    {
        public long id { get; set; }
public string name { get; set; }
public string gstnumber { get; set; }
public string secondarytypecode { get; set; }
public long secondarytype { get; set; }
public long primarytype { get; set; }
public long imageid { get; set; }
public long organisationlogo { get; set; }
public string tagline { get; set; }
public string primarytypecode { get; set; }
public int version { get; set; }
public long createdby { get; set; }
public DateTime createdon { get; set; }
public long modifiedby { get; set; }
public DateTime modifiedon { get; set; }

                                    public AttributesData attributes { get; set; }
                                    [JsonIgnore]
                                    public string attributes_json
                                    {
                                        get { return JsonSerializer.Serialize(attributes); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                attributes = JsonSerializer.Deserialize<AttributesData>(value);
                                        }
                                    }
                                
public bool isactive { get; set; }
public bool issuspended { get; set; }
public long parentid { get; set; }
public bool isfactory { get; set; }
public string notes { get; set; }
public decimal booking_amount { get; set; } = 5.10m;
public bool isserviceamount { get; set; }
public string referral_code { get; set; } = "";
public long referred_by_organisation_id { get; set; }
public string organisation_type { get; set; } = "service";

        /// <summary>Used only on insert to start SaaS trial; not a DB column.</summary>
        [JsonIgnore]
        public string subscription_plan_code { get; set; } = "";
        
                public class AttributesData
                {
                    /// <summary>Which catalogue lines this org sells: services, events, rooms.</summary>
                    public List<string> catalog_offerings { get; set; }

                    /// <summary>Organisation-wide concurrent booking counters for services.</summary>
                    public int? appointment_counter { get; set; }

                    /// <summary>How many days ahead customers may book (0 = no limit).</summary>
                    public int? appointment_openbefore { get; set; }

                    /// <summary>Preserve unknown attribute keys when round-tripping JSON.</summary>
                    [JsonExtensionData]
                    public Dictionary<string, JsonElement> ExtensionData { get; set; }
                }  
                
    }
    public class OrganisationSelectReq
    {
        public long id { get; set; }
        public string gstnumber { get; set; }
        public long OrganisationSecondaryType { get; set; }
        public long OrganisationPrimaryType { get; set; }
        public bool? RequireVerifiedLocation { get; set; } // Optional: if null or false, don't filter by isverified

    }
    public class OrganisationDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }

        public long oragnisationid { get; set; }
    }

    public class OrganisationDetail
    {
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public string organisationgstnumber { get; set; }
        public string organisationsecondarytypecode { get; set; }
        public long organisationsecondarytype { get; set; }
        public long organisationprimarytype { get; set; }
        public long organisationimageid { get; set; }
        public long organisationlogo { get; set; }
        public string organisationtagline { get; set; }
        public string organisationprimarytypecode { get; set; }
        public string organisationnotes { get; set; }

        public long organisationlocationid { get; set; }
        public string organisationlocationname { get; set; }
        public string organisationlocationaddressline1 { get; set; }
        public string organisationlocationaddressline2 { get; set; }
        public string organisationlocationcity { get; set; }
        public string organisationlocationstate { get; set; }
        public string organisationlocationcountry { get; set; }
        public double organisationlocationlatitude { get; set; }
        public double organisationlocationlongitude { get; set; }
        public string organisationlocationgooglelocation { get; set; }
        public string organisationlocationpincode { get; set; }
        public string organisationlocationcustomurl { get; set; }
        /// <summary>Stable public booking GUID (`organisationlocation.orgloctempid`).</summary>
        public string organisationlocationorgloctempid { get; set; } = "";
    }


}