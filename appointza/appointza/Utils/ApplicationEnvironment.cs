
namespace appointza.Utils
{
    public class ApplicationEnvironment
    {
        public string postgresqlconnection { get; set; }
        /// <summary>Campusza product database (school management domain).</summary>
        public string campusza_postgresqlconnection { get; set; }
        public ApplicationEnvironmentAwsS3ConfigData awss3config { get; set; } = new ApplicationEnvironmentAwsS3ConfigData();
        public string jwtsecret { get; set; }
        public ApplicationEnvironmentRazorpayConfigData razorpay { get; set; } = new ApplicationEnvironmentRazorpayConfigData();
        public ApplicationEnvironmentFirebaseConfigData firebase { get; set; } = new ApplicationEnvironmentFirebaseConfigData();
        public ApplicationEnvironmentWhatsAppConfigData whatsapp { get; set; } = new ApplicationEnvironmentWhatsAppConfigData();
        public ApplicationEnvironmentRedisConfigData redis { get; set; } = new ApplicationEnvironmentRedisConfigData();
        /// <summary>Public app/API origin; from appointza-urls.json when present.</summary>
        public string baseUrl { get; set; }
        /// <summary>Optional template host path; derived from appointza-urls / baseUrl.</summary>
        public string templateBaseUrl { get; set; }
    }
    public class ApplicationEnvironmentAwsS3ConfigData
    {
        public bool iss3enabled { get; set; }
        public string endpoint { get; set; }
        public string accesskey { get; set; }
        public string secretaccesskey { get; set; }
        public string bucketname { get; set; }
        public string path { get; set; }
    }

    public class ApplicationEnvironmentRazorpayConfigData
    {
        public string key_id { get; set; }
        public string key_secret { get; set; }
        public bool is_test_mode { get; set; }
    }

    public class ApplicationEnvironmentFirebaseConfigData
    {
        public string server_key { get; set; }
        public string sender_id { get; set; }
        public string project_id { get; set; }
    }

    public class ApplicationEnvironmentWhatsAppConfigData
    {
        public string api_key { get; set; }
        public string phone_number_id { get; set; }
        public string api_version { get; set; }
        public string base_url { get; set; }
        /// <summary>Meta app secret for X-Hub-Signature-256 verification (server only).</summary>
        public string app_secret { get; set; }
        /// <summary>Webhook verify token for Meta GET challenge (server only).</summary>
        public string verify_token { get; set; }
        /// <summary>
        /// Config kill-switch. When false, no outbound Meta sends (inbox/campaign/automation).
        /// DB table whatsapp_outbound_control can also pause outbound at runtime.
        /// </summary>
        public bool outbound_enabled { get; set; } = true;
        public WhatsAppWebhookWorkerOptions webhook_worker { get; set; } = new WhatsAppWebhookWorkerOptions();
        public WhatsAppCampaignWorkerOptions campaign_worker { get; set; } = new WhatsAppCampaignWorkerOptions();
        public WhatsAppAutomationWorkerOptions automation_worker { get; set; } = new WhatsAppAutomationWorkerOptions();
    }

    public class WhatsAppAutomationWorkerOptions
    {
        public int poll_interval_ms { get; set; } = 5000;
        public int batch_size { get; set; } = 15;
        public int max_attempts { get; set; } = 5;
        public int lease_seconds { get; set; } = 90;
        public int send_delay_ms { get; set; } = 200;
    }

    public class WhatsAppWebhookWorkerOptions
    {
        public int poll_interval_ms { get; set; } = 3000;
        public int batch_size { get; set; } = 10;
        public int max_retries { get; set; } = 5;
    }

    public class WhatsAppCampaignWorkerOptions
    {
        public int poll_interval_ms { get; set; } = 4000;
        public int campaign_batch_size { get; set; } = 3;
        public int recipient_batch_size { get; set; } = 10;
        public int max_attempts { get; set; } = 5;
        public int lease_seconds { get; set; } = 90;
        public int send_delay_ms { get; set; } = 250;
        public int max_sends_per_minute { get; set; } = 60;
    }

    public class ApplicationEnvironmentRedisConfigData
    {
        public string connection_string { get; set; }
        public string instance_name { get; set; }
        public int default_database { get; set; }
    }
}
