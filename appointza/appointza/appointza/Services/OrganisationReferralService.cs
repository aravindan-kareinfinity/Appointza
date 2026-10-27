using appointza.Models;
using appointza.Utils;
using System;
using System.Data.Common;
using System.Text;

namespace appointza.Services
{
    public class OrganisationReferralService
    {
        const string CodePrefix = "APZ-";

        readonly IDbProvider dbprovider;
        readonly CreditWalletService creditWalletService;

        public OrganisationReferralService(
            IDbProvider dbprovider,
            CreditWalletService creditWalletService)
        {
            this.dbprovider = dbprovider;
            this.creditWalletService = creditWalletService;
        }

        public async Task<OrganisationReferralInfoRes> GetReferralInfo(long organisationId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await GetReferralInfoTransaction(db, organisationId);
        }

        public async Task<OrganisationReferralInfoRes> GetReferralInfoTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0)
            {
                return new OrganisationReferralInfoRes();
            }

            var code = await EnsureReferralCodeTransaction(db, organisationId);
            int count = await CountSuccessfulReferralsTransaction(db, organisationId);
            bool alreadyApplied = await HasAppliedReferralCodeTransaction(db, organisationId);

            return new OrganisationReferralInfoRes
            {
                referral_code = code,
                successful_referrals = count,
                bonus_credits_per_referral = CreditWalletCatalog.ReferralBonusCredits,
                referral_already_applied = alreadyApplied,
                can_apply_referral_code = !alreadyApplied,
            };
        }

        public async Task<OrganisationReferralApplyRes> ApplyReferralCode(long organisationId, string? referralCode)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await ApplyReferralCodeTransaction(db, organisationId, referralCode);
        }

        public async Task<OrganisationReferralApplyRes> ApplyReferralCodeTransaction(
            IDb db,
            long organisationId,
            string? referralCode)
        {
            if (organisationId <= 0)
            {
                return new OrganisationReferralApplyRes
                {
                    success = false,
                    message = "Organisation is required.",
                };
            }

            if (await HasAppliedReferralCodeTransaction(db, organisationId))
            {
                return new OrganisationReferralApplyRes
                {
                    success = false,
                    message = "You have already applied a referral code.",
                };
            }

            var normalized = NormalizeReferralCode(referralCode);
            if (string.IsNullOrEmpty(normalized))
            {
                return new OrganisationReferralApplyRes
                {
                    success = false,
                    message = "Please enter a referral code.",
                };
            }

            var ownCode = await SelectReferralCodeByOrganisationIdTransaction(db, organisationId);
            if (!string.IsNullOrEmpty(ownCode) &&
                string.Equals(ownCode, normalized, StringComparison.OrdinalIgnoreCase))
            {
                return new OrganisationReferralApplyRes
                {
                    success = false,
                    message = "You cannot use your own referral code.",
                };
            }

            var applied = await TryApplyReferralOnSignupTransaction(db, organisationId, normalized);
            if (!applied)
            {
                return new OrganisationReferralApplyRes
                {
                    success = false,
                    message = "Invalid referral code. Please check and try again.",
                };
            }

            return new OrganisationReferralApplyRes
            {
                success = true,
                message = "Referral code applied successfully. Thank you!",
            };
        }

        async Task<bool> HasAppliedReferralCodeTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT referred_by_organisation_id
                FROM Organisation
                WHERE id = @id AND isactive = TRUE
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return false;
            }

            if (reader["referred_by_organisation_id"] == DBNull.Value)
            {
                return false;
            }

            return Convert.ToInt64(reader["referred_by_organisation_id"]) > 0;
        }

        public async Task<string> EnsureReferralCodeTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0) return "";

            const string select = @"
                SELECT referral_code
                FROM Organisation
                WHERE id = @id AND isactive = TRUE
                LIMIT 1";

            DbCommand selectCmd = db.GetCommand(select);
            db.AddParameter(selectCmd, "id", DbTypes.Types.Long).Value = organisationId;
            using (DbDataReader reader = await db.Execute(selectCmd))
            {
                if (await reader.ReadAsync())
                {
                    var existing = reader["referral_code"] == DBNull.Value ? "" : reader["referral_code"].ToString();
                    if (!string.IsNullOrWhiteSpace(existing))
                    {
                        return existing.Trim().ToUpperInvariant();
                    }
                }
            }

            for (int attempt = 0; attempt < 8; attempt++)
            {
                var candidate = GenerateReferralCode();
                const string update = @"
                    UPDATE Organisation
                    SET referral_code = @referral_code,
                        modifiedon = @modifiedon
                    WHERE id = @id
                      AND isactive = TRUE
                      AND (referral_code IS NULL OR TRIM(referral_code) = '')
                      AND NOT EXISTS (
                          SELECT 1 FROM Organisation o2
                          WHERE o2.referral_code = @referral_code AND o2.id <> @id
                      )";

                DbCommand updateCmd = db.GetCommand(update);
                db.AddParameter(updateCmd, "referral_code", DbTypes.Types.String).Value = candidate;
                db.AddParameter(updateCmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(updateCmd, "id", DbTypes.Types.Long).Value = organisationId;
                int rows = await db.ExecuteNonQuery(updateCmd);
                if (rows > 0)
                {
                    return candidate;
                }

                var raced = await SelectReferralCodeByOrganisationIdTransaction(db, organisationId);
                if (!string.IsNullOrWhiteSpace(raced))
                {
                    return raced;
                }
            }

            return await SelectReferralCodeByOrganisationIdTransaction(db, organisationId);
        }

        public async Task AssignReferralCodeOnInsertTransaction(IDb db, long organisationId)
        {
            if (organisationId <= 0) return;
            await EnsureReferralCodeTransaction(db, organisationId);
        }

        public async Task<bool> TryApplyReferralOnSignupTransaction(
            IDb db,
            long newOrganisationId,
            string? referralCode)
        {
            var normalized = NormalizeReferralCode(referralCode);
            if (string.IsNullOrEmpty(normalized))
            {
                return true;
            }

            if (newOrganisationId <= 0)
            {
                return false;
            }

            long referrerId = await SelectOrganisationIdByReferralCodeTransaction(db, normalized);
            if (referrerId <= 0 || referrerId == newOrganisationId)
            {
                return false;
            }

            const string linkOrg = @"
                UPDATE Organisation
                SET referred_by_organisation_id = @referrer_id,
                    modifiedon = @modifiedon
                WHERE id = @id
                  AND isactive = TRUE
                  AND (referred_by_organisation_id IS NULL OR referred_by_organisation_id = 0)";

            DbCommand linkCmd = db.GetCommand(linkOrg);
            db.AddParameter(linkCmd, "referrer_id", DbTypes.Types.Long).Value = referrerId;
            db.AddParameter(linkCmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(linkCmd, "id", DbTypes.Types.Long).Value = newOrganisationId;
            int linked = await db.ExecuteNonQuery(linkCmd);
            if (linked <= 0)
            {
                return false;
            }

            const string insertReward = @"
                INSERT INTO organisation_referral_rewards (
                    referrer_organisation_id,
                    referred_organisation_id,
                    bonus_credits,
                    created_at
                )
                VALUES (
                    @referrer_organisation_id,
                    @referred_organisation_id,
                    @bonus_credits,
                    @created_at
                )
                ON CONFLICT (referred_organisation_id) DO NOTHING";

            DbCommand rewardCmd = db.GetCommand(insertReward);
            db.AddParameter(rewardCmd, "referrer_organisation_id", DbTypes.Types.Long).Value = referrerId;
            db.AddParameter(rewardCmd, "referred_organisation_id", DbTypes.Types.Long).Value = newOrganisationId;
            db.AddParameter(rewardCmd, "bonus_credits", DbTypes.Types.Integer).Value = CreditWalletCatalog.ReferralBonusCredits;
            db.AddParameter(rewardCmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            int rewardRows = await db.ExecuteNonQuery(rewardCmd);
            if (rewardRows <= 0)
            {
                return false;
            }

            await creditWalletService.GrantReferralBonusTransaction(
                db,
                referrerId,
                newOrganisationId,
                CreditWalletCatalog.ReferralBonusCredits);

            return true;
        }

        static string GenerateReferralCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var bytes = Guid.NewGuid().ToByteArray();
            var sb = new StringBuilder(CodePrefix, CodePrefix.Length + 8);
            for (int i = 0; i < 8; i++)
            {
                sb.Append(chars[bytes[i] % chars.Length]);
            }
            return sb.ToString();
        }

        public async Task<OrganisationReferralVerifyRes> VerifyReferralCode(string? referralCode)
        {
            var normalized = NormalizeReferralCode(referralCode);
            if (string.IsNullOrEmpty(normalized))
            {
                return new OrganisationReferralVerifyRes
                {
                    valid = false,
                    message = "Please enter a referral code.",
                };
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            long referrerId = await SelectOrganisationIdByReferralCodeTransaction(db, normalized);
            if (referrerId <= 0)
            {
                return new OrganisationReferralVerifyRes
                {
                    valid = false,
                    message = "Invalid referral code.",
                    normalized_code = normalized,
                };
            }

            return new OrganisationReferralVerifyRes
            {
                valid = true,
                message = "Referral code is valid.",
                normalized_code = normalized,
            };
        }

        static string NormalizeReferralCode(string? code) =>
            string.IsNullOrWhiteSpace(code) ? "" : code.Trim().ToUpperInvariant();

        async Task<string> SelectReferralCodeByOrganisationIdTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT referral_code
                FROM Organisation
                WHERE id = @id
                LIMIT 1";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return "";
            }

            return reader["referral_code"] == DBNull.Value
                ? ""
                : reader["referral_code"].ToString()?.Trim().ToUpperInvariant() ?? "";
        }

        async Task<long> SelectOrganisationIdByReferralCodeTransaction(IDb db, string referralCode)
        {
            const string query = @"
                SELECT id
                FROM Organisation
                WHERE UPPER(TRIM(referral_code)) = @referral_code
                  AND isactive = TRUE
                LIMIT 1";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "referral_code", DbTypes.Types.String).Value = referralCode;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return 0;
            }

            return reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
        }

        async Task<int> CountSuccessfulReferralsTransaction(IDb db, long referrerOrganisationId)
        {
            const string query = @"
                SELECT COUNT(*) AS cnt
                FROM organisation_referral_rewards
                WHERE referrer_organisation_id = @referrer_organisation_id";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "referrer_organisation_id", DbTypes.Types.Long).Value = referrerOrganisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return 0;
            }

            return reader["cnt"] == DBNull.Value ? 0 : Convert.ToInt32(reader["cnt"]);
        }
    }
}
