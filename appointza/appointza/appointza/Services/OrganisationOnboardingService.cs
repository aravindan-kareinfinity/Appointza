using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Text.Json;

namespace appointza.Services
{
    public class OrganisationOnboardingService
    {
        static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        readonly IDbProvider dbprovider;
        readonly OrganisationServicesService organisationServicesService;
        readonly OrganisationServiceTimingService organisationServiceTimingService;

        public OrganisationOnboardingService(
            IDbProvider dbprovider,
            OrganisationServicesService organisationServicesService,
            OrganisationServiceTimingService organisationServiceTimingService)
        {
            this.dbprovider = dbprovider;
            this.organisationServicesService = organisationServicesService;
            this.organisationServiceTimingService = organisationServiceTimingService;
        }

        public async Task<OrganisationOnboardingState> GetStatus(long organisationId)
        {
            if (organisationId <= 0)
            {
                return new OrganisationOnboardingState();
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureTableTransaction(db);

            var state = await SelectOrCreateTransaction(db, organisationId);
            await EnrichDerivedTransaction(db, state);
            SyncConfiguredFromDerived(state);
            state.next_create_offering = ResolveNextCreateOffering(state);
            state.notes = BuildNotes(state);

            if (!state.is_complete)
            {
                var advanced = AdvanceStep(state);
                if (advanced)
                {
                    await UpsertTransaction(db, state);
                }
            }

            return state;
        }

        public async Task<OrganisationOnboardingState> Save(
            long organisationId,
            OrganisationOnboardingSaveReq req)
        {
            if (organisationId <= 0)
            {
                throw new InvalidOperationException("Organisation is required.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureTableTransaction(db);

            var state = await SelectOrCreateTransaction(db, organisationId);

            if (req.selected_offerings != null)
            {
                state.selected_offerings = NormalizeOfferings(req.selected_offerings);
                await PersistCatalogOfferingsTransaction(db, organisationId, state.selected_offerings);
            }

            if (req.configured_offerings != null)
            {
                state.configured_offerings = NormalizeOfferings(req.configured_offerings);
            }

            if (req.skipped_offerings != null)
            {
                state.skipped_offerings = NormalizeOfferings(req.skipped_offerings);
            }

            if (req.profile_complete.HasValue) state.profile_complete = req.profile_complete.Value;
            if (req.location_complete.HasValue) state.location_complete = req.location_complete.Value;
            if (req.website_skipped.HasValue) state.website_skipped = req.website_skipped.Value;

            if (!string.IsNullOrWhiteSpace(req.current_step))
            {
                state.current_step = req.current_step.Trim().ToLowerInvariant();
            }

            if (req.is_complete == true)
            {
                state.is_complete = true;
                state.completed_at = DateTime.UtcNow;
                state.current_step = OnboardingStepKeys.Complete;
            }

            await EnrichDerivedTransaction(db, state);
            SyncConfiguredFromDerived(state);
            AdvanceStep(state);
            state.next_create_offering = ResolveNextCreateOffering(state);
            state.notes = BuildNotes(state);

            await UpsertTransaction(db, state);
            return state;
        }

        public async Task<OrganisationOnboardingState> MarkOffering(
            long organisationId,
            OrganisationOnboardingMarkOfferingReq req)
        {
            if (organisationId <= 0)
            {
                throw new InvalidOperationException("Organisation is required.");
            }

            var offering = (req.offering ?? "").Trim().ToLowerInvariant();
            if (!OnboardingOfferingKeys.All.Contains(offering))
            {
                throw new InvalidOperationException("Unknown offering type.");
            }

            var action = (req.action ?? "configured").Trim().ToLowerInvariant();
            if (action != "configured" && action != "skipped")
            {
                throw new InvalidOperationException("action must be configured or skipped.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureTableTransaction(db);

            var state = await SelectOrCreateTransaction(db, organisationId);
            if (!state.selected_offerings.Contains(offering, StringComparer.OrdinalIgnoreCase))
            {
                state.selected_offerings.Add(offering);
            }

            if (action == "configured")
            {
                AddUnique(state.configured_offerings, offering);
                state.skipped_offerings.RemoveAll(x =>
                    string.Equals(x, offering, StringComparison.OrdinalIgnoreCase));
            }
            else
            {
                AddUnique(state.skipped_offerings, offering);
            }

            await EnrichDerivedTransaction(db, state);
            SyncConfiguredFromDerived(state);
            AdvanceStep(state);
            state.next_create_offering = ResolveNextCreateOffering(state);
            state.notes = BuildNotes(state);
            await UpsertTransaction(db, state);
            return state;
        }

        async Task EnsureTableTransaction(IDb db)
        {
            const string ddl = @"
                CREATE TABLE IF NOT EXISTS organisation_onboarding (
                    organisation_id BIGINT PRIMARY KEY,
                    current_step VARCHAR(64) NOT NULL DEFAULT 'offerings',
                    selected_offerings JSONB NOT NULL DEFAULT '[]'::jsonb,
                    configured_offerings JSONB NOT NULL DEFAULT '[]'::jsonb,
                    skipped_offerings JSONB NOT NULL DEFAULT '[]'::jsonb,
                    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
                    location_complete BOOLEAN NOT NULL DEFAULT FALSE,
                    website_skipped BOOLEAN NOT NULL DEFAULT FALSE,
                    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
                    completed_at TIMESTAMP NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                )";
            await db.ExecuteNonQuery(db.GetCommand(ddl));
        }

        async Task<OrganisationOnboardingState> SelectOrCreateTransaction(IDb db, long organisationId)
        {
            var existing = await SelectTransaction(db, organisationId);
            if (existing != null) return existing;

            var created = new OrganisationOnboardingState
            {
                organisation_id = organisationId,
                current_step = OnboardingStepKeys.Offerings,
                profile_complete = true,
                location_complete = await HasLocationTransaction(db, organisationId),
            };

            // Seed selections from Organisation.attributes.catalog_offerings when present.
            created.selected_offerings = await ReadCatalogOfferingsTransaction(db, organisationId);
            await UpsertTransaction(db, created);
            return created;
        }

        async Task<OrganisationOnboardingState?> SelectTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT organisation_id, current_step, selected_offerings, configured_offerings,
                       skipped_offerings, profile_complete, location_complete, website_skipped,
                       is_complete, completed_at
                FROM organisation_onboarding
                WHERE organisation_id = @organisation_id
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new OrganisationOnboardingState
            {
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                current_step = reader["current_step"]?.ToString() ?? OnboardingStepKeys.Offerings,
                selected_offerings = ReadStringArray(reader["selected_offerings"]),
                configured_offerings = ReadStringArray(reader["configured_offerings"]),
                skipped_offerings = ReadStringArray(reader["skipped_offerings"]),
                profile_complete = reader["profile_complete"] != DBNull.Value && Convert.ToBoolean(reader["profile_complete"]),
                location_complete = reader["location_complete"] != DBNull.Value && Convert.ToBoolean(reader["location_complete"]),
                website_skipped = reader["website_skipped"] != DBNull.Value && Convert.ToBoolean(reader["website_skipped"]),
                is_complete = reader["is_complete"] != DBNull.Value && Convert.ToBoolean(reader["is_complete"]),
                completed_at = reader["completed_at"] == DBNull.Value
                    ? null
                    : Convert.ToDateTime(reader["completed_at"]),
            };
        }

        async Task UpsertTransaction(IDb db, OrganisationOnboardingState state)
        {
            const string upsert = @"
                INSERT INTO organisation_onboarding (
                    organisation_id, current_step, selected_offerings, configured_offerings,
                    skipped_offerings, profile_complete, location_complete, website_skipped,
                    is_complete, completed_at, created_at, updated_at
                ) VALUES (
                    @organisation_id, @current_step, @selected_offerings::jsonb, @configured_offerings::jsonb,
                    @skipped_offerings::jsonb, @profile_complete, @location_complete, @website_skipped,
                    @is_complete, @completed_at, @now, @now
                )
                ON CONFLICT (organisation_id) DO UPDATE SET
                    current_step = EXCLUDED.current_step,
                    selected_offerings = EXCLUDED.selected_offerings,
                    configured_offerings = EXCLUDED.configured_offerings,
                    skipped_offerings = EXCLUDED.skipped_offerings,
                    profile_complete = EXCLUDED.profile_complete,
                    location_complete = EXCLUDED.location_complete,
                    website_skipped = EXCLUDED.website_skipped,
                    is_complete = EXCLUDED.is_complete,
                    completed_at = EXCLUDED.completed_at,
                    updated_at = EXCLUDED.updated_at";

            DbCommand command = db.GetCommand(upsert);
            var now = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = state.organisation_id;
            db.AddParameter(command, "current_step", DbTypes.Types.String).Value = state.current_step ?? OnboardingStepKeys.Offerings;
            db.AddParameter(command, "selected_offerings", DbTypes.Types.String).Value = JsonSerializer.Serialize(state.selected_offerings ?? new List<string>());
            db.AddParameter(command, "configured_offerings", DbTypes.Types.String).Value = JsonSerializer.Serialize(state.configured_offerings ?? new List<string>());
            db.AddParameter(command, "skipped_offerings", DbTypes.Types.String).Value = JsonSerializer.Serialize(state.skipped_offerings ?? new List<string>());
            db.AddParameter(command, "profile_complete", DbTypes.Types.Boolean).Value = state.profile_complete;
            db.AddParameter(command, "location_complete", DbTypes.Types.Boolean).Value = state.location_complete;
            db.AddParameter(command, "website_skipped", DbTypes.Types.Boolean).Value = state.website_skipped;
            db.AddParameter(command, "is_complete", DbTypes.Types.Boolean).Value = state.is_complete;
            var completedParam = db.AddParameter(command, "completed_at", DbTypes.Types.DateTime);
            completedParam.Value = state.completed_at.HasValue ? state.completed_at.Value : DBNull.Value;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(command);
        }

        async Task EnrichDerivedTransaction(IDb db, OrganisationOnboardingState state)
        {
            var d = new OrganisationOnboardingDerived();
            long orgId = state.organisation_id;

            const string locQuery = @"
                SELECT id, customurl, templateid, facility_list
                FROM OrganisationLocation
                WHERE organisationid = @organisationid AND isactive = TRUE
                ORDER BY id ASC";

            DbCommand locCmd = db.GetCommand(locQuery);
            db.AddParameter(locCmd, "organisationid", DbTypes.Types.Long).Value = orgId;
            using (DbDataReader reader = await db.Execute(locCmd))
            {
                while (await reader.ReadAsync())
                {
                    d.has_location = true;
                    if (d.primary_location_id <= 0)
                    {
                        d.primary_location_id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }

                    var slug = reader["customurl"] == DBNull.Value ? "" : reader["customurl"].ToString()?.Trim() ?? "";
                    if (!string.IsNullOrEmpty(slug))
                    {
                        d.has_custom_domain = true;
                        d.primary_location_customurl ??= slug;
                    }

                    var templateId = reader["templateid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["templateid"]);
                    if (templateId > 0 && templateId != 60)
                    {
                        d.has_website = true;
                    }

                    var facilitiesJson = reader["facility_list"] == DBNull.Value
                        ? "[]"
                        : reader["facility_list"].ToString() ?? "[]";
                    try
                    {
                        var ids = JsonSerializer.Deserialize<List<long>>(facilitiesJson) ?? new List<long>();
                        if (ids.Count > 0) d.has_facilities = true;
                    }
                    catch
                    {
                        // ignore malformed facility_list
                    }
                }
            }

            state.location_complete = d.has_location || state.location_complete;
            d.has_services = await organisationServicesService.HasAnyForOrganisationTransaction(db, orgId);
            d.has_timing = await organisationServiceTimingService.HasAnyForOrganisationTransaction(db, orgId);
            d.has_events = await ExistsScalarTransaction(db, @"
                SELECT 1 FROM events
                WHERE organisation_id = @organisationid AND COALESCE(isactive, TRUE) = TRUE
                LIMIT 1", orgId);
            d.has_rooms = await ExistsScalarTransaction(db, @"
                SELECT 1 FROM organisation_rooms
                WHERE organisation_id = @organisationid AND COALESCE(isactive, TRUE) = TRUE
                LIMIT 1", orgId);

            state.derived = d;
        }

        static void SyncConfiguredFromDerived(OrganisationOnboardingState state)
        {
            var d = state.derived;
            if (d.has_services) AddUnique(state.configured_offerings, OnboardingOfferingKeys.Services);
            if (d.has_events)
            {
                AddUnique(state.configured_offerings, OnboardingOfferingKeys.Events);
                // Classes reuse the events module.
                if (state.selected_offerings.Contains(OnboardingOfferingKeys.Classes, StringComparer.OrdinalIgnoreCase))
                {
                    AddUnique(state.configured_offerings, OnboardingOfferingKeys.Classes);
                }
            }
            if (d.has_rooms) AddUnique(state.configured_offerings, OnboardingOfferingKeys.Stay);
            if (d.has_facilities) AddUnique(state.configured_offerings, OnboardingOfferingKeys.Facilities);
            // "Other" is satisfied once the org has created any supported business item.
            if (state.selected_offerings.Contains(OnboardingOfferingKeys.Other, StringComparer.OrdinalIgnoreCase)
                && (d.has_services || d.has_events || d.has_rooms || d.has_facilities))
            {
                AddUnique(state.configured_offerings, OnboardingOfferingKeys.Other);
            }
        }

        static bool AdvanceStep(OrganisationOnboardingState state)
        {
            if (state.is_complete) return false;

            string before = state.current_step;
            var d = state.derived;

            // Legacy orgs that finished the previous 4-step setup before offerings existed.
            bool legacyComplete = state.selected_offerings.Count == 0
                && d.has_custom_domain
                && d.has_services
                && d.has_website
                && d.has_timing;
            if (legacyComplete)
            {
                state.current_step = OnboardingStepKeys.Complete;
                state.is_complete = true;
                state.completed_at ??= DateTime.UtcNow;
                return !string.Equals(before, state.current_step, StringComparison.OrdinalIgnoreCase)
                    || state.is_complete;
            }

            bool offeringsChosen = state.selected_offerings.Count > 0;
            bool createDone = offeringsChosen && state.selected_offerings.All(o =>
                state.configured_offerings.Contains(o, StringComparer.OrdinalIgnoreCase) ||
                state.skipped_offerings.Contains(o, StringComparer.OrdinalIgnoreCase));

            // Website address (subdomain) or explicit skip is enough to leave Screen 6.
            // Template design and business hours stay on the Screen 7 checklist.
            bool websiteDone = d.has_custom_domain || state.website_skipped;

            if (!offeringsChosen)
            {
                state.current_step = OnboardingStepKeys.Offerings;
            }
            else if (!createDone)
            {
                state.current_step = OnboardingStepKeys.CreateItems;
            }
            else if (!websiteDone)
            {
                state.current_step = OnboardingStepKeys.Website;
            }
            else
            {
                state.current_step = OnboardingStepKeys.Complete;
            }

            return !string.Equals(before, state.current_step, StringComparison.OrdinalIgnoreCase)
                || state.is_complete;
        }

        static string? ResolveNextCreateOffering(OrganisationOnboardingState state)
        {
            foreach (var offering in state.selected_offerings)
            {
                bool done = state.configured_offerings.Contains(offering, StringComparer.OrdinalIgnoreCase)
                    || state.skipped_offerings.Contains(offering, StringComparer.OrdinalIgnoreCase);
                if (!done) return offering;
            }

            return null;
        }

        static List<string> BuildNotes(OrganisationOnboardingState state)
        {
            var notes = new List<string>();
            if (state.selected_offerings.Contains(OnboardingOfferingKeys.Classes, StringComparer.OrdinalIgnoreCase))
            {
                notes.Add("Classes & courses use the existing Events module (dated sessions / workshops).");
            }
            if (state.selected_offerings.Contains(OnboardingOfferingKeys.Facilities, StringComparer.OrdinalIgnoreCase))
            {
                notes.Add("Facilities map to location amenities (facility_list) on OrganisationLocation.");
            }
            if (state.selected_offerings.Contains(OnboardingOfferingKeys.Other, StringComparer.OrdinalIgnoreCase))
            {
                notes.Add("Other Business — choose a supported item to create, or skip and add offerings later.");
            }
            notes.Add("Custom apex domains are not verified via DNS in this release; use an Appointza subdomain (customurl).");
            return notes;
        }

        async Task PersistCatalogOfferingsTransaction(
            IDb db,
            long organisationId,
            List<string> selected)
        {
            // Map onboarding keys → catalog_offerings stored on Organisation.attributes
            var catalog = new List<string>();
            if (selected.Contains(OnboardingOfferingKeys.Services, StringComparer.OrdinalIgnoreCase))
                catalog.Add("services");
            if (selected.Contains(OnboardingOfferingKeys.Events, StringComparer.OrdinalIgnoreCase)
                || selected.Contains(OnboardingOfferingKeys.Classes, StringComparer.OrdinalIgnoreCase))
                catalog.Add("events");
            if (selected.Contains(OnboardingOfferingKeys.Stay, StringComparer.OrdinalIgnoreCase))
                catalog.Add("rooms");

            const string selectAttrs = @"
                SELECT attributes FROM Organisation WHERE id = @id AND isactive = TRUE LIMIT 1";
            DbCommand selectCmd = db.GetCommand(selectAttrs);
            db.AddParameter(selectCmd, "id", DbTypes.Types.Long).Value = organisationId;
            string attrsJson = "{}";
            using (DbDataReader reader = await db.Execute(selectCmd))
            {
                if (await reader.ReadAsync() && reader["attributes"] != DBNull.Value)
                {
                    attrsJson = reader["attributes"].ToString() ?? "{}";
                }
            }

            Dictionary<string, object?> baseDict;
            try
            {
                baseDict = JsonSerializer.Deserialize<Dictionary<string, object?>>(attrsJson, JsonOpts)
                    ?? new Dictionary<string, object?>();
            }
            catch
            {
                baseDict = new Dictionary<string, object?>();
            }

            baseDict["catalog_offerings"] = catalog;
            baseDict["onboarding_offerings"] = selected;

            string organisationType = "service";
            bool hasRooms = catalog.Contains("rooms");
            bool hasServiceSide = catalog.Contains("services") || catalog.Contains("events");
            if (hasRooms && hasServiceSide) organisationType = "both";
            else if (hasRooms) organisationType = "hospitality";

            const string update = @"
                UPDATE Organisation
                SET attributes = @attributes::jsonb,
                    organisation_type = @organisation_type,
                    modifiedon = @modifiedon
                WHERE id = @id AND isactive = TRUE";

            DbCommand updateCmd = db.GetCommand(update);
            db.AddParameter(updateCmd, "attributes", DbTypes.Types.String).Value = JsonSerializer.Serialize(baseDict);
            db.AddParameter(updateCmd, "organisation_type", DbTypes.Types.String).Value = organisationType;
            db.AddParameter(updateCmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(updateCmd, "id", DbTypes.Types.Long).Value = organisationId;
            await db.ExecuteNonQuery(updateCmd);
        }

        async Task<List<string>> ReadCatalogOfferingsTransaction(IDb db, long organisationId)
        {
            const string query = @"
                SELECT attributes FROM Organisation WHERE id = @id LIMIT 1";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync() || reader["attributes"] == DBNull.Value)
            {
                return new List<string>();
            }

            try
            {
                using var doc = JsonDocument.Parse(reader["attributes"].ToString() ?? "{}");
                if (doc.RootElement.TryGetProperty("onboarding_offerings", out var onboarding)
                    && onboarding.ValueKind == JsonValueKind.Array)
                {
                    return NormalizeOfferings(onboarding.EnumerateArray()
                        .Select(x => x.GetString() ?? "")
                        .ToList());
                }

                if (doc.RootElement.TryGetProperty("catalog_offerings", out var catalog)
                    && catalog.ValueKind == JsonValueKind.Array)
                {
                    var mapped = new List<string>();
                    foreach (var item in catalog.EnumerateArray())
                    {
                        var v = item.GetString()?.ToLowerInvariant();
                        if (v == "services") mapped.Add(OnboardingOfferingKeys.Services);
                        else if (v == "events") mapped.Add(OnboardingOfferingKeys.Events);
                        else if (v == "rooms") mapped.Add(OnboardingOfferingKeys.Stay);
                    }
                    return mapped;
                }
            }
            catch
            {
                // ignore
            }

            return new List<string>();
        }

        async Task<bool> HasLocationTransaction(IDb db, long organisationId)
        {
            return await ExistsScalarTransaction(db, @"
                SELECT 1 FROM OrganisationLocation
                WHERE organisationid = @organisationid AND isactive = TRUE
                LIMIT 1", organisationId);
        }

        static async Task<bool> ExistsScalarTransaction(IDb db, string query, long organisationId)
        {
            try
            {
                DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationId;
                using DbDataReader reader = await db.Execute(command);
                return await reader.ReadAsync();
            }
            catch
            {
                // Table may not exist yet (e.g. hospitality bootstrap pending).
                return false;
            }
        }

        static List<string> NormalizeOfferings(IEnumerable<string>? offerings)
        {
            var result = new List<string>();
            if (offerings == null) return result;
            foreach (var raw in offerings)
            {
                var key = (raw ?? "").Trim().ToLowerInvariant();
                if (!OnboardingOfferingKeys.All.Contains(key)) continue;
                if (!result.Contains(key, StringComparer.OrdinalIgnoreCase))
                {
                    result.Add(key);
                }
            }
            return result;
        }

        static List<string> ReadStringArray(object? value)
        {
            if (value == null || value == DBNull.Value) return new List<string>();
            try
            {
                var list = JsonSerializer.Deserialize<List<string>>(value.ToString() ?? "[]", JsonOpts);
                return NormalizeOfferings(list);
            }
            catch
            {
                return new List<string>();
            }
        }

        static void AddUnique(List<string> list, string value)
        {
            if (!list.Contains(value, StringComparer.OrdinalIgnoreCase))
            {
                list.Add(value);
            }
        }
    }
}
