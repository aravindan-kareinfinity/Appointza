namespace appointza.Models
{
    public class Enquiry
    {
        public long id { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
        public string message { get; set; }
        public long organisation_id { get; set; }
        public long created_by { get; set; }
        public string notes { get; set; }
        public string status { get; set; } = "new";
        public string source { get; set; }
        public bool is_active { get; set; } = true;
        public string ip_address { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }

        // CRM lead fields
        public string business_name { get; set; }
        public string owner_name { get; set; }
        public string category { get; set; }
        public string website { get; set; }
        public string google_maps_link { get; set; }
        public string address { get; set; }
        public string pin_code { get; set; }
        public string area { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string lead_type { get; set; }
        public string tags { get; set; }
    }

    public class EnquirySelectReq
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public string status { get; set; }
        public string source { get; set; }
        public bool? is_active { get; set; }
    }

    public class EnquiryDeleteReq
    {
        public long id { get; set; }
    }
}
