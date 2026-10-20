using System;
using System.Collections.Generic;

namespace appointza.Models
{
    public class OrganisationCrmCatalogueSelectReq
    {
        public long organisation_id { get; set; }
    }

    /// <summary>Read-only CRM catalogue overview for staff (org + offerings).</summary>
    public class OrganisationCrmCatalogueOverview
    {
        public OrganisationCrmOrgSummary organisation { get; set; } = new();
        public List<OrganisationCrmLocationItem> locations { get; set; } = new();
        public List<OrganisationCrmServiceItem> services { get; set; } = new();
        public List<OrganisationCrmEventItem> events { get; set; } = new();
        public List<OrganisationCrmRoomItem> rooms { get; set; } = new();
    }

    public class OrganisationCrmOrgSummary
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string tagline { get; set; } = "";
        public string organisation_type { get; set; } = "";
        public string gstnumber { get; set; } = "";
        public string notes { get; set; } = "";
        public bool isactive { get; set; }
        public long organisationlogo { get; set; }
        public long imageid { get; set; }
    }

    public class OrganisationCrmLocationItem
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public string address { get; set; } = "";
        public string city { get; set; } = "";
        public string mobile { get; set; } = "";
        public string email { get; set; } = "";
        public bool isactive { get; set; }
    }

    public class OrganisationCrmServiceItem
    {
        public long id { get; set; }
        public string name { get; set; } = "";
        public long price { get; set; }
        public long weekday_price { get; set; }
        public long weekend_price { get; set; }
        public long duration_minutes { get; set; }
        public bool is_combo { get; set; }
        public bool show_price { get; set; }
        public bool isactive { get; set; }
        public decimal? rating { get; set; }
        public long organisationlocationid { get; set; }
    }

    public class OrganisationCrmEventItem
    {
        public long id { get; set; }
        public string event_name { get; set; } = "";
        public string event_type { get; set; } = "";
        public DateTime? event_date { get; set; }
        public DateTime? from_date { get; set; }
        public DateTime? to_date { get; set; }
        public string start_time { get; set; } = "";
        public string end_time { get; set; } = "";
        public string location { get; set; } = "";
        public string status { get; set; } = "";
        public decimal entry_amount { get; set; }
        public int slot_limit { get; set; }
        public long remainingslot { get; set; }
        public bool is_public { get; set; }
        public bool isactive { get; set; }
    }

    public class OrganisationCrmRoomItem
    {
        public long id { get; set; }
        public string room_number { get; set; } = "";
        public string room_name { get; set; } = "";
        public string room_type { get; set; } = "";
        public string status { get; set; } = "";
        public long organisation_location_id { get; set; }
        public bool isactive { get; set; }
    }
}
