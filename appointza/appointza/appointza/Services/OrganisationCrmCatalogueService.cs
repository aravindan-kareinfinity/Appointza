using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Utils;

namespace appointza.Services
{
    public class OrganisationCrmCatalogueService
    {
        private readonly OrganisationService organisationService;
        private readonly OrganisationLocationService organisationLocationService;
        private readonly OrganisationServicesService organisationServicesService;
        private readonly EventService eventService;
        private readonly OrganisationRoomService organisationRoomService;
        private readonly RequestState requeststate;

        public OrganisationCrmCatalogueService(
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService,
            OrganisationServicesService organisationServicesService,
            EventService eventService,
            OrganisationRoomService organisationRoomService,
            RequestState requeststate)
        {
            this.organisationService = organisationService;
            this.organisationLocationService = organisationLocationService;
            this.organisationServicesService = organisationServicesService;
            this.eventService = eventService;
            this.organisationRoomService = organisationRoomService;
            this.requeststate = requeststate;
        }

        public async Task<OrganisationCrmCatalogueOverview> GetOverview(OrganisationCrmCatalogueSelectReq req)
        {
            long orgId = req?.organisation_id ?? 0;
            if (orgId <= 0)
            {
                orgId = requeststate.usercontext?.organisationid ?? 0;
            }
            if (orgId <= 0)
            {
                throw new Exception("Organisation is required.");
            }

            var overview = new OrganisationCrmCatalogueOverview();

            var orgs = await organisationService.Select(new OrganisationSelectReq { id = orgId });
            var org = orgs?.FirstOrDefault();
            if (org != null)
            {
                overview.organisation = new OrganisationCrmOrgSummary
                {
                    id = org.id,
                    name = org.name ?? "",
                    tagline = org.tagline ?? "",
                    organisation_type = org.organisation_type ?? "",
                    gstnumber = org.gstnumber ?? "",
                    notes = org.notes ?? "",
                    isactive = org.isactive,
                    organisationlogo = org.organisationlogo,
                    imageid = org.imageid,
                };
            }

            var locations = await organisationLocationService.Select(new OrganisationLocationSelectReq
            {
                organisationid = orgId,
            });
            overview.locations = (locations ?? new List<OrganisationLocation>())
                .Where(l => l.isactive)
                .Select(l => new OrganisationCrmLocationItem
                {
                    id = l.id,
                    name = l.name ?? "",
                    address = string.Join(", ", new[] { l.addressline1, l.addressline2 }.Where(s => !string.IsNullOrWhiteSpace(s))),
                    city = l.city ?? "",
                    mobile = l.whatsapp_mobile ?? "",
                    email = l.email ?? "",
                    isactive = l.isactive,
                })
                .ToList();

            var services = await organisationServicesService.Select(new OrganisationServicesSelectReq
            {
                organisationid = orgId,
            });
            overview.services = (services ?? new List<OrganisationServices>())
                .Where(s => s.isactive && !s.issuspended)
                .Select(s => new OrganisationCrmServiceItem
                {
                    id = s.id,
                    name = s.Servicename ?? "",
                    price = s.prize,
                    weekday_price = s.weekday_price,
                    weekend_price = s.weekend_price,
                    duration_minutes = s.timetaken,
                    is_combo = s.Iscombo,
                    show_price = s.show_price,
                    isactive = s.isactive,
                    rating = s.rating,
                    organisationlocationid = s.organisationlocationid,
                })
                .OrderBy(s => s.name)
                .ToList();

            var events = await eventService.Select(new EventSelectReq
            {
                organisation_id = (int)orgId,
                is_public = false, // include private org events for CRM staff view
                include_past = true,
            });
            overview.events = (events ?? new List<Event>())
                .Where(e => e.isactive)
                .Select(e => new OrganisationCrmEventItem
                {
                    id = e.id,
                    event_name = e.event_name ?? "",
                    event_type = e.event_type ?? "",
                    event_date = e.event_date,
                    from_date = e.from_date,
                    to_date = e.to_date,
                    start_time = e.start_time ?? "",
                    end_time = e.end_time ?? "",
                    location = e.location ?? "",
                    status = e.status ?? "",
                    entry_amount = e.entry_amount,
                    slot_limit = e.slot_limit,
                    remainingslot = e.remainingslot,
                    is_public = e.is_public,
                    isactive = e.isactive,
                })
                .OrderByDescending(e => e.event_date ?? e.from_date ?? DateTime.MinValue)
                .ToList();

            var rooms = await organisationRoomService.Select(new OrganisationRoomSelectReq
            {
                organisation_id = orgId,
            });
            overview.rooms = (rooms ?? new List<OrganisationRoom>())
                .Where(r => r.isactive)
                .Select(r => new OrganisationCrmRoomItem
                {
                    id = r.id,
                    room_number = r.room_number ?? "",
                    room_name = r.room_name ?? "",
                    room_type = r.room_type ?? "",
                    status = r.status ?? "",
                    organisation_location_id = r.organisation_location_id,
                    isactive = r.isactive,
                })
                .OrderBy(r => r.room_number)
                .ThenBy(r => r.room_name)
                .ToList();

            return overview;
        }
    }
}
