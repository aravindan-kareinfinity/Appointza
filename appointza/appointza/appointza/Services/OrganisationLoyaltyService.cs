using appointza.Models.Loyalty;
using appointza.Utils;
using System.Data.Common;
using System.Text.Json;

namespace appointza.Services
{
    public class OrganisationLoyaltyService
    {
        readonly IDbProvider dbprovider;
        static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        public OrganisationLoyaltyService(IDbProvider dbprovider)
        {
            this.dbprovider = dbprovider;
        }

        public async Task EnsureSchemaTransaction(IDb db)
        {
            string[] statements =
            [
                """
                CREATE TABLE IF NOT EXISTS organisation_loyalty_settings (
                    organisation_id BIGINT PRIMARY KEY,
                    points_per_service INT NOT NULL DEFAULT 0,
                    points_per_rupee_spent DECIMAL(10, 4) NOT NULL DEFAULT 0,
                    bonus_points INT NOT NULL DEFAULT 0,
                    referral_points INT NOT NULL DEFAULT 0,
                    birthday_bonus_points INT NOT NULL DEFAULT 0,
                    anniversary_bonus_points INT NOT NULL DEFAULT 0,
                    redemption_points_per_rupee INT NOT NULL DEFAULT 100,
                    redemption_rupee_value DECIMAL(10, 2) NOT NULL DEFAULT 50,
                    min_redemption_points INT NOT NULL DEFAULT 100,
                    points_expiry_days INT NOT NULL DEFAULT 365,
                    max_points_per_transaction INT NOT NULL DEFAULT 0,
                    combine_with_discounts BOOLEAN NOT NULL DEFAULT FALSE,
                    allow_transfer BOOLEAN NOT NULL DEFAULT FALSE,
                    allow_partial_redemption BOOLEAN NOT NULL DEFAULT TRUE,
                    isactive BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS organisation_loyalty_schemes (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
                    start_date DATE,
                    end_date DATE,
                    eligible_customer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
                    eligible_service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
                    min_completed_services INT NOT NULL DEFAULT 0,
                    reward_type VARCHAR(40) NOT NULL DEFAULT 'loyalty_points',
                    reward_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    max_reward_limit DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    reward_expiry_days INT NOT NULL DEFAULT 30,
                    terms_and_conditions TEXT NOT NULL DEFAULT '',
                    sort_order INT NOT NULL DEFAULT 0,
                    isactive BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_loyalty_schemes_org ON organisation_loyalty_schemes (organisation_id)",
                """
                CREATE TABLE IF NOT EXISTS organisation_loyalty_rules (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    scheme_id BIGINT,
                    name VARCHAR(200) NOT NULL DEFAULT '',
                    trigger_type VARCHAR(40) NOT NULL DEFAULT 'completed_services',
                    trigger_operator VARCHAR(10) NOT NULL DEFAULT '>=',
                    trigger_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    trigger_period_days INT NOT NULL DEFAULT 0,
                    reward_type VARCHAR(40) NOT NULL DEFAULT 'percentage_discount',
                    reward_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    apply_on VARCHAR(40) NOT NULL DEFAULT 'next_service',
                    max_discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    reward_expiry_days INT NOT NULL DEFAULT 30,
                    free_service_id BIGINT NOT NULL DEFAULT 0,
                    priority INT NOT NULL DEFAULT 0,
                    isactive BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_loyalty_rules_org ON organisation_loyalty_rules (organisation_id)",
                """
                CREATE TABLE IF NOT EXISTS organisation_loyalty_tiers (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    min_services INT NOT NULL DEFAULT 0,
                    max_services INT,
                    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
                    benefits_json JSONB NOT NULL DEFAULT '[]'::jsonb,
                    sort_order INT NOT NULL DEFAULT 0,
                    isactive BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS client_loyalty_wallet (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    client_user_id BIGINT NOT NULL,
                    current_points INT NOT NULL DEFAULT 0,
                    total_points_earned INT NOT NULL DEFAULT 0,
                    total_points_redeemed INT NOT NULL DEFAULT 0,
                    completed_services_count INT NOT NULL DEFAULT 0,
                    total_spend DECIMAL(14, 2) NOT NULL DEFAULT 0,
                    current_tier_id BIGINT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (organisation_id, client_user_id)
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS loyalty_point_transactions (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    client_user_id BIGINT NOT NULL,
                    transaction_type VARCHAR(30) NOT NULL,
                    points_delta INT NOT NULL,
                    balance_after INT NOT NULL,
                    reference_type VARCHAR(40) NOT NULL DEFAULT '',
                    reference_id BIGINT NOT NULL DEFAULT 0,
                    description TEXT NOT NULL DEFAULT '',
                    created_by BIGINT NOT NULL DEFAULT 0,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS loyalty_reward_grants (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    client_user_id BIGINT NOT NULL,
                    scheme_id BIGINT,
                    rule_id BIGINT,
                    reward_type VARCHAR(40) NOT NULL,
                    reward_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    status VARCHAR(20) NOT NULL DEFAULT 'available',
                    apply_on VARCHAR(40) NOT NULL DEFAULT 'next_service',
                    max_discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    source_appointment_id BIGINT NOT NULL DEFAULT 0,
                    coupon_code VARCHAR(64) NOT NULL DEFAULT '',
                    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    redeemed_at TIMESTAMP,
                    redeemed_appointment_id BIGINT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
            ];

            foreach (var sql in statements)
            {
                DbCommand cmd = db.GetCommand(sql);
                await db.ExecuteNonQuery(cmd);
            }
        }

        public async Task<LoyaltyDashboard> GetDashboard(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var settings = await GetOrCreateSettingsTransaction(db, organisationId);
            var dashboard = new LoyaltyDashboard
            {
                organisation_id = organisationId,
                settings = settings,
            };

            const string stats = @"
                SELECT
                    (SELECT COUNT(*) FROM organisation_loyalty_schemes WHERE organisation_id = @org AND isactive = true) AS total_schemes,
                    (SELECT COUNT(*) FROM organisation_loyalty_schemes WHERE organisation_id = @org AND isactive = true AND status = 'active') AS active_schemes,
                    (SELECT COUNT(*) FROM client_loyalty_wallet WHERE organisation_id = @org) AS enrolled,
                    COALESCE((SELECT SUM(total_points_earned) FROM client_loyalty_wallet WHERE organisation_id = @org), 0) AS issued,
                    COALESCE((SELECT SUM(total_points_redeemed) FROM client_loyalty_wallet WHERE organisation_id = @org), 0) AS redeemed,
                    (SELECT COUNT(*) FROM loyalty_reward_grants WHERE organisation_id = @org AND status = 'available') AS available_rewards";

            DbCommand cmd = db.GetCommand(stats);
            db.AddParameter(cmd, "org", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                dashboard.total_schemes = Convert.ToInt32(reader["total_schemes"]);
                dashboard.active_schemes = Convert.ToInt32(reader["active_schemes"]);
                dashboard.enrolled_customers = Convert.ToInt32(reader["enrolled"]);
                dashboard.points_issued = Convert.ToInt32(reader["issued"]);
                dashboard.points_redeemed = Convert.ToInt32(reader["redeemed"]);
                dashboard.available_rewards = Convert.ToInt32(reader["available_rewards"]);
            }

            return dashboard;
        }

        public async Task<OrganisationLoyaltySettings> GetSettings(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            return await GetOrCreateSettingsTransaction(db, organisationId);
        }

        public async Task<OrganisationLoyaltySettings> SaveSettings(LoyaltySettingsSaveReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            await GetOrCreateSettingsTransaction(db, req.organisation_id);

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_loyalty_settings SET
                    points_per_service = @points_per_service,
                    points_per_rupee_spent = @points_per_rupee_spent,
                    bonus_points = @bonus_points,
                    referral_points = @referral_points,
                    birthday_bonus_points = @birthday_bonus_points,
                    anniversary_bonus_points = @anniversary_bonus_points,
                    redemption_points_per_rupee = @redemption_points_per_rupee,
                    redemption_rupee_value = @redemption_rupee_value,
                    min_redemption_points = @min_redemption_points,
                    points_expiry_days = @points_expiry_days,
                    max_points_per_transaction = @max_points_per_transaction,
                    combine_with_discounts = @combine_with_discounts,
                    allow_transfer = @allow_transfer,
                    allow_partial_redemption = @allow_partial_redemption,
                    isactive = @isactive,
                    updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand cmd = db.GetCommand(update);
            BindSettingsParams(cmd, db, req, now);
            await db.ExecuteNonQuery(cmd);
            return await GetOrCreateSettingsTransaction(db, req.organisation_id);
        }

        public async Task<List<LoyaltyScheme>> SelectSchemes(LoyaltySchemeSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var sql = @"
                SELECT id, organisation_id, name, description, status, start_date, end_date,
                       eligible_customer_ids, eligible_service_ids, min_completed_services,
                       reward_type, reward_value, max_reward_limit, reward_expiry_days,
                       terms_and_conditions, sort_order, isactive, created_at, updated_at
                FROM organisation_loyalty_schemes
                WHERE organisation_id = @organisation_id AND isactive = true";

            if (req.id > 0) sql += " AND id = @id";
            if (!string.IsNullOrWhiteSpace(req.status)) sql += " AND status = @status";
            sql += " ORDER BY sort_order, id";

            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            if (req.id > 0) db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
            if (!string.IsNullOrWhiteSpace(req.status))
                db.AddParameter(cmd, "status", DbTypes.Types.String).Value = req.status!;

            var schemes = new List<LoyaltyScheme>();
            using (DbDataReader reader = await db.Execute(cmd))
            {
                while (await reader.ReadAsync())
                    schemes.Add(MapScheme(reader));
            }

            foreach (var scheme in schemes)
            {
                scheme.rules = await SelectRulesTransaction(db, req.organisation_id, scheme.id);
            }

            return schemes;
        }

        public async Task<LoyaltyScheme> SaveScheme(LoyaltySchemeSaveReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var now = DateTime.UtcNow;
            if (req.id <= 0)
            {
                const string insert = @"
                    INSERT INTO organisation_loyalty_schemes (
                        organisation_id, name, description, status, start_date, end_date,
                        eligible_customer_ids, eligible_service_ids, min_completed_services,
                        reward_type, reward_value, max_reward_limit, reward_expiry_days,
                        terms_and_conditions, sort_order, isactive, created_at, updated_at
                    ) VALUES (
                        @organisation_id, @name, @description, @status, @start_date::date, @end_date::date,
                        @eligible_customer_ids::jsonb, @eligible_service_ids::jsonb, @min_completed_services,
                        @reward_type, @reward_value, @max_reward_limit, @reward_expiry_days,
                        @terms_and_conditions, @sort_order, @isactive, @created_at, @updated_at
                    ) RETURNING id";

                DbCommand cmd = db.GetCommand(insert);
                BindSchemeParams(cmd, db, req, now);
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
                using DbDataReader reader = await db.Execute(cmd);
                if (await reader.ReadAsync())
                    req.id = Convert.ToInt64(reader["id"]);
            }
            else
            {
                const string update = @"
                    UPDATE organisation_loyalty_schemes SET
                        name = @name, description = @description, status = @status,
                        start_date = @start_date::date, end_date = @end_date::date,
                        eligible_customer_ids = @eligible_customer_ids::jsonb,
                        eligible_service_ids = @eligible_service_ids::jsonb,
                        min_completed_services = @min_completed_services,
                        reward_type = @reward_type, reward_value = @reward_value,
                        max_reward_limit = @max_reward_limit, reward_expiry_days = @reward_expiry_days,
                        terms_and_conditions = @terms_and_conditions, sort_order = @sort_order,
                        isactive = @isactive, updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id";

                DbCommand cmd = db.GetCommand(update);
                BindSchemeParams(cmd, db, req, now);
                db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
                await db.ExecuteNonQuery(cmd);
            }

            var saved = (await SelectSchemes(new LoyaltySchemeSelectReq
            {
                organisation_id = req.organisation_id,
                id = req.id,
            })).FirstOrDefault() ?? req;

            return saved;
        }

        public async Task DeleteScheme(LoyaltySchemeDeleteReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            DbCommand cmd = db.GetCommand(@"
                UPDATE organisation_loyalty_schemes
                SET isactive = false, updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id");
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<LoyaltyRule> SaveRule(LoyaltyRuleSaveReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var now = DateTime.UtcNow;
            if (req.id <= 0)
            {
                const string insert = @"
                    INSERT INTO organisation_loyalty_rules (
                        organisation_id, scheme_id, name, trigger_type, trigger_operator, trigger_value,
                        trigger_period_days, reward_type, reward_value, apply_on, max_discount_amount,
                        reward_expiry_days, free_service_id, priority, isactive, created_at, updated_at
                    ) VALUES (
                        @organisation_id, @scheme_id, @name, @trigger_type, @trigger_operator, @trigger_value,
                        @trigger_period_days, @reward_type, @reward_value, @apply_on, @max_discount_amount,
                        @reward_expiry_days, @free_service_id, @priority, @isactive, @created_at, @updated_at
                    ) RETURNING id";

                DbCommand cmd = db.GetCommand(insert);
                BindRuleParams(cmd, db, req, now);
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
                using DbDataReader reader = await db.Execute(cmd);
                if (await reader.ReadAsync())
                    req.id = Convert.ToInt64(reader["id"]);
            }
            else
            {
                const string update = @"
                    UPDATE organisation_loyalty_rules SET
                        scheme_id = @scheme_id, name = @name, trigger_type = @trigger_type,
                        trigger_operator = @trigger_operator, trigger_value = @trigger_value,
                        trigger_period_days = @trigger_period_days, reward_type = @reward_type,
                        reward_value = @reward_value, apply_on = @apply_on,
                        max_discount_amount = @max_discount_amount, reward_expiry_days = @reward_expiry_days,
                        free_service_id = @free_service_id, priority = @priority,
                        isactive = @isactive, updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id";

                DbCommand cmd = db.GetCommand(update);
                BindRuleParams(cmd, db, req, now);
                db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
                await db.ExecuteNonQuery(cmd);
            }

            return req;
        }

        public async Task DeleteRule(LoyaltyRuleDeleteReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            DbCommand cmd = db.GetCommand(@"
                UPDATE organisation_loyalty_rules SET isactive = false, updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id");
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<List<LoyaltyTier>> SelectTiers(LoyaltyTierSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            DbCommand cmd = db.GetCommand(@"
                SELECT id, organisation_id, name, min_services, max_services, discount_percent,
                       benefits_json, sort_order, isactive, created_at, updated_at
                FROM organisation_loyalty_tiers
                WHERE organisation_id = @organisation_id AND isactive = true
                ORDER BY sort_order, min_services");

            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            var tiers = new List<LoyaltyTier>();
            using DbDataReader reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
                tiers.Add(MapTier(reader));
            return tiers;
        }

        public async Task<LoyaltyTier> SaveTier(LoyaltyTierSaveReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var now = DateTime.UtcNow;
            var benefitsJson = JsonSerializer.Serialize(req.benefits ?? [], JsonOpts);

            if (req.id <= 0)
            {
                DbCommand cmd = db.GetCommand(@"
                    INSERT INTO organisation_loyalty_tiers (
                        organisation_id, name, min_services, max_services, discount_percent,
                        benefits_json, sort_order, isactive, created_at, updated_at
                    ) VALUES (
                        @organisation_id, @name, @min_services, @max_services, @discount_percent,
                        @benefits_json::jsonb, @sort_order, @isactive, @created_at, @updated_at
                    ) RETURNING id");
                db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
                db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.name ?? "";
                db.AddParameter(cmd, "min_services", DbTypes.Types.Integer).Value = req.min_services;
                db.AddParameter(cmd, "max_services", DbTypes.Types.Integer).Value =
                    req.max_services.HasValue ? req.max_services.Value : DBNull.Value;
                db.AddParameter(cmd, "discount_percent", DbTypes.Types.Decimal).Value = req.discount_percent;
                db.AddParameter(cmd, "benefits_json", DbTypes.Types.Json).Value = benefitsJson;
                db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = req.sort_order;
                db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = req.isactive;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
                using DbDataReader reader = await db.Execute(cmd);
                if (await reader.ReadAsync())
                    req.id = Convert.ToInt64(reader["id"]);
            }
            else
            {
                DbCommand cmd = db.GetCommand(@"
                    UPDATE organisation_loyalty_tiers SET
                        name = @name, min_services = @min_services, max_services = @max_services,
                        discount_percent = @discount_percent, benefits_json = @benefits_json::jsonb,
                        sort_order = @sort_order, isactive = @isactive, updated_at = @updated_at
                    WHERE id = @id AND organisation_id = @organisation_id");
                db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
                db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
                db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.name ?? "";
                db.AddParameter(cmd, "min_services", DbTypes.Types.Integer).Value = req.min_services;
                db.AddParameter(cmd, "max_services", DbTypes.Types.Integer).Value =
                    req.max_services.HasValue ? req.max_services.Value : DBNull.Value;
                db.AddParameter(cmd, "discount_percent", DbTypes.Types.Decimal).Value = req.discount_percent;
                db.AddParameter(cmd, "benefits_json", DbTypes.Types.Json).Value = benefitsJson;
                db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = req.sort_order;
                db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = req.isactive;
                db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(cmd);
            }

            return req;
        }

        public async Task DeleteTier(LoyaltyTierDeleteReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            DbCommand cmd = db.GetCommand(@"
                UPDATE organisation_loyalty_tiers SET isactive = false, updated_at = @updated_at
                WHERE id = @id AND organisation_id = @organisation_id");
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        public async Task<List<ClientLoyaltyWallet>> SelectCustomerWallets(LoyaltyCustomerSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var sql = @"
                SELECT w.id, w.organisation_id, w.client_user_id, w.current_points,
                       w.total_points_earned, w.total_points_redeemed, w.completed_services_count,
                       w.total_spend, w.current_tier_id, w.created_at, w.updated_at,
                       u.name AS client_name, u.mobile AS client_mobile,
                       t.name AS tier_name
                FROM client_loyalty_wallet w
                LEFT JOIN users u ON u.id = w.client_user_id
                LEFT JOIN organisation_loyalty_tiers t ON t.id = w.current_tier_id
                WHERE w.organisation_id = @organisation_id";

            if (req.client_user_id > 0) sql += " AND w.client_user_id = @client_user_id";
            if (!string.IsNullOrWhiteSpace(req.search))
                sql += " AND (LOWER(u.name) LIKE @search OR u.mobile LIKE @search_raw)";
            sql += " ORDER BY w.updated_at DESC";
            if (req.limit > 0)
                sql += " LIMIT @limit";

            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            if (req.client_user_id > 0)
                db.AddParameter(cmd, "client_user_id", DbTypes.Types.Long).Value = req.client_user_id;
            if (!string.IsNullOrWhiteSpace(req.search))
            {
                db.AddParameter(cmd, "search", DbTypes.Types.String).Value = $"%{req.search.Trim().ToLowerInvariant()}%";
                db.AddParameter(cmd, "search_raw", DbTypes.Types.String).Value = $"%{req.search.Trim()}%";
            }
            if (req.limit > 0)
                db.AddParameter(cmd, "limit", DbTypes.Types.Integer).Value = req.limit;

            var wallets = new List<ClientLoyaltyWallet>();
            using (DbDataReader reader = await db.Execute(cmd))
            {
                while (await reader.ReadAsync())
                    wallets.Add(MapWallet(reader));
            }

            foreach (var wallet in wallets)
            {
                wallet.recent_transactions = await SelectTransactionsTransaction(db, req.organisation_id, wallet.client_user_id, 10);
                wallet.available_rewards = await SelectRewardGrantsTransaction(db, req.organisation_id, wallet.client_user_id, "available");
            }

            return wallets;
        }

        public async Task<List<LoyaltyPointTransaction>> SelectTransactions(LoyaltyTransactionSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            return await SelectTransactionsTransaction(db, req.organisation_id, req.client_user_id, req.limit);
        }

        public async Task<List<LoyaltyRewardGrant>> SelectRewardGrants(LoyaltyRewardGrantSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            return await SelectRewardGrantsTransaction(db, req.organisation_id, req.client_user_id, req.status);
        }

        public async Task<LoyaltyEvaluationResult> EvaluateServiceCompletion(LoyaltyEvaluateCompletionReq req)
        {
            if (req.is_cancelled || req.is_refunded)
                throw new ArgumentException("Points and rewards are not awarded for cancelled or refunded services.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);

            var settings = await GetOrCreateSettingsTransaction(db, req.organisation_id);
            if (!settings.isactive)
                return new LoyaltyEvaluationResult { message = "Loyalty program is inactive." };

            var wallet = await GetOrCreateWalletTransaction(db, req.organisation_id, req.client_user_id);
            var result = new LoyaltyEvaluationResult();

            // Duplicate prevention for same appointment
            if (req.appointment_id > 0)
            {
                DbCommand dupCmd = db.GetCommand(@"
                    SELECT COUNT(*) FROM loyalty_point_transactions
                    WHERE organisation_id = @org AND reference_type = 'appointment'
                      AND reference_id = @appt AND transaction_type = 'earn'");
                db.AddParameter(dupCmd, "org", DbTypes.Types.Long).Value = req.organisation_id;
                db.AddParameter(dupCmd, "appt", DbTypes.Types.Long).Value = req.appointment_id;
                using DbDataReader dupReader = await db.Execute(dupCmd);
                if (await dupReader.ReadAsync() && Convert.ToInt32(dupReader[0]) > 0)
                    return new LoyaltyEvaluationResult { message = "Reward already processed for this appointment." };
            }

            wallet.completed_services_count += 1;
            wallet.total_spend += req.amount_spent;

            int pointsEarned = settings.points_per_service;
            if (req.amount_spent > 0 && settings.points_per_rupee_spent > 0)
                pointsEarned += (int)Math.Floor(req.amount_spent * settings.points_per_rupee_spent);
            if (settings.max_points_per_transaction > 0)
                pointsEarned = Math.Min(pointsEarned, settings.max_points_per_transaction);

            if (pointsEarned > 0)
            {
                await AddPointsTransaction(db, req.organisation_id, req.client_user_id, pointsEarned, "earn",
                    "appointment", req.appointment_id, $"Points for completed service", 0,
                    settings.points_expiry_days > 0 ? DateTime.UtcNow.AddDays(settings.points_expiry_days) : null);
                result.points_earned = pointsEarned;
            }

            var tiers = await SelectTiersTransaction(db, req.organisation_id);
            var matchedTier = tiers
                .Where(t => wallet.completed_services_count >= t.min_services &&
                            (!t.max_services.HasValue || wallet.completed_services_count <= t.max_services.Value))
                .OrderByDescending(t => t.min_services)
                .FirstOrDefault();
            if (matchedTier != null)
            {
                wallet.current_tier_id = matchedTier.id;
                result.tier_name = matchedTier.name;
            }

            var schemes = await SelectSchemesTransaction(db, req.organisation_id, status: "active");
            foreach (var scheme in schemes)
            {
                if (!IsSchemeEligible(scheme, req.client_user_id, req.service_id))
                    continue;

                foreach (var rule in scheme.rules.Where(r => r.isactive).OrderByDescending(r => r.priority))
                {
                    if (!EvaluateTrigger(rule, wallet, req.amount_spent))
                        continue;

                    if (req.appointment_id > 0 && await HasGrantForAppointment(db, req.organisation_id, req.client_user_id, rule.id, req.appointment_id))
                        continue;

                    var grant = await CreateRewardGrantTransaction(db, req.organisation_id, req.client_user_id,
                        scheme.id, rule, req.appointment_id);
                    result.rewards_granted.Add(grant);

                    if (rule.reward_type == "loyalty_points" && rule.reward_value > 0)
                    {
                        var bonus = (int)rule.reward_value;
                        await AddPointsTransaction(db, req.organisation_id, req.client_user_id, bonus, "bonus",
                            "rule", rule.id, $"Rule bonus: {rule.name}", 0, null);
                        result.points_earned += bonus;
                    }
                }
            }

            await SyncWalletPointsFromDb(db, wallet);
            await UpdateWalletTransaction(db, wallet);

            result.message = result.rewards_granted.Count > 0 || result.points_earned > 0
                ? "Loyalty updated successfully."
                : "No matching loyalty rules.";

            return result;
        }

        public async Task SeedSampleProgram(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchemaTransaction(db);
            await GetOrCreateSettingsTransaction(db, organisationId);

            var settings = new LoyaltySettingsSaveReq
            {
                organisation_id = organisationId,
                points_per_service = 0,
                points_per_rupee_spent = 0.1m,
                redemption_points_per_rupee = 100,
                redemption_rupee_value = 50,
                min_redemption_points = 100,
                points_expiry_days = 365,
                allow_partial_redemption = true,
                isactive = true,
            };
            await SaveSettings(settings);

            var tiers = new[]
            {
                new LoyaltyTierSaveReq { organisation_id = organisationId, name = "Bronze", min_services = 0, max_services = 4, discount_percent = 0, sort_order = 1, benefits = ["Welcome member"] },
                new LoyaltyTierSaveReq { organisation_id = organisationId, name = "Silver", min_services = 5, max_services = 9, discount_percent = 5, sort_order = 2, benefits = ["5% discount"] },
                new LoyaltyTierSaveReq { organisation_id = organisationId, name = "Gold", min_services = 10, max_services = 19, discount_percent = 10, sort_order = 3, benefits = ["10% discount"] },
                new LoyaltyTierSaveReq { organisation_id = organisationId, name = "Platinum", min_services = 20, max_services = null, discount_percent = 20, sort_order = 4, benefits = ["20% discount", "Priority booking"] },
            };
            foreach (var tier in tiers)
                await SaveTier(tier);

            var scheme = await SaveScheme(new LoyaltySchemeSaveReq
            {
                organisation_id = organisationId,
                name = "Service Loyalty Program",
                description = "Earn discounts and free services as you complete bookings.",
                status = "active",
                reward_type = "percentage_discount",
                terms_and_conditions = "Rewards apply to eligible services only. Cannot combine with other offers unless configured.",
                sort_order = 1,
            });

            await SaveRule(new LoyaltyRuleSaveReq
            {
                organisation_id = organisationId,
                scheme_id = scheme.id,
                name = "5 services → 20% off next visit",
                trigger_type = "completed_services",
                trigger_operator = ">=",
                trigger_value = 5,
                reward_type = "percentage_discount",
                reward_value = 20,
                apply_on = "next_service",
                max_discount_amount = 500,
                reward_expiry_days = 30,
                priority = 10,
            });

            await SaveRule(new LoyaltyRuleSaveReq
            {
                organisation_id = organisationId,
                scheme_id = scheme.id,
                name = "10 services → 1 free service",
                trigger_type = "completed_services",
                trigger_operator = ">=",
                trigger_value = 10,
                reward_type = "free_service",
                reward_value = 1,
                apply_on = "next_service",
                reward_expiry_days = 30,
                priority = 20,
            });

            await SaveRule(new LoyaltyRuleSaveReq
            {
                organisation_id = organisationId,
                scheme_id = scheme.id,
                name = "Spend ₹5000 → 500 points",
                trigger_type = "spend_amount",
                trigger_operator = ">=",
                trigger_value = 5000,
                reward_type = "loyalty_points",
                reward_value = 500,
                apply_on = "wallet",
                priority = 5,
            });
        }

        // --- private helpers ---

        async Task<OrganisationLoyaltySettings> GetOrCreateSettingsTransaction(IDb db, long organisationId)
        {
            DbCommand select = db.GetCommand(@"
                SELECT organisation_id, points_per_service, points_per_rupee_spent, bonus_points, referral_points,
                       birthday_bonus_points, anniversary_bonus_points, redemption_points_per_rupee,
                       redemption_rupee_value, min_redemption_points, points_expiry_days, max_points_per_transaction,
                       combine_with_discounts, allow_transfer, allow_partial_redemption, isactive, created_at, updated_at
                FROM organisation_loyalty_settings WHERE organisation_id = @organisation_id LIMIT 1");
            db.AddParameter(select, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using (DbDataReader reader = await db.Execute(select))
            {
                if (await reader.ReadAsync())
                    return MapSettings(reader);
            }

            var now = DateTime.UtcNow;
            DbCommand insert = db.GetCommand(@"
                INSERT INTO organisation_loyalty_settings (organisation_id, created_at, updated_at)
                VALUES (@organisation_id, @created_at, @updated_at)
                ON CONFLICT (organisation_id) DO NOTHING
                RETURNING organisation_id, points_per_service, points_per_rupee_spent, bonus_points, referral_points,
                          birthday_bonus_points, anniversary_bonus_points, redemption_points_per_rupee,
                          redemption_rupee_value, min_redemption_points, points_expiry_days, max_points_per_transaction,
                          combine_with_discounts, allow_transfer, allow_partial_redemption, isactive, created_at, updated_at");
            db.AddParameter(insert, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(insert, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(insert, "updated_at", DbTypes.Types.DateTime).Value = now;
            using (DbDataReader insReader = await db.Execute(insert))
            {
                if (await insReader.ReadAsync())
                    return MapSettings(insReader);
            }

            // Concurrent create won the race — reload existing settings.
            DbCommand reload = db.GetCommand(@"
                SELECT organisation_id, points_per_service, points_per_rupee_spent, bonus_points, referral_points,
                       birthday_bonus_points, anniversary_bonus_points, redemption_points_per_rupee,
                       redemption_rupee_value, min_redemption_points, points_expiry_days, max_points_per_transaction,
                       combine_with_discounts, allow_transfer, allow_partial_redemption, isactive, created_at, updated_at
                FROM organisation_loyalty_settings WHERE organisation_id = @organisation_id LIMIT 1");
            db.AddParameter(reload, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using (DbDataReader reader = await db.Execute(reload))
            {
                if (await reader.ReadAsync())
                    return MapSettings(reader);
            }

            return new OrganisationLoyaltySettings { organisation_id = organisationId };
        }

        async Task<List<LoyaltyRule>> SelectRulesTransaction(IDb db, long organisationId, long schemeId)
        {
            DbCommand cmd = db.GetCommand(@"
                SELECT id, organisation_id, scheme_id, name, trigger_type, trigger_operator, trigger_value,
                       trigger_period_days, reward_type, reward_value, apply_on, max_discount_amount,
                       reward_expiry_days, free_service_id, priority, isactive, created_at, updated_at
                FROM organisation_loyalty_rules
                WHERE organisation_id = @organisation_id AND scheme_id = @scheme_id AND isactive = true
                ORDER BY priority DESC, id");
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "scheme_id", DbTypes.Types.Long).Value = schemeId;
            var rules = new List<LoyaltyRule>();
            using DbDataReader reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
                rules.Add(MapRule(reader));
            return rules;
        }

        async Task<List<LoyaltyScheme>> SelectSchemesTransaction(IDb db, long organisationId, string? status = null)
        {
            var req = new LoyaltySchemeSelectReq { organisation_id = organisationId, status = status };
            // inline to avoid nested connection
            var sql = @"
                SELECT id, organisation_id, name, description, status, start_date, end_date,
                       eligible_customer_ids, eligible_service_ids, min_completed_services,
                       reward_type, reward_value, max_reward_limit, reward_expiry_days,
                       terms_and_conditions, sort_order, isactive, created_at, updated_at
                FROM organisation_loyalty_schemes
                WHERE organisation_id = @organisation_id AND isactive = true";
            if (!string.IsNullOrWhiteSpace(status)) sql += " AND status = @status";
            sql += " ORDER BY sort_order, id";

            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            if (!string.IsNullOrWhiteSpace(status))
                db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status!;
            var schemes = new List<LoyaltyScheme>();
            using (DbDataReader reader = await db.Execute(cmd))
            {
                while (await reader.ReadAsync())
                    schemes.Add(MapScheme(reader));
            }
            foreach (var s in schemes)
                s.rules = await SelectRulesTransaction(db, organisationId, s.id);
            return schemes;
        }

        async Task<List<LoyaltyTier>> SelectTiersTransaction(IDb db, long organisationId)
        {
            return await SelectTiers(new LoyaltyTierSelectReq { organisation_id = organisationId });
        }

        async Task<ClientLoyaltyWallet> GetOrCreateWalletTransaction(IDb db, long organisationId, long clientUserId)
        {
            DbCommand select = db.GetCommand(@"
                SELECT id, organisation_id, client_user_id, current_points, total_points_earned,
                       total_points_redeemed, completed_services_count, total_spend, current_tier_id,
                       created_at, updated_at
                FROM client_loyalty_wallet
                WHERE organisation_id = @organisation_id AND client_user_id = @client_user_id LIMIT 1");
            db.AddParameter(select, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(select, "client_user_id", DbTypes.Types.Long).Value = clientUserId;
            using (DbDataReader reader = await db.Execute(select))
            {
                if (await reader.ReadAsync())
                    return MapWallet(reader);
            }

            var now = DateTime.UtcNow;
            DbCommand insert = db.GetCommand(@"
                INSERT INTO client_loyalty_wallet (organisation_id, client_user_id, created_at, updated_at)
                VALUES (@organisation_id, @client_user_id, @created_at, @updated_at)
                RETURNING id, organisation_id, client_user_id, current_points, total_points_earned,
                          total_points_redeemed, completed_services_count, total_spend, current_tier_id,
                          created_at, updated_at");
            db.AddParameter(insert, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(insert, "client_user_id", DbTypes.Types.Long).Value = clientUserId;
            db.AddParameter(insert, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(insert, "updated_at", DbTypes.Types.DateTime).Value = now;
            using DbDataReader insReader = await db.Execute(insert);
            if (await insReader.ReadAsync())
                return MapWallet(insReader);

            return new ClientLoyaltyWallet { organisation_id = organisationId, client_user_id = clientUserId };
        }

        async Task UpdateWalletTransaction(IDb db, ClientLoyaltyWallet wallet)
        {
            DbCommand cmd = db.GetCommand(@"
                UPDATE client_loyalty_wallet SET
                    current_points = @current_points, total_points_earned = @total_points_earned,
                    total_points_redeemed = @total_points_redeemed,
                    completed_services_count = @completed_services_count, total_spend = @total_spend,
                    current_tier_id = @current_tier_id, updated_at = @updated_at
                WHERE id = @id");
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = wallet.id;
            db.AddParameter(cmd, "current_points", DbTypes.Types.Integer).Value = wallet.current_points;
            db.AddParameter(cmd, "total_points_earned", DbTypes.Types.Integer).Value = wallet.total_points_earned;
            db.AddParameter(cmd, "total_points_redeemed", DbTypes.Types.Integer).Value = wallet.total_points_redeemed;
            db.AddParameter(cmd, "completed_services_count", DbTypes.Types.Integer).Value = wallet.completed_services_count;
            db.AddParameter(cmd, "total_spend", DbTypes.Types.Decimal).Value = wallet.total_spend;
            db.AddParameter(cmd, "current_tier_id", DbTypes.Types.Long).Value =
                wallet.current_tier_id.HasValue ? wallet.current_tier_id.Value : DBNull.Value;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        async Task SyncWalletPointsFromDb(IDb db, ClientLoyaltyWallet wallet)
        {
            var latest = await GetOrCreateWalletTransaction(db, wallet.organisation_id, wallet.client_user_id);
            wallet.id = latest.id;
            wallet.current_points = latest.current_points;
            wallet.total_points_earned = latest.total_points_earned;
            wallet.total_points_redeemed = latest.total_points_redeemed;
        }

        async Task AddPointsTransaction(IDb db, long organisationId, long clientUserId, int delta, string type,
            string refType, long refId, string description, long createdBy, DateTime? expiresAt)
        {
            var wallet = await GetOrCreateWalletTransaction(db, organisationId, clientUserId);
            if (delta < 0 && wallet.current_points + delta < 0)
                throw new ArgumentException("Insufficient loyalty points.");

            wallet.current_points += delta;
            if (delta > 0) wallet.total_points_earned += delta;
            if (delta < 0) wallet.total_points_redeemed += Math.Abs(delta);
            await UpdateWalletTransaction(db, wallet);

            DbCommand cmd = db.GetCommand(@"
                INSERT INTO loyalty_point_transactions (
                    organisation_id, client_user_id, transaction_type, points_delta, balance_after,
                    reference_type, reference_id, description, created_by, expires_at, created_at
                ) VALUES (
                    @organisation_id, @client_user_id, @transaction_type, @points_delta, @balance_after,
                    @reference_type, @reference_id, @description, @created_by, @expires_at, @created_at
                )");
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "client_user_id", DbTypes.Types.Long).Value = clientUserId;
            db.AddParameter(cmd, "transaction_type", DbTypes.Types.String).Value = type;
            db.AddParameter(cmd, "points_delta", DbTypes.Types.Integer).Value = delta;
            db.AddParameter(cmd, "balance_after", DbTypes.Types.Integer).Value = wallet.current_points;
            db.AddParameter(cmd, "reference_type", DbTypes.Types.String).Value = refType;
            db.AddParameter(cmd, "reference_id", DbTypes.Types.Long).Value = refId;
            db.AddParameter(cmd, "description", DbTypes.Types.String).Value = description;
            db.AddParameter(cmd, "created_by", DbTypes.Types.Long).Value = createdBy;
            db.AddParameter(cmd, "expires_at", DbTypes.Types.DateTime).Value =
                expiresAt.HasValue ? expiresAt.Value : DBNull.Value;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        async Task<LoyaltyRewardGrant> CreateRewardGrantTransaction(IDb db, long organisationId, long clientUserId,
            long schemeId, LoyaltyRule rule, long sourceAppointmentId)
        {
            var now = DateTime.UtcNow;
            var expires = rule.reward_expiry_days > 0 ? now.AddDays(rule.reward_expiry_days) : (DateTime?)null;
            var coupon = rule.reward_type == "coupon" ? $"LP-{Guid.NewGuid():N}"[..12].ToUpperInvariant() : "";

            DbCommand cmd = db.GetCommand(@"
                INSERT INTO loyalty_reward_grants (
                    organisation_id, client_user_id, scheme_id, rule_id, reward_type, reward_value,
                    status, apply_on, max_discount_amount, source_appointment_id, coupon_code,
                    granted_at, expires_at, created_at
                ) VALUES (
                    @organisation_id, @client_user_id, @scheme_id, @rule_id, @reward_type, @reward_value,
                    'available', @apply_on, @max_discount_amount, @source_appointment_id, @coupon_code,
                    @granted_at, @expires_at, @created_at
                ) RETURNING id, organisation_id, client_user_id, scheme_id, rule_id, reward_type, reward_value,
                          status, apply_on, max_discount_amount, source_appointment_id, coupon_code,
                          granted_at, expires_at, redeemed_at, redeemed_appointment_id, created_at");

            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "client_user_id", DbTypes.Types.Long).Value = clientUserId;
            db.AddParameter(cmd, "scheme_id", DbTypes.Types.Long).Value = schemeId;
            db.AddParameter(cmd, "rule_id", DbTypes.Types.Long).Value = rule.id;
            db.AddParameter(cmd, "reward_type", DbTypes.Types.String).Value = rule.reward_type;
            db.AddParameter(cmd, "reward_value", DbTypes.Types.Decimal).Value = rule.reward_value;
            db.AddParameter(cmd, "apply_on", DbTypes.Types.String).Value = rule.apply_on;
            db.AddParameter(cmd, "max_discount_amount", DbTypes.Types.Decimal).Value = rule.max_discount_amount;
            db.AddParameter(cmd, "source_appointment_id", DbTypes.Types.Long).Value = sourceAppointmentId;
            db.AddParameter(cmd, "coupon_code", DbTypes.Types.String).Value = coupon;
            db.AddParameter(cmd, "granted_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "expires_at", DbTypes.Types.DateTime).Value =
                expires.HasValue ? expires.Value : DBNull.Value;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;

            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return MapGrant(reader);

            throw new InvalidOperationException("Failed to create reward grant.");
        }

        static async Task<bool> HasGrantForAppointment(IDb db, long organisationId, long clientUserId, long ruleId, long appointmentId)
        {
            DbCommand cmd = db.GetCommand(@"
                SELECT COUNT(*) FROM loyalty_reward_grants
                WHERE organisation_id = @org AND client_user_id = @client AND rule_id = @rule
                  AND source_appointment_id = @appt");
            db.AddParameter(cmd, "org", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "client", DbTypes.Types.Long).Value = clientUserId;
            db.AddParameter(cmd, "rule", DbTypes.Types.Long).Value = ruleId;
            db.AddParameter(cmd, "appt", DbTypes.Types.Long).Value = appointmentId;
            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return Convert.ToInt32(reader[0]) > 0;
            return false;
        }

        async Task<List<LoyaltyPointTransaction>> SelectTransactionsTransaction(IDb db, long organisationId, long clientUserId, int limit)
        {
            DbCommand cmd = db.GetCommand(@"
                SELECT id, organisation_id, client_user_id, transaction_type, points_delta, balance_after,
                       reference_type, reference_id, description, created_by, expires_at, created_at
                FROM loyalty_point_transactions
                WHERE organisation_id = @organisation_id AND client_user_id = @client_user_id
                ORDER BY created_at DESC LIMIT @limit");
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "client_user_id", DbTypes.Types.Long).Value = clientUserId;
            db.AddParameter(cmd, "limit", DbTypes.Types.Integer).Value = limit;
            var list = new List<LoyaltyPointTransaction>();
            using DbDataReader reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
                list.Add(MapTransaction(reader));
            return list;
        }

        async Task<List<LoyaltyRewardGrant>> SelectRewardGrantsTransaction(IDb db, long organisationId, long clientUserId, string? status)
        {
            var sql = @"
                SELECT id, organisation_id, client_user_id, scheme_id, rule_id, reward_type, reward_value,
                       status, apply_on, max_discount_amount, source_appointment_id, coupon_code,
                       granted_at, expires_at, redeemed_at, redeemed_appointment_id, created_at
                FROM loyalty_reward_grants
                WHERE organisation_id = @organisation_id AND client_user_id = @client_user_id";
            if (!string.IsNullOrWhiteSpace(status)) sql += " AND status = @status";
            sql += " ORDER BY granted_at DESC LIMIT 50";

            DbCommand cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(cmd, "client_user_id", DbTypes.Types.Long).Value = clientUserId;
            if (!string.IsNullOrWhiteSpace(status))
                db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status!;
            var list = new List<LoyaltyRewardGrant>();
            using DbDataReader reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
                list.Add(MapGrant(reader));
            return list;
        }

        static bool IsSchemeEligible(LoyaltyScheme scheme, long clientUserId, long serviceId)
        {
            if (scheme.eligible_customer_ids.Count > 0 && !scheme.eligible_customer_ids.Contains(clientUserId))
                return false;
            if (scheme.eligible_service_ids.Count > 0 && serviceId > 0 && !scheme.eligible_service_ids.Contains(serviceId))
                return false;
            if (!string.IsNullOrWhiteSpace(scheme.start_date) && DateOnly.TryParse(scheme.start_date, out var start) && DateOnly.FromDateTime(DateTime.UtcNow) < start)
                return false;
            if (!string.IsNullOrWhiteSpace(scheme.end_date) && DateOnly.TryParse(scheme.end_date, out var end) && DateOnly.FromDateTime(DateTime.UtcNow) > end)
                return false;
            return true;
        }

        static bool EvaluateTrigger(LoyaltyRule rule, ClientLoyaltyWallet wallet, decimal amountSpent)
        {
            decimal actual = rule.trigger_type switch
            {
                "completed_services" => wallet.completed_services_count,
                "spend_amount" => wallet.total_spend,
                "points_earned" => wallet.total_points_earned,
                _ => 0,
            };

            return rule.trigger_operator switch
            {
                ">" => actual > rule.trigger_value,
                ">=" => actual >= rule.trigger_value,
                "=" or "==" => actual == rule.trigger_value,
                "<=" => actual <= rule.trigger_value,
                "<" => actual < rule.trigger_value,
                _ => actual >= rule.trigger_value,
            };
        }

        static void BindSettingsParams(DbCommand cmd, IDb db, OrganisationLoyaltySettings req, DateTime now)
        {
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(cmd, "points_per_service", DbTypes.Types.Integer).Value = req.points_per_service;
            db.AddParameter(cmd, "points_per_rupee_spent", DbTypes.Types.Decimal).Value = req.points_per_rupee_spent;
            db.AddParameter(cmd, "bonus_points", DbTypes.Types.Integer).Value = req.bonus_points;
            db.AddParameter(cmd, "referral_points", DbTypes.Types.Integer).Value = req.referral_points;
            db.AddParameter(cmd, "birthday_bonus_points", DbTypes.Types.Integer).Value = req.birthday_bonus_points;
            db.AddParameter(cmd, "anniversary_bonus_points", DbTypes.Types.Integer).Value = req.anniversary_bonus_points;
            db.AddParameter(cmd, "redemption_points_per_rupee", DbTypes.Types.Integer).Value = req.redemption_points_per_rupee;
            db.AddParameter(cmd, "redemption_rupee_value", DbTypes.Types.Decimal).Value = req.redemption_rupee_value;
            db.AddParameter(cmd, "min_redemption_points", DbTypes.Types.Integer).Value = req.min_redemption_points;
            db.AddParameter(cmd, "points_expiry_days", DbTypes.Types.Integer).Value = req.points_expiry_days;
            db.AddParameter(cmd, "max_points_per_transaction", DbTypes.Types.Integer).Value = req.max_points_per_transaction;
            db.AddParameter(cmd, "combine_with_discounts", DbTypes.Types.Boolean).Value = req.combine_with_discounts;
            db.AddParameter(cmd, "allow_transfer", DbTypes.Types.Boolean).Value = req.allow_transfer;
            db.AddParameter(cmd, "allow_partial_redemption", DbTypes.Types.Boolean).Value = req.allow_partial_redemption;
            db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = req.isactive;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
        }

        static void BindSchemeParams(DbCommand cmd, IDb db, LoyaltyScheme req, DateTime now)
        {
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.name ?? "";
            db.AddParameter(cmd, "description", DbTypes.Types.String).Value = req.description ?? "";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = req.status ?? "inactive";
            db.AddParameter(cmd, "start_date", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.start_date) ? DBNull.Value : req.start_date!;
            db.AddParameter(cmd, "end_date", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(req.end_date) ? DBNull.Value : req.end_date!;
            db.AddParameter(cmd, "eligible_customer_ids", DbTypes.Types.Json).Value =
                JsonSerializer.Serialize(req.eligible_customer_ids ?? [], JsonOpts);
            db.AddParameter(cmd, "eligible_service_ids", DbTypes.Types.Json).Value =
                JsonSerializer.Serialize(req.eligible_service_ids ?? [], JsonOpts);
            db.AddParameter(cmd, "min_completed_services", DbTypes.Types.Integer).Value = req.min_completed_services;
            db.AddParameter(cmd, "reward_type", DbTypes.Types.String).Value = req.reward_type ?? "loyalty_points";
            db.AddParameter(cmd, "reward_value", DbTypes.Types.Decimal).Value = req.reward_value;
            db.AddParameter(cmd, "max_reward_limit", DbTypes.Types.Decimal).Value = req.max_reward_limit;
            db.AddParameter(cmd, "reward_expiry_days", DbTypes.Types.Integer).Value = req.reward_expiry_days;
            db.AddParameter(cmd, "terms_and_conditions", DbTypes.Types.String).Value = req.terms_and_conditions ?? "";
            db.AddParameter(cmd, "sort_order", DbTypes.Types.Integer).Value = req.sort_order;
            db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = req.isactive;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
        }

        static void BindRuleParams(DbCommand cmd, IDb db, LoyaltyRule req, DateTime now)
        {
            db.AddParameter(cmd, "organisation_id", DbTypes.Types.Long).Value = req.organisation_id;
            db.AddParameter(cmd, "scheme_id", DbTypes.Types.Long).Value = req.scheme_id;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.name ?? "";
            db.AddParameter(cmd, "trigger_type", DbTypes.Types.String).Value = req.trigger_type ?? "completed_services";
            db.AddParameter(cmd, "trigger_operator", DbTypes.Types.String).Value = req.trigger_operator ?? ">=";
            db.AddParameter(cmd, "trigger_value", DbTypes.Types.Decimal).Value = req.trigger_value;
            db.AddParameter(cmd, "trigger_period_days", DbTypes.Types.Integer).Value = req.trigger_period_days;
            db.AddParameter(cmd, "reward_type", DbTypes.Types.String).Value = req.reward_type ?? "percentage_discount";
            db.AddParameter(cmd, "reward_value", DbTypes.Types.Decimal).Value = req.reward_value;
            db.AddParameter(cmd, "apply_on", DbTypes.Types.String).Value = req.apply_on ?? "next_service";
            db.AddParameter(cmd, "max_discount_amount", DbTypes.Types.Decimal).Value = req.max_discount_amount;
            db.AddParameter(cmd, "reward_expiry_days", DbTypes.Types.Integer).Value = req.reward_expiry_days;
            db.AddParameter(cmd, "free_service_id", DbTypes.Types.Long).Value = req.free_service_id;
            db.AddParameter(cmd, "priority", DbTypes.Types.Integer).Value = req.priority;
            db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = req.isactive;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
        }

        static List<long> ParseIdList(object? value)
        {
            if (value == null || value == DBNull.Value) return [];
            try
            {
                var json = value.ToString() ?? "[]";
                return JsonSerializer.Deserialize<List<long>>(json, JsonOpts) ?? [];
            }
            catch
            {
                return [];
            }
        }

        static List<string> ParseStringList(object? value)
        {
            if (value == null || value == DBNull.Value) return [];
            try
            {
                return JsonSerializer.Deserialize<List<string>>(value.ToString() ?? "[]", JsonOpts) ?? [];
            }
            catch
            {
                return [];
            }
        }

        static OrganisationLoyaltySettings MapSettings(DbDataReader reader) => new()
        {
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            points_per_service = Convert.ToInt32(reader["points_per_service"]),
            points_per_rupee_spent = Convert.ToDecimal(reader["points_per_rupee_spent"]),
            bonus_points = Convert.ToInt32(reader["bonus_points"]),
            referral_points = Convert.ToInt32(reader["referral_points"]),
            birthday_bonus_points = Convert.ToInt32(reader["birthday_bonus_points"]),
            anniversary_bonus_points = Convert.ToInt32(reader["anniversary_bonus_points"]),
            redemption_points_per_rupee = Convert.ToInt32(reader["redemption_points_per_rupee"]),
            redemption_rupee_value = Convert.ToDecimal(reader["redemption_rupee_value"]),
            min_redemption_points = Convert.ToInt32(reader["min_redemption_points"]),
            points_expiry_days = Convert.ToInt32(reader["points_expiry_days"]),
            max_points_per_transaction = Convert.ToInt32(reader["max_points_per_transaction"]),
            combine_with_discounts = Convert.ToBoolean(reader["combine_with_discounts"]),
            allow_transfer = Convert.ToBoolean(reader["allow_transfer"]),
            allow_partial_redemption = Convert.ToBoolean(reader["allow_partial_redemption"]),
            isactive = Convert.ToBoolean(reader["isactive"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        static LoyaltyScheme MapScheme(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            name = reader["name"]?.ToString() ?? "",
            description = reader["description"]?.ToString() ?? "",
            status = reader["status"]?.ToString() ?? "inactive",
            start_date = reader["start_date"] == DBNull.Value ? null : reader["start_date"]?.ToString(),
            end_date = reader["end_date"] == DBNull.Value ? null : reader["end_date"]?.ToString(),
            eligible_customer_ids = ParseIdList(reader["eligible_customer_ids"]),
            eligible_service_ids = ParseIdList(reader["eligible_service_ids"]),
            min_completed_services = Convert.ToInt32(reader["min_completed_services"]),
            reward_type = reader["reward_type"]?.ToString() ?? "",
            reward_value = Convert.ToDecimal(reader["reward_value"]),
            max_reward_limit = Convert.ToDecimal(reader["max_reward_limit"]),
            reward_expiry_days = Convert.ToInt32(reader["reward_expiry_days"]),
            terms_and_conditions = reader["terms_and_conditions"]?.ToString() ?? "",
            sort_order = Convert.ToInt32(reader["sort_order"]),
            isactive = Convert.ToBoolean(reader["isactive"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        static LoyaltyRule MapRule(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            scheme_id = Convert.ToInt64(reader["scheme_id"]),
            name = reader["name"]?.ToString() ?? "",
            trigger_type = reader["trigger_type"]?.ToString() ?? "",
            trigger_operator = reader["trigger_operator"]?.ToString() ?? ">=",
            trigger_value = Convert.ToDecimal(reader["trigger_value"]),
            trigger_period_days = Convert.ToInt32(reader["trigger_period_days"]),
            reward_type = reader["reward_type"]?.ToString() ?? "",
            reward_value = Convert.ToDecimal(reader["reward_value"]),
            apply_on = reader["apply_on"]?.ToString() ?? "",
            max_discount_amount = Convert.ToDecimal(reader["max_discount_amount"]),
            reward_expiry_days = Convert.ToInt32(reader["reward_expiry_days"]),
            free_service_id = Convert.ToInt64(reader["free_service_id"]),
            priority = Convert.ToInt32(reader["priority"]),
            isactive = Convert.ToBoolean(reader["isactive"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        static LoyaltyTier MapTier(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            name = reader["name"]?.ToString() ?? "",
            min_services = Convert.ToInt32(reader["min_services"]),
            max_services = reader["max_services"] == DBNull.Value ? null : Convert.ToInt32(reader["max_services"]),
            discount_percent = Convert.ToDecimal(reader["discount_percent"]),
            benefits = ParseStringList(reader["benefits_json"]),
            sort_order = Convert.ToInt32(reader["sort_order"]),
            isactive = Convert.ToBoolean(reader["isactive"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
            updated_at = Convert.ToDateTime(reader["updated_at"]),
        };

        static ClientLoyaltyWallet MapWallet(DbDataReader reader)
        {
            var wallet = new ClientLoyaltyWallet
            {
                id = Convert.ToInt64(reader["id"]),
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                client_user_id = Convert.ToInt64(reader["client_user_id"]),
                current_points = Convert.ToInt32(reader["current_points"]),
                total_points_earned = Convert.ToInt32(reader["total_points_earned"]),
                total_points_redeemed = Convert.ToInt32(reader["total_points_redeemed"]),
                completed_services_count = Convert.ToInt32(reader["completed_services_count"]),
                total_spend = Convert.ToDecimal(reader["total_spend"]),
                current_tier_id = reader["current_tier_id"] == DBNull.Value ? null : Convert.ToInt64(reader["current_tier_id"]),
                created_at = Convert.ToDateTime(reader["created_at"]),
                updated_at = Convert.ToDateTime(reader["updated_at"]),
            };
            if (HasColumn(reader, "client_name"))
                wallet.client_name = reader["client_name"] == DBNull.Value ? null : reader["client_name"]?.ToString();
            if (HasColumn(reader, "client_mobile"))
                wallet.client_mobile = reader["client_mobile"] == DBNull.Value ? null : reader["client_mobile"]?.ToString();
            if (HasColumn(reader, "tier_name"))
                wallet.current_tier_name = reader["tier_name"] == DBNull.Value ? null : reader["tier_name"]?.ToString();
            return wallet;
        }

        static LoyaltyPointTransaction MapTransaction(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            client_user_id = Convert.ToInt64(reader["client_user_id"]),
            transaction_type = reader["transaction_type"]?.ToString() ?? "",
            points_delta = Convert.ToInt32(reader["points_delta"]),
            balance_after = Convert.ToInt32(reader["balance_after"]),
            reference_type = reader["reference_type"]?.ToString() ?? "",
            reference_id = Convert.ToInt64(reader["reference_id"]),
            description = reader["description"]?.ToString() ?? "",
            created_by = Convert.ToInt64(reader["created_by"]),
            expires_at = reader["expires_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["expires_at"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
        };

        static LoyaltyRewardGrant MapGrant(DbDataReader reader) => new()
        {
            id = Convert.ToInt64(reader["id"]),
            organisation_id = Convert.ToInt64(reader["organisation_id"]),
            client_user_id = Convert.ToInt64(reader["client_user_id"]),
            scheme_id = reader["scheme_id"] == DBNull.Value ? null : Convert.ToInt64(reader["scheme_id"]),
            rule_id = reader["rule_id"] == DBNull.Value ? null : Convert.ToInt64(reader["rule_id"]),
            reward_type = reader["reward_type"]?.ToString() ?? "",
            reward_value = Convert.ToDecimal(reader["reward_value"]),
            status = reader["status"]?.ToString() ?? "",
            apply_on = reader["apply_on"]?.ToString() ?? "",
            max_discount_amount = Convert.ToDecimal(reader["max_discount_amount"]),
            source_appointment_id = Convert.ToInt64(reader["source_appointment_id"]),
            coupon_code = reader["coupon_code"]?.ToString() ?? "",
            granted_at = Convert.ToDateTime(reader["granted_at"]),
            expires_at = reader["expires_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["expires_at"]),
            redeemed_at = reader["redeemed_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["redeemed_at"]),
            redeemed_appointment_id = Convert.ToInt64(reader["redeemed_appointment_id"]),
            created_at = Convert.ToDateTime(reader["created_at"]),
        };

        static bool HasColumn(DbDataReader reader, string name)
        {
            for (int i = 0; i < reader.FieldCount; i++)
                if (reader.GetName(i).Equals(name, StringComparison.OrdinalIgnoreCase))
                    return true;
            return false;
        }
    }
}
