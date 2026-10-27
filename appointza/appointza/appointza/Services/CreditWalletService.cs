using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class CreditWalletService
    {
        readonly IDbProvider dbprovider;
        readonly SubscriptionPlanService subscriptionPlanService;

        public CreditWalletService(IDbProvider dbprovider, SubscriptionPlanService subscriptionPlanService)
        {
            this.dbprovider = dbprovider;
            this.subscriptionPlanService = subscriptionPlanService;
        }

        public async Task EnsureSchemaTransaction(IDb db)
        {
            string[] statements =
            [
                """
                CREATE TABLE IF NOT EXISTS organisation_credit_wallet (
                    organisation_id BIGINT PRIMARY KEY,
                    billing_mode VARCHAR(20) NOT NULL DEFAULT 'subscription',
                    wallet_credit_balance INT NOT NULL DEFAULT 0,
                    wallet_free_used_month INT NOT NULL DEFAULT 0,
                    wallet_free_month_key VARCHAR(7) NOT NULL DEFAULT '',
                    credits_per_booking INT NOT NULL DEFAULT 1,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS credit_wallet_transactions (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    type VARCHAR(30) NOT NULL DEFAULT 'wallet_deduction',
                    amount INT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    appointment_id BIGINT,
                    event_booking_id BIGINT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_credit_wallet_tx_org ON credit_wallet_transactions (organisation_id)",
                """
                CREATE TABLE IF NOT EXISTS credit_wallet_recharge_payments (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    pack_id VARCHAR(32) NOT NULL,
                    credits INT NOT NULL DEFAULT 0,
                    amount_inr DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    razorpay_order_id VARCHAR(128),
                    razorpay_payment_id VARCHAR(128),
                    razorpay_signature VARCHAR(256),
                    receipt VARCHAR(64),
                    status VARCHAR(32) NOT NULL DEFAULT 'created',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP
                )
                """,
            ];

            foreach (var sql in statements)
            {
                try
                {
                    DbCommand cmd = db.GetCommand(sql);
                    await db.ExecuteNonQuery(cmd);
                }
                catch
                {
                    // Table may not exist on very old installs; subscription_tables.sql is authoritative.
                }
            }
        }

        public async Task<OrganisationCreditWallet> GetOrCreateTransaction(IDb db, long organisationId)
        {
            await EnsureSchemaTransaction(db);

            const string select = @"
                SELECT organisation_id, billing_mode, wallet_credit_balance,
                       wallet_free_used_month, wallet_free_month_key, credits_per_booking,
                       created_at, updated_at
                FROM organisation_credit_wallet
                WHERE organisation_id = @organisation_id
                LIMIT 1";

            DbCommand command = db.GetCommand(select);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            OrganisationCreditWallet? wallet = null;
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    wallet = MapWallet(reader);
                }
            }

            if (wallet != null)
            {
                await EnsureSignupGrantIfNeededTransaction(db, wallet);
                return wallet;
            }

            var now = DateTime.UtcNow;
            var signupCredits = CreditWalletCatalog.SignupFreeCredits;
            // ON CONFLICT: concurrent GetWalletStatus calls must not race on PK insert.
            const string insert = @"
                INSERT INTO organisation_credit_wallet (
                    organisation_id, billing_mode, wallet_credit_balance,
                    wallet_free_used_month, wallet_free_month_key, credits_per_booking,
                    created_at, updated_at
                )
                VALUES (
                    @organisation_id, @billing_mode, @wallet_credit_balance, 0, '', 1,
                    @created_at, @updated_at
                )
                ON CONFLICT (organisation_id) DO NOTHING
                RETURNING organisation_id, billing_mode, wallet_credit_balance,
                          wallet_free_used_month, wallet_free_month_key, credits_per_booking,
                          created_at, updated_at";

            DbCommand insertCmd = db.GetCommand(insert);
            db.AddParameter(insertCmd, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(insertCmd, "billing_mode", DbTypes.Types.String).Value = BillingModeCodes.CreditWallet;
            db.AddParameter(insertCmd, "wallet_credit_balance", DbTypes.Types.Integer).Value = signupCredits;
            db.AddParameter(insertCmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(insertCmd, "updated_at", DbTypes.Types.DateTime).Value = now;

            bool created = false;
            // Dispose the reader before any further commands on this connection (Npgsql).
            using (DbDataReader inserted = await db.Execute(insertCmd))
            {
                if (await inserted.ReadAsync())
                {
                    wallet = MapWallet(inserted);
                    created = true;
                }
            }

            if (created && wallet != null)
            {
                await InsertTransactionTransaction(
                    db,
                    organisationId,
                    "wallet_signup_grant",
                    signupCredits,
                    $"Signup bonus — {signupCredits} free booking credits");
                return wallet;
            }

            // Lost the insert race — load the row another request created.
            DbCommand reload = db.GetCommand(select);
            db.AddParameter(reload, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using (DbDataReader reader = await db.Execute(reload))
            {
                if (await reader.ReadAsync())
                {
                    wallet = MapWallet(reader);
                }
            }

            if (wallet != null)
            {
                await EnsureSignupGrantIfNeededTransaction(db, wallet);
                return wallet;
            }

            return new OrganisationCreditWallet
            {
                organisation_id = organisationId,
                billing_mode = BillingModeCodes.CreditWallet,
                wallet_credit_balance = signupCredits,
                created_at = now,
                updated_at = now,
            };
        }

        public async Task<CreditWalletStatusRes> GetStatus(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await GetStatusTransaction(db, organisationId);
        }

        public async Task<CreditWalletStatusRes> GetStatusTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0)
            {
                throw new ArgumentException("organisation_id is required", nameof(organisationId));
            }

            var wallet = await GetOrCreateTransaction(db, organisationId);
            var transactions = await SelectRecentTransactionsTransaction(db, organisationId, 12);
            var packs = await subscriptionPlanService.SelectCreditWalletPacksTransaction(db);
            var freePlan = await subscriptionPlanService.GetByCodeTransaction(db, SubscriptionPlanCodes.Free);
            var signupCredits = freePlan?.free_bookings_per_month > 0
                ? freePlan.free_bookings_per_month
                : CreditWalletCatalog.SignupFreeCredits;

            return new CreditWalletStatusRes
            {
                organisation_id = organisationId,
                billing_mode = wallet.billing_mode,
                wallet_credit_balance = wallet.wallet_credit_balance,
                signup_free_credits = signupCredits,
                credits_per_booking = wallet.credits_per_booking,
                packs = packs,
                recent_transactions = transactions,
            };
        }

        public async Task<CreditWalletStatusRes> SetBillingMode(long organisationId, string mode)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SetBillingModeTransaction(db, organisationId, mode);
        }

        public async Task<CreditWalletStatusRes> SetBillingModeTransaction(
            IDb db,
            long organisationId,
            string mode)
        {
            var normalized = BillingModeCodes.Normalize(mode);
            var wallet = await GetOrCreateTransaction(db, organisationId);
            if (wallet.billing_mode == normalized)
            {
                return await GetStatusTransaction(db, organisationId);
            }

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_credit_wallet
                SET billing_mode = @billing_mode, updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "billing_mode", DbTypes.Types.String).Value = normalized;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            await db.ExecuteNonQuery(command);

            await InsertTransactionTransaction(
                db,
                organisationId,
                "billing_mode",
                0,
                normalized == BillingModeCodes.CreditWallet
                    ? "Switched to Credit Wallet billing"
                    : "Switched to subscription billing");

            return await GetStatusTransaction(db, organisationId);
        }

        public async Task<CreditWalletStatusRes> Recharge(long organisationId, string packId)
        {
            throw new InvalidOperationException(
                "Direct wallet recharge is disabled. Create a Razorpay order via CreateWalletRechargeOrder and verify payment.");
        }

        public async Task GrantReferralBonusTransaction(
            IDb db,
            long referrerOrganisationId,
            long referredOrganisationId,
            int credits)
        {
            if (referrerOrganisationId <= 0 || credits <= 0)
            {
                return;
            }

            await GetOrCreateTransaction(db, referrerOrganisationId);

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_credit_wallet
                SET wallet_credit_balance = wallet_credit_balance + @credits,
                    updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "credits", DbTypes.Types.Integer).Value = credits;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = referrerOrganisationId;
            await db.ExecuteNonQuery(command);

            await InsertTransactionTransaction(
                db,
                referrerOrganisationId,
                "wallet_referral_bonus",
                credits,
                $"Referral reward — {credits} free booking credits (org #{referredOrganisationId} signed up)");
        }

        public async Task<CreditWalletStatusRes> ApplyRechargeAfterPaymentTransaction(
            IDb db,
            long organisationId,
            string packId,
            int credits,
            decimal amountInr)
        {
            await GetOrCreateTransaction(db, organisationId);

            var pack = await subscriptionPlanService.GetCreditWalletPackByCodeTransaction(db, packId)
                ?? throw new ArgumentException("Unknown credit pack.");
            if (pack.credits != credits)
            {
                credits = pack.credits;
            }

            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_credit_wallet
                SET wallet_credit_balance = wallet_credit_balance + @credits,
                    updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "credits", DbTypes.Types.Integer).Value = credits;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            await db.ExecuteNonQuery(command);

            var priceLabel = amountInr > 0 ? $"₹{amountInr:N0}" : pack.price_label;
            await InsertTransactionTransaction(
                db,
                organisationId,
                "wallet_recharge",
                credits,
                $"Wallet recharge — {priceLabel} → {credits} booking credits (Razorpay verified)");

            return await GetStatusTransaction(db, organisationId);
        }

        public async Task<CreditWalletConsumptionResult> ConsumeForBookingTransaction(
            IDb db,
            long organisationId,
            long? appointmentId = null,
            long? eventBookingId = null)
        {
            if (organisationId <= 0)
            {
                throw new ArgumentException("organisation_id is required", nameof(organisationId));
            }

            if (await BookingCreditAlreadyChargedTransaction(db, appointmentId, eventBookingId))
            {
                return new CreditWalletConsumptionResult
                {
                    success = true,
                    message = "Booking credit already deducted.",
                };
            }

            var wallet = await GetOrCreateTransaction(db, organisationId);
            var cost = Math.Max(1, wallet.credits_per_booking);
            var bookingRef = appointmentId.HasValue && appointmentId.Value > 0
                ? $"appointment #{appointmentId}"
                : eventBookingId.HasValue && eventBookingId.Value > 0
                    ? $"event booking #{eventBookingId}"
                    : "booking";

            if (wallet.wallet_credit_balance >= cost)
            {
                var now = DateTime.UtcNow;
                const string deduct = @"
                    UPDATE organisation_credit_wallet
                    SET wallet_credit_balance = wallet_credit_balance - @cost,
                        updated_at = @updated_at
                    WHERE organisation_id = @organisation_id";

                DbCommand command = db.GetCommand(deduct);
                db.AddParameter(command, "cost", DbTypes.Types.Integer).Value = cost;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
                await db.ExecuteNonQuery(command);

                await InsertTransactionTransaction(
                    db,
                    organisationId,
                    "wallet_deduction",
                    -cost,
                    $"Booking credit used — {bookingRef}",
                    appointmentId,
                    eventBookingId);

                wallet.wallet_credit_balance -= cost;
                return new CreditWalletConsumptionResult
                {
                    success = true,
                    credits_consumed = cost,
                    message = $"{cost} booking credit(s) deducted. Balance: {wallet.wallet_credit_balance}.",
                };
            }

            throw new InvalidOperationException(
                "Insufficient booking credits. Recharge your wallet to continue taking bookings.");
        }

        async Task EnsureSignupGrantIfNeededTransaction(IDb db, OrganisationCreditWallet wallet)
        {
            if (await HasSignupGrantTransaction(db, wallet.organisation_id))
            {
                return;
            }

            var credits = CreditWalletCatalog.SignupFreeCredits;
            var now = DateTime.UtcNow;
            const string update = @"
                UPDATE organisation_credit_wallet
                SET wallet_credit_balance = wallet_credit_balance + @credits,
                    billing_mode = @billing_mode,
                    updated_at = @updated_at
                WHERE organisation_id = @organisation_id";

            DbCommand command = db.GetCommand(update);
            db.AddParameter(command, "credits", DbTypes.Types.Integer).Value = credits;
            db.AddParameter(command, "billing_mode", DbTypes.Types.String).Value = BillingModeCodes.CreditWallet;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = wallet.organisation_id;
            await db.ExecuteNonQuery(command);

            await InsertTransactionTransaction(
                db,
                wallet.organisation_id,
                "wallet_signup_grant",
                credits,
                $"Signup bonus — {credits} free booking credits");

            wallet.wallet_credit_balance += credits;
            wallet.billing_mode = BillingModeCodes.CreditWallet;
            wallet.updated_at = now;
        }

        async Task<bool> HasSignupGrantTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT 1
                FROM credit_wallet_transactions
                WHERE organisation_id = @organisation_id
                  AND type = 'wallet_signup_grant'
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            return await reader.ReadAsync();
        }

        async Task<bool> BookingCreditAlreadyChargedTransaction(
            IDb db,
            long? appointmentId,
            long? eventBookingId)
        {
            if (appointmentId.HasValue && appointmentId.Value > 0)
            {
                const string byAppointment = @"
                    SELECT 1
                    FROM credit_wallet_transactions
                    WHERE appointment_id = @appointment_id
                      AND type IN ('wallet_deduction', 'wallet_free')
                    LIMIT 1";

                DbCommand command = db.GetCommand(byAppointment);
                db.AddParameter(command, "appointment_id", DbTypes.Types.Long).Value = appointmentId.Value;
                using DbDataReader reader = await db.Execute(command);
                if (await reader.ReadAsync())
                {
                    return true;
                }
            }

            if (eventBookingId.HasValue && eventBookingId.Value > 0)
            {
                const string byEventBooking = @"
                    SELECT 1
                    FROM credit_wallet_transactions
                    WHERE event_booking_id = @event_booking_id
                      AND type IN ('wallet_deduction', 'wallet_free')
                    LIMIT 1";

                DbCommand command = db.GetCommand(byEventBooking);
                db.AddParameter(command, "event_booking_id", DbTypes.Types.Long).Value = eventBookingId.Value;
                using DbDataReader reader = await db.Execute(command);
                if (await reader.ReadAsync())
                {
                    return true;
                }
            }

            return false;
        }

        public async Task ApplyWalletFieldsTransaction(
            IDb db,
            OrganisationSubscriptionStatusRes status,
            long organisationId)
        {
            var walletStatus = await GetStatusTransaction(db, organisationId);
            status.billing_mode = walletStatus.billing_mode;
            status.wallet_credit_balance = walletStatus.wallet_credit_balance;
            status.credits_per_booking = walletStatus.credits_per_booking;
        }

        async Task<List<CreditWalletTransaction>> SelectRecentTransactionsTransaction(
            IDb db,
            long organisationId,
            int limit)
        {
            const string query = @"
                SELECT id, organisation_id, type, amount, description,
                       appointment_id, event_booking_id, created_at
                FROM credit_wallet_transactions
                WHERE organisation_id = @organisation_id
                ORDER BY created_at DESC, id DESC
                LIMIT @limit";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = limit;

            var list = new List<CreditWalletTransaction>();
            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(new CreditWalletTransaction
                {
                    id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]),
                    organisation_id = reader["organisation_id"] == DBNull.Value
                        ? 0
                        : Convert.ToInt64(reader["organisation_id"]),
                    type = reader["type"]?.ToString() ?? "",
                    amount = reader["amount"] == DBNull.Value ? 0 : Convert.ToInt32(reader["amount"]),
                    description = reader["description"]?.ToString() ?? "",
                    appointment_id = reader["appointment_id"] == DBNull.Value
                        ? null
                        : Convert.ToInt64(reader["appointment_id"]),
                    event_booking_id = reader["event_booking_id"] == DBNull.Value
                        ? null
                        : Convert.ToInt64(reader["event_booking_id"]),
                    created_at = reader["created_at"] == DBNull.Value
                        ? DateTime.UtcNow
                        : Convert.ToDateTime(reader["created_at"]),
                });
            }

            return list;
        }

        async Task InsertTransactionTransaction(
            IDb db,
            long organisationId,
            string type,
            int amount,
            string description,
            long? appointmentId = null,
            long? eventBookingId = null)
        {
            const string insert = @"
                INSERT INTO credit_wallet_transactions (
                    organisation_id, type, amount, description,
                    appointment_id, event_booking_id, created_at
                )
                VALUES (
                    @organisation_id, @type, @amount, @description,
                    @appointment_id, @event_booking_id, @created_at
                )";

            DbCommand command = db.GetCommand(insert);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "type", DbTypes.Types.String).Value = type;
            db.AddParameter(command, "amount", DbTypes.Types.Integer).Value = amount;
            db.AddParameter(command, "description", DbTypes.Types.String).Value = description;
            db.AddParameter(command, "appointment_id", DbTypes.Types.Long).Value =
                appointmentId.HasValue && appointmentId.Value > 0 ? appointmentId.Value : DBNull.Value;
            db.AddParameter(command, "event_booking_id", DbTypes.Types.Long).Value =
                eventBookingId.HasValue && eventBookingId.Value > 0 ? eventBookingId.Value : DBNull.Value;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        static OrganisationCreditWallet MapWallet(DbDataReader reader) =>
            new()
            {
                organisation_id = reader["organisation_id"] == DBNull.Value
                    ? 0
                    : Convert.ToInt64(reader["organisation_id"]),
                billing_mode = reader["billing_mode"]?.ToString() ?? BillingModeCodes.Subscription,
                wallet_credit_balance = reader["wallet_credit_balance"] == DBNull.Value
                    ? 0
                    : Convert.ToInt32(reader["wallet_credit_balance"]),
                wallet_free_used_month = reader["wallet_free_used_month"] == DBNull.Value
                    ? 0
                    : Convert.ToInt32(reader["wallet_free_used_month"]),
                wallet_free_month_key = reader["wallet_free_month_key"]?.ToString() ?? "",
                credits_per_booking = reader["credits_per_booking"] == DBNull.Value
                    ? 1
                    : Convert.ToInt32(reader["credits_per_booking"]),
                created_at = reader["created_at"] == DBNull.Value
                    ? DateTime.UtcNow
                    : Convert.ToDateTime(reader["created_at"]),
                updated_at = reader["updated_at"] == DBNull.Value
                    ? DateTime.UtcNow
                    : Convert.ToDateTime(reader["updated_at"]),
            };
    }
}
