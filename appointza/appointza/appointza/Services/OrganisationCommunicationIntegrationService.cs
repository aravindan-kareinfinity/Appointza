using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace appointza.Services
{
    public class OrganisationCommunicationIntegrationService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;
        private readonly SecretProtector secretProtector;
        private readonly ApplicationEnvironment _settings;
        private readonly IConfiguration _configuration;

        public OrganisationCommunicationIntegrationService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            SecretProtector secretProtector,
            IOptions<ApplicationEnvironment> settings,
            IConfiguration configuration)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.secretProtector = secretProtector;
            _settings = settings.Value;
            _configuration = configuration;
        }

        public async Task<List<OrganisationIntegrationSafe>> Select(OrganisationIntegrationSelectReq req)
        {
            long orgId = ResolveOrganisationId(req.organisation_id);
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                var list = await SelectTransaction(db, orgId, req.provider, req.id);
                AttachWebhookSetup(list);
                return list;
            }
        }

        private void AttachWebhookSetup(List<OrganisationIntegrationSafe> list)
        {
            var token = (_settings.whatsapp?.verify_token ?? "").Trim();
            if (string.IsNullOrEmpty(token))
            {
                token = (_configuration["ApplicationSettings:whatsapp:verify_token"] ?? "").Trim();
            }
            var secret = (_settings.whatsapp?.app_secret ?? "").Trim();
            if (string.IsNullOrEmpty(secret))
            {
                secret = (_configuration["ApplicationSettings:whatsapp:app_secret"] ?? "").Trim();
            }
            foreach (var item in list)
            {
                if (!string.Equals(item.provider, IntegrationProviders.WhatsApp, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }
                item.webhook_verify_token = token;
                item.webhook_app_secret_configured = !string.IsNullOrEmpty(secret);
            }
        }

        public async Task<OrganisationIntegrationSafe> UpsertWhatsApp(WhatsAppIntegrationUpsertReq req)
        {
            long orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0)
            {
                throw new Exception("Organisation is required.");
            }

            string connectionName = string.IsNullOrWhiteSpace(req.connection_name)
                ? "WhatsApp Business"
                : req.connection_name.Trim();

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                long integrationId;

                if (req.id.HasValue && req.id.Value > 0)
                {
                    await EnsureOwnsIntegration(db, req.id.Value, orgId, IntegrationProviders.WhatsApp);
                    integrationId = req.id.Value;
                }
                else
                {
                    // One WhatsApp connection per org: reuse existing row to avoid
                    // uq_org_integrations_org_provider_name (org + provider + connection_name).
                    integrationId = await FindExistingIntegrationId(
                        db, orgId, IntegrationProviders.WhatsApp, connectionName);
                }

                if (integrationId > 0)
                {
                    await UpdateIntegrationShell(db, integrationId, connectionName, req.status ?? IntegrationStatuses.Connected);
                    await UpsertWhatsAppConnectionRow(db, integrationId, req);
                }
                else
                {
                    integrationId = await InsertIntegrationShell(db, orgId, IntegrationProviders.WhatsApp, connectionName, req.status ?? IntegrationStatuses.Connected);
                    await InsertWhatsAppConnection(db, integrationId, req);
                }

                if (!string.IsNullOrWhiteSpace(req.access_token))
                {
                    await UpsertSecret(db, integrationId, IntegrationSecretTypes.AccessToken, req.access_token.Trim(), req.access_token_expires_at);
                }

                var list = await SelectTransaction(db, orgId, IntegrationProviders.WhatsApp, integrationId);
                return list.First();
            }
        }

        public async Task<OrganisationIntegrationSafe> UpsertEmail(EmailIntegrationUpsertReq req)
        {
            long orgId = ResolveOrganisationId(req.organisation_id);
            if (orgId <= 0)
            {
                throw new Exception("Organisation is required.");
            }

            string connectionName = string.IsNullOrWhiteSpace(req.connection_name)
                ? (string.IsNullOrWhiteSpace(req.email_address) ? "Email Account" : req.email_address.Trim())
                : req.connection_name.Trim();

            string provider = NormalizeEmailProvider(req.email_provider);

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                long integrationId;

                if (req.id.HasValue && req.id.Value > 0)
                {
                    await EnsureOwnsIntegration(db, req.id.Value, orgId, IntegrationProviders.Email);
                    integrationId = req.id.Value;
                }
                else
                {
                    integrationId = await FindExistingIntegrationId(
                        db, orgId, IntegrationProviders.Email, connectionName);
                }

                if (integrationId > 0)
                {
                    await UpdateIntegrationShell(db, integrationId, connectionName, req.status ?? IntegrationStatuses.Connected);
                    await UpdateEmailConnection(db, integrationId, req, provider);
                }
                else
                {
                    integrationId = await InsertIntegrationShell(db, orgId, IntegrationProviders.Email, connectionName, req.status ?? IntegrationStatuses.Connected);
                    await InsertEmailConnection(db, integrationId, req, provider);
                }

                if (!string.IsNullOrWhiteSpace(req.access_token))
                {
                    await UpsertSecret(db, integrationId, IntegrationSecretTypes.AccessToken, req.access_token.Trim(), req.access_token_expires_at);
                }
                if (!string.IsNullOrWhiteSpace(req.refresh_token))
                {
                    await UpsertSecret(db, integrationId, IntegrationSecretTypes.RefreshToken, req.refresh_token.Trim(), null);
                }
                if (!string.IsNullOrWhiteSpace(req.smtp_password))
                {
                    await UpsertSecret(db, integrationId, IntegrationSecretTypes.SmtpPassword, req.smtp_password.Trim(), null);
                }

                var list = await SelectTransaction(db, orgId, IntegrationProviders.Email, integrationId);
                return list.First();
            }
        }

        public async Task<bool> Disconnect(OrganisationIntegrationDisconnectReq req)
        {
            long orgId = ResolveOrganisationId(req.organisation_id);
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await EnsureOwnsIntegration(db, req.id, orgId, null);

                string query = @"
                    UPDATE organization_integrations
                    SET status = @status, is_active = FALSE, updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id;
                ";
                {
                    DbCommand command = db.GetCommand(query);
                    db.AddParameter(command, "status", DbTypes.Types.String).Value = IntegrationStatuses.Disconnected;
                    db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                    db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
                    db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                    await db.ExecuteNonQuery(command);
                }

                // Remove encrypted secrets on disconnect
                string deleteSecrets = @"DELETE FROM integration_secrets WHERE integration_id = @integration_id;";
                {
                    DbCommand command = db.GetCommand(deleteSecrets);
                    db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = req.id;
                    await db.ExecuteNonQuery(command);
                }

                return true;
            }
        }

        public async Task<bool> Delete(OrganisationIntegrationDisconnectReq req)
        {
            long orgId = ResolveOrganisationId(req.organisation_id);
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await EnsureOwnsIntegration(db, req.id, orgId, null);

                string query = @"
                    DELETE FROM organization_integrations
                    WHERE id = @id AND organisation_id = @organisation_id;
                ";
                {
                    DbCommand command = db.GetCommand(query);
                    db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
                    db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                    await db.ExecuteNonQuery(command);
                }
                return true;
            }
        }

        /// <summary>
        /// Tenant comes only from the JWT. Client-supplied organisation_id is never trusted.
        /// If the client sends a non-zero org that does not match the JWT, reject the call.
        /// </summary>
        private long ResolveOrganisationId(long? requested)
        {
            long jwtOrg = 0;
            try
            {
                var ctx = requeststate.usercontext;
                if (ctx != null && ctx.organisationid > 0)
                {
                    jwtOrg = ctx.organisationid;
                }
            }
            catch
            {
                // ignore
            }

            if (jwtOrg <= 0)
            {
                throw new Exception("Organisation is required.");
            }

            if (requested.HasValue && requested.Value > 0 && requested.Value != jwtOrg)
            {
                throw new UnauthorizedAccessException("Cross-organisation access is not allowed.");
            }

            return jwtOrg;
        }

        private async Task<List<OrganisationIntegrationSafe>> SelectTransaction(
            IDb db,
            long organisationId,
            string? provider,
            long? id)
        {
            string query = @"
                SELECT
                    oi.id, oi.organisation_id, oi.provider, oi.connection_name, oi.status, oi.is_active,
                    oi.created_at, oi.updated_at,
                    wc.id AS wa_id, wc.waba_id, wc.phone_number_id, wc.business_phone, wc.meta_business_id,
                    wc.webhook_status, wc.default_template_booking, wc.default_template_reminder,
                    wc.notify_booking_confirmation, wc.notify_booking_reminder, wc.notify_event_registration,
                    ec.id AS em_id, ec.email_provider, ec.email_address, ec.sender_name, ec.reply_to,
                    ec.oauth_connection_id, ec.smtp_host, ec.smtp_port, ec.smtp_tls_mode, ec.smtp_username,
                    ec.last_sync_at, ec.notify_booking, ec.notify_event
                FROM organization_integrations oi
                LEFT JOIN whatsapp_connections wc ON wc.integration_id = oi.id
                LEFT JOIN email_connections ec ON ec.integration_id = oi.id
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("oi.organisation_id", "=", "organisation_id", organisationId, DbTypes.Types.Long);

            if (!string.IsNullOrEmpty(provider))
            {
                queryBuilder.AddParameter("oi.provider", "=", "provider", provider, DbTypes.Types.String);
            }
            if (id.HasValue && id.Value > 0)
            {
                queryBuilder.AddParameter("oi.id", "=", "id", id.Value, DbTypes.Types.Long);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "oi.id");
            var command = queryBuilder.GetCommand(db);

            var result = new List<OrganisationIntegrationSafe>();
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var item = new OrganisationIntegrationSafe
                    {
                        id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                        organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]),
                        provider = reader["provider"] == DBNull.Value ? "" : reader["provider"].ToString() ?? "",
                        connection_name = reader["connection_name"] == DBNull.Value ? "" : reader["connection_name"].ToString() ?? "",
                        status = reader["status"] == DBNull.Value ? IntegrationStatuses.Disconnected : reader["status"].ToString() ?? IntegrationStatuses.Disconnected,
                        is_active = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                        created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                        updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
                    };

                    if (item.provider == IntegrationProviders.WhatsApp && reader["wa_id"] != DBNull.Value)
                    {
                        item.whatsapp = new WhatsAppConnectionSafe
                        {
                            id = Convert.ToInt64(reader["wa_id"]),
                            integration_id = item.id,
                            waba_id = reader["waba_id"] == DBNull.Value ? "" : reader["waba_id"].ToString() ?? "",
                            phone_number_id = reader["phone_number_id"] == DBNull.Value ? "" : reader["phone_number_id"].ToString() ?? "",
                            business_phone = reader["business_phone"] == DBNull.Value ? "" : reader["business_phone"].ToString() ?? "",
                            meta_business_id = reader["meta_business_id"] == DBNull.Value ? "" : reader["meta_business_id"].ToString() ?? "",
                            webhook_status = reader["webhook_status"] == DBNull.Value ? "not_subscribed" : reader["webhook_status"].ToString() ?? "not_subscribed",
                            default_template_booking = reader["default_template_booking"] == DBNull.Value ? "" : reader["default_template_booking"].ToString() ?? "",
                            default_template_reminder = reader["default_template_reminder"] == DBNull.Value ? "" : reader["default_template_reminder"].ToString() ?? "",
                            notify_booking_confirmation = reader["notify_booking_confirmation"] == DBNull.Value || Convert.ToBoolean(reader["notify_booking_confirmation"]),
                            notify_booking_reminder = reader["notify_booking_reminder"] == DBNull.Value || Convert.ToBoolean(reader["notify_booking_reminder"]),
                            notify_event_registration = reader["notify_event_registration"] == DBNull.Value || Convert.ToBoolean(reader["notify_event_registration"]),
                        };
                    }

                    if (item.provider == IntegrationProviders.Email && reader["em_id"] != DBNull.Value)
                    {
                        item.email = new EmailConnectionSafe
                        {
                            id = Convert.ToInt64(reader["em_id"]),
                            integration_id = item.id,
                            email_provider = reader["email_provider"] == DBNull.Value ? "gmail" : reader["email_provider"].ToString() ?? "gmail",
                            email_address = reader["email_address"] == DBNull.Value ? "" : reader["email_address"].ToString() ?? "",
                            sender_name = reader["sender_name"] == DBNull.Value ? "" : reader["sender_name"].ToString() ?? "",
                            reply_to = reader["reply_to"] == DBNull.Value ? "" : reader["reply_to"].ToString() ?? "",
                            oauth_connection_id = reader["oauth_connection_id"] == DBNull.Value ? "" : reader["oauth_connection_id"].ToString() ?? "",
                            smtp_host = reader["smtp_host"] == DBNull.Value ? "" : reader["smtp_host"].ToString() ?? "",
                            smtp_port = reader["smtp_port"] == DBNull.Value ? 587 : Convert.ToInt32(reader["smtp_port"]),
                            smtp_tls_mode = reader["smtp_tls_mode"] == DBNull.Value ? "starttls" : reader["smtp_tls_mode"].ToString() ?? "starttls",
                            smtp_username = reader["smtp_username"] == DBNull.Value ? "" : reader["smtp_username"].ToString() ?? "",
                            last_sync_at = reader["last_sync_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["last_sync_at"]),
                            notify_booking = reader["notify_booking"] == DBNull.Value || Convert.ToBoolean(reader["notify_booking"]),
                            notify_event = reader["notify_event"] == DBNull.Value || Convert.ToBoolean(reader["notify_event"]),
                        };
                    }

                    result.Add(item);
                }
            }

            foreach (var item in result)
            {
                await AttachSecretFlags(db, item);
            }

            return result;
        }

        private async Task AttachSecretFlags(IDb db, OrganisationIntegrationSafe item)
        {
            string query = @"
                SELECT secret_type, expires_at
                FROM integration_secrets
                WHERE integration_id = @integration_id;
            ";
            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = item.id;
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        string type = reader["secret_type"] == DBNull.Value ? "" : reader["secret_type"].ToString() ?? "";
                        DateTime? expires = reader["expires_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["expires_at"]);
                        if (type == IntegrationSecretTypes.AccessToken)
                        {
                            item.has_access_token = true;
                            item.secret_expires_at = expires;
                        }
                        else if (type == IntegrationSecretTypes.RefreshToken)
                        {
                            item.has_refresh_token = true;
                        }
                        else if (type == IntegrationSecretTypes.SmtpPassword)
                        {
                            item.has_smtp_password = true;
                        }
                    }
                }
            }
        }

        private async Task EnsureOwnsIntegration(IDb db, long id, long organisationId, string? expectedProvider)
        {
            string query = @"
                SELECT id, provider FROM organization_integrations
                WHERE id = @id AND organisation_id = @organisation_id;
            ";
            string provider = "";
            bool found = false;
            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        found = true;
                        provider = reader["provider"] == DBNull.Value ? "" : reader["provider"].ToString() ?? "";
                    }
                }
            }
            if (!found)
            {
                throw new Exception("Integration not found for this organisation.");
            }
            if (!string.IsNullOrEmpty(expectedProvider) &&
                !string.Equals(provider, expectedProvider, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("Integration provider mismatch.");
            }
        }

        /// <summary>
        /// Prefer row with the same connection_name; otherwise any integration for org+provider.
        /// </summary>
        private async Task<long> FindExistingIntegrationId(
            IDb db,
            long organisationId,
            string provider,
            string connectionName)
        {
            string query = @"
                SELECT id
                FROM organization_integrations
                WHERE organisation_id = @organisation_id
                  AND provider = @provider
                ORDER BY
                    CASE WHEN connection_name = @connection_name THEN 0 ELSE 1 END,
                    id ASC
                LIMIT 1;";
            long foundId = 0;
            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "provider", DbTypes.Types.String).Value = provider;
                db.AddParameter(command, "connection_name", DbTypes.Types.String).Value = connectionName ?? "";
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        foundId = Convert.ToInt64(reader["id"]);
                    }
                }
            }
            return foundId;
        }

        private async Task UpsertWhatsAppConnectionRow(IDb db, long integrationId, WhatsAppIntegrationUpsertReq req)
        {
            bool exists = false;
            string existsSql = @"
                SELECT 1 FROM whatsapp_connections WHERE integration_id = @integration_id LIMIT 1;";
            using (DbCommand command = db.GetCommand(existsSql))
            {
                db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId;
                using (DbDataReader reader = await db.Execute(command))
                {
                    exists = await reader.ReadAsync();
                }
            }
            if (exists)
            {
                await UpdateWhatsAppConnection(db, integrationId, req);
            }
            else
            {
                await InsertWhatsAppConnection(db, integrationId, req);
            }
        }

        private async Task<long> InsertIntegrationShell(IDb db, long organisationId, string provider, string connectionName, string status)
        {
            string query = @"
                INSERT INTO organization_integrations (
                    organisation_id, provider, connection_name, status, is_active, created_at, updated_at
                ) VALUES (
                    @organisation_id, @provider, @connection_name, @status, TRUE, @created_at, @updated_at
                )
                RETURNING id;
            ";
            long newId = 0;
            using (DbCommand command = db.GetCommand(query))
            {
                var now = DateTime.UtcNow;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                db.AddParameter(command, "provider", DbTypes.Types.String).Value = provider;
                db.AddParameter(command, "connection_name", DbTypes.Types.String).Value = connectionName;
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        newId = Convert.ToInt64(reader["id"]);
                    }
                }
            }
            if (newId > 0) return newId;
            throw new Exception("Failed to create integration.");
        }

        private async Task UpdateIntegrationShell(IDb db, long id, string connectionName, string status)
        {
            string query = @"
                UPDATE organization_integrations
                SET connection_name = @connection_name, status = @status, is_active = TRUE, updated_at = @updated_at
                WHERE id = @id;
            ";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "connection_name", DbTypes.Types.String).Value = connectionName;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            await db.ExecuteNonQuery(command);
        }

        private async Task InsertWhatsAppConnection(IDb db, long integrationId, WhatsAppIntegrationUpsertReq req)
        {
            string query = @"
                INSERT INTO whatsapp_connections (
                    integration_id, waba_id, phone_number_id, business_phone, meta_business_id, webhook_status,
                    default_template_booking, default_template_reminder,
                    notify_booking_confirmation, notify_booking_reminder, notify_event_registration,
                    created_at, updated_at
                ) VALUES (
                    @integration_id, @waba_id, @phone_number_id, @business_phone, @meta_business_id, @webhook_status,
                    @default_template_booking, @default_template_reminder,
                    @notify_booking_confirmation, @notify_booking_reminder, @notify_event_registration,
                    @created_at, @updated_at
                );
            ";
            DbCommand command = db.GetCommand(query);
            BindWhatsAppParams(db, command, integrationId, req);
            await db.ExecuteNonQuery(command);
        }

        private async Task UpdateWhatsAppConnection(IDb db, long integrationId, WhatsAppIntegrationUpsertReq req)
        {
            string query = @"
                UPDATE whatsapp_connections SET
                    waba_id = @waba_id,
                    phone_number_id = @phone_number_id,
                    business_phone = @business_phone,
                    meta_business_id = @meta_business_id,
                    webhook_status = @webhook_status,
                    default_template_booking = @default_template_booking,
                    default_template_reminder = @default_template_reminder,
                    notify_booking_confirmation = @notify_booking_confirmation,
                    notify_booking_reminder = @notify_booking_reminder,
                    notify_event_registration = @notify_event_registration,
                    updated_at = @updated_at
                WHERE integration_id = @integration_id;
            ";
            DbCommand command = db.GetCommand(query);
            BindWhatsAppParams(db, command, integrationId, req);
            await db.ExecuteNonQuery(command);
        }

        private void BindWhatsAppParams(IDb db, DbCommand command, long integrationId, WhatsAppIntegrationUpsertReq req)
        {
            var now = DateTime.UtcNow;
            db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId;
            db.AddParameter(command, "waba_id", DbTypes.Types.String).Value = req.waba_id?.Trim() ?? "";
            db.AddParameter(command, "phone_number_id", DbTypes.Types.String).Value = req.phone_number_id?.Trim() ?? "";
            db.AddParameter(command, "business_phone", DbTypes.Types.String).Value = req.business_phone?.Trim() ?? "";
            db.AddParameter(command, "meta_business_id", DbTypes.Types.String).Value = req.meta_business_id?.Trim() ?? "";
            db.AddParameter(command, "webhook_status", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(req.webhook_status) ? "not_subscribed" : req.webhook_status.Trim();
            db.AddParameter(command, "default_template_booking", DbTypes.Types.String).Value = req.default_template_booking?.Trim() ?? "";
            db.AddParameter(command, "default_template_reminder", DbTypes.Types.String).Value = req.default_template_reminder?.Trim() ?? "";
            db.AddParameter(command, "notify_booking_confirmation", DbTypes.Types.Boolean).Value = req.notify_booking_confirmation;
            db.AddParameter(command, "notify_booking_reminder", DbTypes.Types.Boolean).Value = req.notify_booking_reminder;
            db.AddParameter(command, "notify_event_registration", DbTypes.Types.Boolean).Value = req.notify_event_registration;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
        }

        private async Task InsertEmailConnection(IDb db, long integrationId, EmailIntegrationUpsertReq req, string provider)
        {
            string query = @"
                INSERT INTO email_connections (
                    integration_id, email_provider, email_address, sender_name, reply_to, oauth_connection_id,
                    smtp_host, smtp_port, smtp_tls_mode, smtp_username,
                    notify_booking, notify_event, created_at, updated_at
                ) VALUES (
                    @integration_id, @email_provider, @email_address, @sender_name, @reply_to, @oauth_connection_id,
                    @smtp_host, @smtp_port, @smtp_tls_mode, @smtp_username,
                    @notify_booking, @notify_event, @created_at, @updated_at
                );
            ";
            DbCommand insertCmd = db.GetCommand(query);
            BindEmailParams(db, insertCmd, integrationId, req, provider);
            await db.ExecuteNonQuery(insertCmd);
        }

        private async Task UpdateEmailConnection(IDb db, long integrationId, EmailIntegrationUpsertReq req, string provider)
        {
            string query = @"
                UPDATE email_connections SET
                    email_provider = @email_provider,
                    email_address = @email_address,
                    sender_name = @sender_name,
                    reply_to = @reply_to,
                    oauth_connection_id = @oauth_connection_id,
                    smtp_host = @smtp_host,
                    smtp_port = @smtp_port,
                    smtp_tls_mode = @smtp_tls_mode,
                    smtp_username = @smtp_username,
                    notify_booking = @notify_booking,
                    notify_event = @notify_event,
                    updated_at = @updated_at
                WHERE integration_id = @integration_id;
            ";
            DbCommand updateCmd = db.GetCommand(query);
            BindEmailParams(db, updateCmd, integrationId, req, provider);
            await db.ExecuteNonQuery(updateCmd);
        }

        private void BindEmailParams(IDb db, DbCommand command, long integrationId, EmailIntegrationUpsertReq req, string provider)
        {
            var now = DateTime.UtcNow;
            db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId;
            db.AddParameter(command, "email_provider", DbTypes.Types.String).Value = provider;
            db.AddParameter(command, "email_address", DbTypes.Types.String).Value = req.email_address?.Trim() ?? "";
            db.AddParameter(command, "sender_name", DbTypes.Types.String).Value = req.sender_name?.Trim() ?? "";
            db.AddParameter(command, "reply_to", DbTypes.Types.String).Value = req.reply_to?.Trim() ?? "";
            db.AddParameter(command, "oauth_connection_id", DbTypes.Types.String).Value = req.oauth_connection_id?.Trim() ?? "";
            db.AddParameter(command, "smtp_host", DbTypes.Types.String).Value = req.smtp_host?.Trim() ?? "";
            db.AddParameter(command, "smtp_port", DbTypes.Types.Integer).Value = req.smtp_port > 0 ? req.smtp_port : 587;
            db.AddParameter(command, "smtp_tls_mode", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(req.smtp_tls_mode) ? "starttls" : req.smtp_tls_mode.Trim();
            db.AddParameter(command, "smtp_username", DbTypes.Types.String).Value = req.smtp_username?.Trim() ?? "";
            db.AddParameter(command, "notify_booking", DbTypes.Types.Boolean).Value = req.notify_booking;
            db.AddParameter(command, "notify_event", DbTypes.Types.Boolean).Value = req.notify_event;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
        }

        private async Task UpsertSecret(IDb db, long integrationId, string secretType, string plaintext, DateTime? expiresAt)
        {
            string encrypted = secretProtector.Encrypt(plaintext);
            string query = @"
                INSERT INTO integration_secrets (
                    integration_id, secret_type, encrypted_value, expires_at, rotated_at, created_at, updated_at
                ) VALUES (
                    @integration_id, @secret_type, @encrypted_value, @expires_at, @rotated_at, @created_at, @updated_at
                )
                ON CONFLICT (integration_id, secret_type) DO UPDATE SET
                    encrypted_value = EXCLUDED.encrypted_value,
                    expires_at = EXCLUDED.expires_at,
                    rotated_at = EXCLUDED.rotated_at,
                    updated_at = EXCLUDED.updated_at;
            ";
            var now = DateTime.UtcNow;
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId;
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = secretType;
            db.AddParameter(command, "encrypted_value", DbTypes.Types.String).Value = encrypted;
            db.AddParameter(command, "expires_at", DbTypes.Types.DateTime).Value = expiresAt.HasValue ? expiresAt.Value : (object)DBNull.Value;
            db.AddParameter(command, "rotated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);
        }

        private static string NormalizeEmailProvider(string? provider)
        {
            var p = (provider ?? "gmail").Trim().ToLowerInvariant();
            return p switch
            {
                "google_workspace" or "google-workspace" or "workspace" => "google_workspace",
                "microsoft365" or "microsoft" or "outlook" or "o365" => "microsoft365",
                "smtp" => "smtp",
                _ => "gmail",
            };
        }
    }
}
