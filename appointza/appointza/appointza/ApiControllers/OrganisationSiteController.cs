using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Services;
using appointza.Utils;
using System.Text.RegularExpressions;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganisationSiteController : ControllerBase
    {
        ILogger<OrganisationSiteController> logger;
        OrganisationSiteService organisationsiteService;
        OrganisationService organisationService;
        OrganisationLocationService organisationLocationService;
        ReferenceValueService referenceValueService;
        EventService eventService;
        
        public OrganisationSiteController(
            ILogger<OrganisationSiteController> logger,
            OrganisationSiteService organisationsiteService,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService,
            ReferenceValueService referenceValueService,
            EventService eventService)
        {
            this.logger = logger;
            this.organisationsiteService = organisationsiteService;
            this.organisationService = organisationService;
            this.organisationLocationService = organisationLocationService;
            this.referenceValueService = referenceValueService;
            this.eventService = eventService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Entity()
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>()
            {
               item = new OrganisationSite()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<OrganisationSite>>>> Select(ActionReq<OrganisationSiteSelectReq> req)
        {
            ActionRes<List<OrganisationSite>> result = new ActionRes<List<OrganisationSite>>();

            result.item = await organisationsiteService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Insert(ActionReq<OrganisationSite> req)
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>();

            result.item = await organisationsiteService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Update(ActionReq<OrganisationSite> req)
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>();

            result.item = await organisationsiteService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<OrganisationSite>>> Save(ActionReq<OrganisationSite> req)
        {
            ActionRes<OrganisationSite> result = new ActionRes<OrganisationSite>();

            if(req.item.id > 0){
                result.item = await organisationsiteService.Update(req.item);
            }else{
                result.item = await organisationsiteService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganisationSiteDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organisationsiteService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("GetSiteDetails")]
        public async Task<ActionResult<ActionRes<List<Sitedetails>>>> GetSiteDetails(ActionReq<long> req)
        {
            ActionRes<List<Sitedetails>> result = new ActionRes<List<Sitedetails>>();

            result.item = await organisationsiteService.GetSiteDetails(req.item);

            return Ok(result);
        }

        [HttpGet("GetSiteDetailsByOrgLocTempId/{orgloctempid}")]
        public async Task<ActionResult<ActionRes<List<Sitedetails>>>> GetSiteDetailsByOrgLocTempId(string orgloctempid)
        {
            try
            {
                var locationId = await organisationLocationService.GetLocationIdByOrgLocTempId(orgloctempid);
                if (locationId <= 0)
                {
                    return NotFound("Location not found");
                }

                var result = new ActionRes<List<Sitedetails>>
                {
                    item = await organisationsiteService.GetSiteDetails(locationId)
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting site details by orgloctempid: {OrgLocTempId}", orgloctempid);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Single public endpoint: resolve GUID → load site + events → bind template → return HTML.
        /// UI should only render the returned html (no second GetSiteDetails / client render).
        /// </summary>
        [HttpGet("GetPublicHtml/{orgloctempid}")]
        public async Task<ActionResult<ActionRes<OrganisationTemplateResolveRes>>> GetPublicHtml(string orgloctempid)
        {
            try
            {
                var token = (orgloctempid ?? "").Trim();
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new ActionRes<OrganisationTemplateResolveRes>
                    {
                        error = "orgloctempid is required.",
                    });
                }

                var locationId = await organisationLocationService.GetLocationIdByOrgLocTempId(token);
                if (locationId <= 0)
                {
                    return NotFound(new ActionRes<OrganisationTemplateResolveRes>
                    {
                        error = "Location not found",
                    });
                }

                var apiBaseUrl = $"{Request.Scheme}://{Request.Host}";
                var frontendBaseUrl = Request.Headers["Origin"].FirstOrDefault()
                    ?? Request.Headers["Referer"].FirstOrDefault()
                    ?? apiBaseUrl;
                if (Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var originUri))
                {
                    frontendBaseUrl = $"{originUri.Scheme}://{originUri.Authority}";
                }

                var loaded = await LoadPublicHtmlContextAsync(locationId, token);
                if (loaded.EarlyResponse != null)
                {
                    ApplyPublicHtmlCacheHeaders(loaded.EarlyResponse.versionKey);
                    if (IsPublicHtmlNotModified(loaded.EarlyResponse.versionKey))
                    {
                        return StatusCode(304);
                    }

                    return Ok(new ActionRes<OrganisationTemplateResolveRes> { item = loaded.EarlyResponse });
                }

                ApplyPublicHtmlCacheHeaders(loaded.VersionKey);
                if (IsPublicHtmlNotModified(loaded.VersionKey))
                {
                    return StatusCode(304);
                }

                var built = RenderPublicHtmlFromContext(loaded, apiBaseUrl, frontendBaseUrl);
                return Ok(new ActionRes<OrganisationTemplateResolveRes> { item = built });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetPublicHtml failed for {OrgLocTempId}", orgloctempid);
                return StatusCode(500, new ActionRes<OrganisationTemplateResolveRes>
                {
                    error = "Internal server error",
                });
            }
        }

        /// <summary>Same as GetPublicHtml but by numeric location id (subdomain fallback).</summary>
        [HttpGet("GetPublicHtmlByLocation/{locationId:long}")]
        public async Task<ActionResult<ActionRes<OrganisationTemplateResolveRes>>> GetPublicHtmlByLocation(long locationId)
        {
            try
            {
                if (locationId <= 0)
                {
                    return BadRequest(new ActionRes<OrganisationTemplateResolveRes>
                    {
                        error = "locationId is required.",
                    });
                }

                var apiBaseUrl = $"{Request.Scheme}://{Request.Host}";
                var frontendBaseUrl = Request.Headers["Origin"].FirstOrDefault()
                    ?? Request.Headers["Referer"].FirstOrDefault()
                    ?? apiBaseUrl;
                if (Uri.TryCreate(frontendBaseUrl, UriKind.Absolute, out var originUri))
                {
                    frontendBaseUrl = $"{originUri.Scheme}://{originUri.Authority}";
                }

                var loaded = await LoadPublicHtmlContextAsync(locationId, "");
                if (loaded.EarlyResponse != null)
                {
                    ApplyPublicHtmlCacheHeaders(loaded.EarlyResponse.versionKey);
                    if (IsPublicHtmlNotModified(loaded.EarlyResponse.versionKey))
                    {
                        return StatusCode(304);
                    }

                    return Ok(new ActionRes<OrganisationTemplateResolveRes> { item = loaded.EarlyResponse });
                }

                ApplyPublicHtmlCacheHeaders(loaded.VersionKey);
                if (IsPublicHtmlNotModified(loaded.VersionKey))
                {
                    return StatusCode(304);
                }

                var built = RenderPublicHtmlFromContext(loaded, apiBaseUrl, frontendBaseUrl);
                return Ok(new ActionRes<OrganisationTemplateResolveRes> { item = built });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GetPublicHtmlByLocation failed for {LocationId}", locationId);
                return StatusCode(500, new ActionRes<OrganisationTemplateResolveRes>
                {
                    error = "Internal server error",
                });
            }
        }

        private sealed class PublicHtmlLoadContext
        {
            public OrganisationTemplateResolveRes? EarlyResponse { get; init; }
            public Sitedetails? SiteDetail { get; init; }
            public IList<Event> Events { get; init; } = new List<Event>();
            public IList<string> Facilities { get; init; } = new List<string>();
            public OrganisationDetail? OrganisationDetail { get; init; }
            public string TemplateHtml { get; init; } = "";
            public string VersionKey { get; init; } = "";
            public string OrgLocTempIdHint { get; init; } = "";
            public long OrgId { get; init; }
            public long LocId { get; init; }
            public long TemplateId { get; init; }
        }

        private async Task<PublicHtmlLoadContext> LoadPublicHtmlContextAsync(long locationId, string orgLocTempIdHint)
        {
            var siteDetails = await organisationsiteService.GetSiteDetails(locationId);
            if (siteDetails == null || siteDetails.Count == 0)
            {
                return new PublicHtmlLoadContext
                {
                    EarlyResponse = new OrganisationTemplateResolveRes
                    {
                        organisationlocationid = locationId,
                        orgloctempid = orgLocTempIdHint ?? "",
                        html = BuildErrorHtml("Site Details Not Found", "No site details were returned for this location."),
                        versionKey = $"missing:{locationId}",
                    },
                };
            }

            var siteDetail = siteDetails[0];
            var orgId = siteDetail.organisationdetail?.id ?? 0;
            var locId = siteDetail.locationdetail?.id > 0 ? siteDetail.locationdetail.id : locationId;

            if (siteDetail.orgnaisatinservice != null && locId > 0)
            {
                siteDetail.orgnaisatinservice = siteDetail.orgnaisatinservice
                    .Where(s => s.organisationlocationid == 0 || s.organisationlocationid == locId)
                    .ToList();
            }

            var templateHtml = siteDetail.template_html ?? "";
            if (string.IsNullOrWhiteSpace(templateHtml) && siteDetail.locationdetail?.templateid > 0)
            {
                var templateId = siteDetail.locationdetail.templateid;
                var templateItems = await referenceValueService.Select(new ReferenceValueSelectReq
                {
                    id = templateId,
                    referencetypeid = 0,
                    organisationid = 0,
                    parentid = 0,
                });
                if (templateItems != null && templateItems.Count > 0)
                {
                    templateHtml = templateItems[0].description ?? "";
                }
            }

            if (string.IsNullOrWhiteSpace(templateHtml))
            {
                return new PublicHtmlLoadContext
                {
                    EarlyResponse = new OrganisationTemplateResolveRes
                    {
                        organisationid = orgId,
                        organisationlocationid = locId,
                        orgloctempid = orgLocTempIdHint ?? "",
                        templateid = siteDetail.locationdetail?.templateid ?? 0,
                        html = BuildErrorHtml("No Template Assigned", "No template has been assigned to this location."),
                        versionKey = $"empty-template:{locId}",
                    },
                };
            }

            var events = PublicTemplateContentRequirements.RequiresEvents(templateHtml)
                ? await eventService.Select(new EventSelectReq
                {
                    organisation_id = (int)orgId,
                    organisation_location_id = (int)locId,
                    is_public = true,
                    include_past = false,
                }) ?? new List<Event>()
                : new List<Event>();

            var facilities = siteDetail.facilities ?? new List<string>();
            var organisationDetail = new OrganisationDetail
            {
                organisationid = orgId,
                organisationlocationid = locId,
                organisationname = siteDetail.organisationdetail?.name ?? "",
                organisationtagline = siteDetail.organisationdetail?.tagline ?? "",
                organisationlogo = siteDetail.organisationdetail?.organisationlogo ?? 0,
                organisationnotes = siteDetail.organisationdetail?.notes ?? "",
                organisationlocationaddressline1 = siteDetail.locationdetail?.addressline1 ?? "",
                organisationlocationaddressline2 = siteDetail.locationdetail?.addressline2 ?? "",
                organisationlocationcity = siteDetail.locationdetail?.city ?? "",
                organisationlocationstate = siteDetail.locationdetail?.state ?? "",
                organisationlocationcountry = siteDetail.locationdetail?.country ?? "",
                organisationlocationpincode = siteDetail.locationdetail?.pincode ?? "",
                organisationlocationgooglelocation = siteDetail.locationdetail?.googlelocation ?? "",
                organisationlocationlatitude = siteDetail.locationdetail?.latitude ?? 0,
                organisationlocationlongitude = siteDetail.locationdetail?.longitude ?? 0,
            };

            return new PublicHtmlLoadContext
            {
                SiteDetail = siteDetail,
                Events = events,
                Facilities = facilities,
                OrganisationDetail = organisationDetail,
                TemplateHtml = templateHtml,
                VersionKey = BuildPublicHtmlVersionKey(siteDetail, events),
                OrgLocTempIdHint = orgLocTempIdHint ?? "",
                OrgId = orgId,
                LocId = locId,
                TemplateId = siteDetail.locationdetail?.templateid ?? 0,
            };
        }

        private static OrganisationTemplateResolveRes RenderPublicHtmlFromContext(
            PublicHtmlLoadContext context,
            string apiBaseUrl,
            string frontendBaseUrl)
        {
            var boundHtml = BindTemplate(
                context.TemplateHtml,
                context.SiteDetail!,
                context.OrganisationDetail!,
                apiBaseUrl,
                frontendBaseUrl,
                context.Events,
                context.Facilities);

            boundHtml = FinalizePublicHtml(boundHtml, apiBaseUrl, frontendBaseUrl, context.OrgId);

            return new OrganisationTemplateResolveRes
            {
                organisationid = context.OrgId,
                organisationlocationid = context.LocId,
                orgloctempid = context.OrgLocTempIdHint,
                templateid = context.TemplateId,
                html = boundHtml,
                versionKey = context.VersionKey,
            };
        }

        private async Task<OrganisationTemplateResolveRes> BuildPublicHtmlForLocationAsync(
            long locationId,
            string orgLocTempIdHint,
            string apiBaseUrl,
            string frontendBaseUrl)
        {
            var loaded = await LoadPublicHtmlContextAsync(locationId, orgLocTempIdHint);
            if (loaded.EarlyResponse != null)
            {
                return loaded.EarlyResponse;
            }

            return RenderPublicHtmlFromContext(loaded, apiBaseUrl, frontendBaseUrl);
        }

        private static string FormatPublicHtmlEtag(string versionKey)
        {
            var safe = (versionKey ?? "").Replace("\"", "");
            return $"\"{safe}\"";
        }

        private void ApplyPublicHtmlCacheHeaders(string versionKey)
        {
            Response.Headers.ETag = FormatPublicHtmlEtag(versionKey);
            Response.Headers.CacheControl = "private, max-age=0, must-revalidate";
        }

        private bool IsPublicHtmlNotModified(string versionKey)
        {
            var etag = FormatPublicHtmlEtag(versionKey);
            var ifNoneMatch = Request.Headers.IfNoneMatch.ToString();
            if (string.IsNullOrWhiteSpace(ifNoneMatch))
            {
                return false;
            }

            return ifNoneMatch.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(value => string.Equals(value, etag, StringComparison.Ordinal));
        }

        private static string BuildPublicHtmlVersionKey(Sitedetails site, IList<Event> events)
        {
            var locUpdated = site.locationdetail?.modifiedon ?? site.locationdetail?.createdon ?? DateTime.MinValue;
            var orgUpdated = site.organisationdetail?.modifiedon ?? site.organisationdetail?.createdon ?? DateTime.MinValue;
            var eventStamp = events?
                .Select(e => e.updated_at)
                .DefaultIfEmpty(DateTime.MinValue)
                .Max() ?? DateTime.MinValue;
            var serviceCount = site.orgnaisatinservice?.Count ?? 0;
            var roomCount = site.hospitality_rooms?.Count ?? 0;
            return $"{site.locationdetail?.id}:{locUpdated:O}:{orgUpdated:O}:{eventStamp:O}:s{serviceCount}:r{roomCount}";
        }

        private static string BuildErrorHtml(string title, string message)
        {
            return $@"<!DOCTYPE html>
<html><head><meta charset=""utf-8""><title>{title}</title>
<style>body{{font-family:Arial,sans-serif;margin:40px;text-align:center}}.error{{color:#dc2626;font-size:1.2rem}}</style>
</head><body><div class=""error""><h1>{title}</h1><p>{message}</p></div></body></html>";
        }

        private static string FinalizePublicHtml(string html, string apiBaseUrl, string frontendBaseUrl, long organisationId = 0)
        {
            var output = html ?? "";

            // Drop leftover handlebars so users never see raw tokens.
            output = Regex.Replace(output, @"\{\{#[^}]+\}\}", "");
            output = Regex.Replace(output, @"\{\{\/[^}]+\}\}", "");
            output = Regex.Replace(output, @"\{\{[^}]+\}\}", "");

            if (!string.IsNullOrWhiteSpace(frontendBaseUrl)
                && !string.Equals(apiBaseUrl, frontendBaseUrl, StringComparison.OrdinalIgnoreCase))
            {
                output = output.Replace(
                    $"{apiBaseUrl}/book-appointment/",
                    $"{frontendBaseUrl}/book-appointment/",
                    StringComparison.OrdinalIgnoreCase);
                output = output.Replace(
                    $"{apiBaseUrl}/user/events/",
                    $"{frontendBaseUrl}/user/events/",
                    StringComparison.OrdinalIgnoreCase);
                output = Regex.Replace(
                    output,
                    Regex.Escape(apiBaseUrl) + @"/book(\?|""|'|>)",
                    $"{frontendBaseUrl}/book$1",
                    RegexOptions.IgnoreCase);
            }

            // Normalize Files/Get URLs to absolute API host.
            output = Regex.Replace(
                output,
                @"https?:\/\/[^""'\s>]*\/api\/Files\/Get\?id=(\d+)",
                $"{apiBaseUrl}/api/Files/Get?id=$1",
                RegexOptions.IgnoreCase);
            output = Regex.Replace(
                output,
                @"(['""])\/api\/Files\/Get\?id=(\d+)\1",
                $"$1{apiBaseUrl}/api/Files/Get?id=$2$1",
                RegexOptions.IgnoreCase);

            output = Regex.Replace(output, @"<img\b[^>]*\bsrc\s*=\s*""\s*""[^>]*>", "", RegexOptions.IgnoreCase);
            output = Regex.Replace(output, @"<img\b[^>]*\bsrc\s*=\s*'\s*'[^>]*>", "", RegexOptions.IgnoreCase);

            var imgIndex = 0;
            output = Regex.Replace(
                output,
                @"<img\b",
                match =>
                {
                    imgIndex++;
                    return imgIndex == 1
                        ? "<img fetchpriority=\"high\" loading=\"eager\""
                        : "<img loading=\"lazy\"";
                },
                RegexOptions.IgnoreCase);

            var bookingScript = @"
<script>
(function () {
  function appointzaResolveMainAppOrigin() {
    try {
      if (window.parent && window.parent !== window && window.parent.__APPOINTZA_MAIN_ORIGIN__) {
        return window.parent.__APPOINTZA_MAIN_ORIGIN__;
      }
    } catch (_) {}
    var h = (window.location.hostname || '').toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || (h.length > 10 && h.slice(-10) === '.localhost')) {
      var p = window.location.port || '8083';
      return window.location.protocol + '//localhost:' + p;
    }
    if (h === 'appointza.com' || (h.length > 14 && h.slice(-14) === '.appointza.com')) {
      return 'https://appointza.com';
    }
    return window.location.protocol + '//' + window.location.host;
  }
  function isGuestHospitalityBook(href) {
    try {
      var u = new URL(href, window.location.origin);
      return u.pathname === '/book';
    } catch (_) {
      return href.indexOf('/book?') !== -1 || href === '/book';
    }
  }
  function toPath(href) {
    try {
      var u = new URL(href, window.location.origin);
      return u.pathname + u.search + u.hash;
    } catch (_) {
      return href.indexOf('/') === 0 ? href : '/' + href;
    }
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var guestStay = isGuestHospitalityBook(href);
    var serviceOrEvent =
      href.indexOf('/book-appointment/') !== -1 ||
      href.indexOf('/user/events/') !== -1;
    if (!guestStay && !serviceOrEvent) return;
    e.preventDefault();
    var path = toPath(href);
    var mainOrigin = appointzaResolveMainAppOrigin();
    var bookingUrl = href.indexOf('http://') === 0 || href.indexOf('https://') === 0
      ? href
      : mainOrigin + path;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'appointza:booking-nav', url: bookingUrl }, '*');
      return;
    }
    var token = null;
    try { token = localStorage.getItem('auth_token'); } catch (_) {}
    // Hospitality /book is guest checkout — do not force login.
    if (!token && !guestStay) {
      try { sessionStorage.setItem('appointza_auth_return', bookingUrl); } catch (_) {}
      window.location.href = mainOrigin + '/login?from=' + encodeURIComponent(bookingUrl);
      return;
    }
    window.location.href = bookingUrl;
  });
})();
</script>";

            if (output.IndexOf("</body>", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                output = Regex.Replace(
                    output,
                    "</body>",
                    bookingScript + "\n</body>",
                    RegexOptions.IgnoreCase);
            }
            else
            {
                output += bookingScript;
            }

            output = PublicTemplateContactForm.Inject(output, organisationId, apiBaseUrl);

            return output;
        }

        [HttpPost("ResolveTemplateBySubdomain")]
        public async Task<ActionResult<ActionRes<OrganisationTemplateResolveRes>>> ResolveTemplateBySubdomain(
            ActionReq<OrganisationTemplateResolveReq> req)
        {
            ActionRes<OrganisationTemplateResolveRes> result = new ActionRes<OrganisationTemplateResolveRes>();

            if (req?.item == null)
            {
                return BadRequest("Missing request payload.");
            }

            var customUrl = (req.item.customUrl ?? "").Trim();
            if (string.IsNullOrEmpty(customUrl))
            {
                return BadRequest("customUrl is required.");
            }

            var publicSite = await organisationLocationService.ResolvePublicSiteByCustomUrl(customUrl);
            if (publicSite == null || publicSite.id <= 0)
            {
                result.item = null;
                return Ok(result);
            }

            // Prefer SPA route /template/{orgloctempid} — same renderer as direct booking links.
            if (!string.IsNullOrWhiteSpace(publicSite.orgloctempid))
            {
                result.item = new OrganisationTemplateResolveRes
                {
                    organisationid = publicSite.organisationid,
                    organisationlocationid = publicSite.id,
                    orgloctempid = publicSite.orgloctempid.Trim(),
                    templateid = publicSite.templateid,
                };
                return Ok(result);
            }

            var organisationDetail = await organisationService.GetOrganisationByCustomUrl(customUrl);

            if (organisationDetail == null || organisationDetail.organisationlocationid <= 0)
            {
                result.item = new OrganisationTemplateResolveRes
                {
                    organisationid = publicSite.organisationid,
                    organisationlocationid = publicSite.id,
                    templateid = publicSite.templateid,
                };
                return Ok(result);
            }

            var siteDetails = await organisationsiteService.GetSiteDetails(organisationDetail.organisationlocationid);
            if (siteDetails == null || siteDetails.Count == 0)
            {
                result.item = new OrganisationTemplateResolveRes
                {
                    organisationid = publicSite.organisationid,
                    organisationlocationid = publicSite.id,
                    templateid = publicSite.templateid,
                };
                return Ok(result);
            }

            var siteDetail = siteDetails[0];

            var templateHtml = siteDetail.template_html ?? "";
            if (string.IsNullOrWhiteSpace(templateHtml) && siteDetail.locationdetail?.templateid > 0)
            {
                var templateId = siteDetail.locationdetail.templateid;
                var templateItems = await referenceValueService.Select(new ReferenceValueSelectReq
                {
                    id = templateId,
                    referencetypeid = 0,
                    organisationid = 0,
                    parentid = 0
                });

                if (templateItems != null && templateItems.Count > 0)
                {
                    templateHtml = templateItems[0].description ?? "";
                }
            }

            if (string.IsNullOrWhiteSpace(templateHtml))
            {
                result.item = new OrganisationTemplateResolveRes
                {
                    organisationid = organisationDetail.organisationid,
                    organisationlocationid = organisationDetail.organisationlocationid,
                    orgloctempid = publicSite.orgloctempid?.Trim() ?? "",
                    templateid = publicSite.templateid > 0 ? publicSite.templateid : (siteDetail.locationdetail?.templateid ?? 0),
                    html = ""
                };
                return Ok(result);
            }

            var apiBaseUrl = $"{Request.Scheme}://{Request.Host}";
            var frontendBaseUrl = Request.Headers["Origin"].FirstOrDefault() ?? apiBaseUrl;
            var events = PublicTemplateContentRequirements.RequiresEvents(templateHtml)
                ? await eventService.Select(new EventSelectReq
                {
                    organisation_id = (int)organisationDetail.organisationid,
                    organisation_location_id = (int)organisationDetail.organisationlocationid,
                    is_public = true
                }) ?? new List<Event>()
                : new List<Event>();

            var facilities = siteDetail.facilities ?? new List<string>();

            var boundHtml = BindTemplate(templateHtml, siteDetail, organisationDetail, apiBaseUrl, frontendBaseUrl, events, facilities);

            result.item = new OrganisationTemplateResolveRes
            {
                organisationid = organisationDetail.organisationid,
                organisationlocationid = organisationDetail.organisationlocationid,
                orgloctempid = publicSite.orgloctempid?.Trim() ?? "",
                templateid = publicSite.templateid > 0 ? publicSite.templateid : (siteDetail.locationdetail?.templateid ?? 0),
                html = boundHtml
            };

            return Ok(result);
        }

        private static string BindTemplate(
            string templateHtml,
            Sitedetails siteDetail,
            OrganisationDetail organisationDetail,
            string apiBaseUrl,
            string frontendBaseUrl,
            IList<Event> events,
            IList<string> facilities)
        {
            var html = templateHtml ?? "";

            html = html.Replace("{{environment.baseurl}}", apiBaseUrl);
            html = html.Replace("{{environment.uiBaseUrl}}", frontendBaseUrl);

            var organisationName = siteDetail.organisationdetail?.name ?? organisationDetail?.organisationname ?? "";
            var organisationTagline = siteDetail.organisationdetail?.tagline ?? organisationDetail?.organisationtagline ?? "";
            var organisationLogo = siteDetail.organisationdetail?.organisationlogo ?? organisationDetail?.organisationlogo ?? 0;
            var organisationNotes = siteDetail.organisationdetail?.notes ?? organisationDetail?.organisationnotes ?? "";

            var address1 = siteDetail.locationdetail?.addressline1 ?? organisationDetail?.organisationlocationaddressline1 ?? "";
            var address2 = siteDetail.locationdetail?.addressline2 ?? organisationDetail?.organisationlocationaddressline2 ?? "";
            var city = siteDetail.locationdetail?.city ?? organisationDetail?.organisationlocationcity ?? "";
            var state = siteDetail.locationdetail?.state ?? organisationDetail?.organisationlocationstate ?? "";
            var pincode = siteDetail.locationdetail?.pincode ?? organisationDetail?.organisationlocationpincode ?? "";
            var country = siteDetail.locationdetail?.country ?? organisationDetail?.organisationlocationcountry ?? "";
            var googleLocation = siteDetail.locationdetail?.googlelocation ?? organisationDetail?.organisationlocationgooglelocation ?? "";

            html = html.Replace("{{organisationdetail.name}}", organisationName);
            html = html.Replace("{{organisationdetail.tagline}}", organisationTagline);
            html = html.Replace("{{organisationdetail.organisationlogo}}", organisationLogo.ToString());
            var organisationLogoUrl = organisationLogo > 0
                ? $"{apiBaseUrl}/api/Files/Get?id={organisationLogo}"
                : "";
            html = html.Replace("{{ORGANISATION_LOGO_URL}}", organisationLogoUrl);
            html = html.Replace("{{organisationdetail.notes}}", organisationNotes);
            html = html.Replace("{{organisation.notes}}", organisationNotes);
            html = html.Replace("{{OrganisationNotes}}", organisationNotes);
            html = ApplyConditionalSection(html, "{{#organisationtagline}}", "{{/organisationtagline}}", !string.IsNullOrWhiteSpace(organisationTagline));
            html = ApplyConditionalSection(html, "{{#organisationnotes}}", "{{/organisationnotes}}", !string.IsNullOrWhiteSpace(organisationNotes));
            var gstNumber = siteDetail.organisationdetail?.gstnumber ?? "";
            html = html.Replace("{{organisationdetail.gstnumber}}", gstNumber);
            html = ApplyConditionalSection(html, "{{#gstnumber}}", "{{/gstnumber}}", !string.IsNullOrWhiteSpace(gstNumber));
            var mobile = siteDetail.locationdetail?.whatsapp_mobile ?? "";
            var latitude = siteDetail.locationdetail?.latitude.ToString() ?? "";
            var longitude = siteDetail.locationdetail?.longitude.ToString() ?? "";

            html = html.Replace("{{locationdetail.addressline1}}", address1);
            html = html.Replace("{{locationdetail.addressline2}}", address2);
            html = html.Replace("{{locationdetail.city}}", city);
            html = html.Replace("{{locationdetail.state}}", state);
            html = html.Replace("{{locationdetail.pincode}}", pincode);
            html = html.Replace("{{locationdetail.country}}", country);
            html = html.Replace("{{locationdetail.googlelocation}}", googleLocation);
            html = html.Replace("{{locationdetail.mobile}}", mobile);
            html = html.Replace("{{locationdetail.latitude}}", latitude);
            html = html.Replace("{{locationdetail.longitude}}", longitude);
            html = html.Replace("{{BOOKNOWURL}}", $"{frontendBaseUrl}/book-appointment/{organisationDetail?.organisationid ?? 0}/{organisationDetail?.organisationlocationid ?? 0}");
            html = html.Replace("{{currentyear}}", DateTime.Now.Year.ToString());
            html = html.Replace("{{organizationemail}}", "");

            // Conditional sections — render inner content only when data exists
            html = ApplyConditionalSection(html, "{{#addressline2}}", "{{/addressline2}}", !string.IsNullOrWhiteSpace(address2));
            html = ApplyConditionalSection(html, "{{#country}}", "{{/country}}", !string.IsNullOrWhiteSpace(country));
            html = ApplyConditionalSection(html, "{{#googlemaps}}", "{{/googlemaps}}", !string.IsNullOrWhiteSpace(googleLocation));
            html = ApplyConditionalSection(html, "{{#coordinates}}", "{{/coordinates}}", siteDetail.locationdetail?.latitude != 0 || siteDetail.locationdetail?.longitude != 0);
            html = html.Replace("{{#customurl}}", "").Replace("{{/customurl}}", "");

            // Organization logo conditional section
            html = ApplyConditionalSection(html, "{{#organizationlogo}}", "{{/organizationlogo}}", organisationLogo > 0);

            // Location videos ({{#locationvideos}}...{{/locationvideos}})
            var locationVideos = (siteDetail.locationdetail?.attributes?.video_urls ?? new List<string>())
                .Where(url => !string.IsNullOrWhiteSpace(BuildVideoEmbedUrl(url)))
                .Take(12)
                .ToList();
            html = ApplyConditionalSection(html, "{{#haslocationvideos}}", "{{/haslocationvideos}}", locationVideos.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#locationvideos}}",
                "{{/locationvideos}}",
                locationVideos,
                (loop, videoUrl) => loop
                    .Replace("{{LOCATION_VIDEO_EMBED_URL}}", BuildVideoEmbedUrl(videoUrl))
                    .Replace("{{LOCATION_VIDEO_URL}}", videoUrl)
                    .Replace("{{location_video_url}}", videoUrl));

            // Location images ({{#locationimages}}...{{/locationimages}})
            var locationImages = siteDetail.locationdetail?.images ?? new List<long>();
            html = ApplyConditionalSection(html, "{{#haslocationimages}}", "{{/haslocationimages}}", locationImages.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#locationimages}}",
                "{{/locationimages}}",
                locationImages,
                (loop, imageId) =>
                {
                    var id = imageId;
                    var imageUrl = id > 0 ? $"{apiBaseUrl}/api/Files/Get?id={id}" : "";
                    return loop
                        .Replace("/api/Files/Get?id={{location_image_id}}", imageUrl)
                        .Replace("{{LOCATION_IMAGE_URL}}", imageUrl)
                        .Replace("{{location_image_id}}", id > 0 ? imageUrl : "");
                });

            // Services ({{#orgnaisatinservice}}...{{/orgnaisatinservice}})
            var services = siteDetail.orgnaisatinservice ?? new List<OrganisationServices>();
            html = ApplyConditionalSection(html, "{{#hasservices}}", "{{/hasservices}}", services.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#orgnaisatinservice}}",
                "{{/orgnaisatinservice}}",
                services,
                (loop, service) =>
                {
                    var orgId = organisationDetail?.organisationid ?? 0;
                    var locId = organisationDetail?.organisationlocationid ?? 0;
                    var serviceBookUrl = service.id > 0
                        ? $"{frontendBaseUrl}/book-appointment/{orgId}/{locId}?serviceId={service.id}"
                        : $"{frontendBaseUrl}/book-appointment/{orgId}/{locId}";
                    var serviceTemplate = loop
                        .Replace("{{Servicename}}", service.Servicename ?? "")
                        .Replace("{{prize}}", service.prize.ToString())
                        .Replace("{{timetaken}}", service.timetaken.ToString())
                        .Replace("{{notes}}", service.notes ?? "")
                        .Replace("{{service_id}}", service.id.ToString())
                        .Replace("{{SERVICE_BOOK_URL}}", serviceBookUrl);

                    var serviceImageId = service.attributes?.ImageIds?.FirstOrDefault(id => id > 0) ?? 0;
                    var serviceImageUrl = serviceImageId > 0
                        ? $"{apiBaseUrl}/api/Files/Get?id={serviceImageId}"
                        : "";

                    // Only replace the id in Files/Get paths — a full URL here doubles the host
                    // after {{environment.baseurl}} has already been applied.
                    if (serviceImageId > 0)
                    {
                        serviceTemplate = serviceTemplate.Replace(
                            "/api/Files/Get?id={{service_image_id}}",
                            $"/api/Files/Get?id={serviceImageId}");
                    }

                    serviceTemplate = ApplyConditionalSection(
                        serviceTemplate,
                        "{{#service_image_id}}",
                        "{{/service_image_id}}",
                        serviceImageId > 0);
                    serviceTemplate = serviceTemplate
                        .Replace("{{SERVICE_IMAGE_URL}}", serviceImageUrl)
                        .Replace("{{service_image_id}}", serviceImageId > 0 ? serviceImageUrl : "");
                    return serviceTemplate;
                });

            // Service timings ({{#OrganisationServiceTiming}}...{{/OrganisationServiceTiming}})
            var timings = siteDetail.OrganisationServiceTiming ?? new List<OrganisationServiceTiming>();
            var dayNames = new[] { "", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
            html = ApplyConditionalSection(html, "{{#hastimings}}", "{{/hastimings}}", timings.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#OrganisationServiceTiming}}",
                "{{/OrganisationServiceTiming}}",
                timings,
                (loop, timing) =>
                {
                    var dayIndex = (int)Math.Max(0, Math.Min(7, timing.day_of_week));
                    return loop
                        .Replace("{{day_name}}", dayNames[dayIndex])
                        .Replace("{{day_of_week}}", timing.day_of_week.ToString())
                        .Replace("{{start_time}}", timing.start_time.ToString("hh\\:mm"))
                        .Replace("{{end_time}}", timing.end_time.ToString("hh\\:mm"));
                });

            // Handle {{#if locationdetail.images}} ... {{/if}} blocks (used by UI templates)
            if (locationImages.Count > 0)
            {
                var imagesHtml = locationImages.Count == 1
                    ? $"<div class=\"single-image-container\"><img src=\"{apiBaseUrl}/api/Files/Get?id={locationImages[0]}\" alt=\"Location Image\" class=\"single-image\"></div>"
                    : $"<div class=\"image-gallery\">{string.Join("", locationImages.Select(id => $"<img src=\"{apiBaseUrl}/api/Files/Get?id={id}\" alt=\"Location Image\" class=\"gallery-image\">"))}</div>";

                html = Regex.Replace(html, "\\{\\{#if locationdetail\\.images\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}", imagesHtml);
            }
            else
            {
                html = Regex.Replace(html, "\\{\\{#if locationdetail\\.images\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}", "");
            }

            // Events wrapper and loop ({{#hasevents}}...{{/hasevents}} and {{#events}}...{{/events}})
            html = ApplyConditionalSection(html, "{{#hasevents}}", "{{/hasevents}}", events != null && events.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#events}}",
                "{{/events}}",
                events ?? new List<Event>(),
                (loop, evt) =>
                {
                    var eventTemplate = loop
                        .Replace("{{event_name}}", evt.event_name ?? "")
                        .Replace("{{event_date}}", evt.event_date?.ToString("yyyy-MM-dd") ?? "")
                        .Replace("{{from_date}}", evt.from_date?.ToString("yyyy-MM-dd") ?? "")
                        .Replace("{{to_date}}", evt.to_date?.ToString("yyyy-MM-dd") ?? "")
                        .Replace("{{entry_amount}}", evt.entry_amount.ToString())
                        .Replace("{{remainingslot}}", evt.remainingslot.ToString())
                        .Replace("{{description}}", evt.description ?? "")
                        .Replace("{{status}}", evt.status ?? "");

                    var eventImageId = evt.images?.ImageIds?.FirstOrDefault() ?? 0;
                    var eventImageUrl = eventImageId > 0
                        ? $"{apiBaseUrl}/api/Files/Get?id={eventImageId}"
                        : "";

                    // AI/custom templates often omit image markup — inject when photo exists.
                    if (eventImageId > 0
                        && loop.IndexOf("event_image", StringComparison.OrdinalIgnoreCase) < 0
                        && loop.IndexOf("EVENT_IMAGE", StringComparison.OrdinalIgnoreCase) < 0)
                    {
                        var img =
                            $"<img class=\"event-card-image\" src=\"{eventImageUrl}\" alt=\"\" loading=\"lazy\" style=\"width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:0.75rem;\" />";
                        var injected = System.Text.RegularExpressions.Regex.Replace(
                            eventTemplate,
                            @"<(article|div)([^>]*class=[""'][^""']*event-card[^""']*[""'][^>]*)>",
                            $"<$1$2>{img}",
                            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (injected == eventTemplate)
                        {
                            injected = System.Text.RegularExpressions.Regex.Replace(
                                eventTemplate,
                                @"<(article|div)(\b[^>]*)>",
                                $"<$1$2>{img}",
                                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        }
                        eventTemplate = injected;
                    }

                    eventTemplate = ApplyConditionalSection(
                        eventTemplate,
                        "{{#event_image_id}}",
                        "{{/event_image_id}}",
                        eventImageId > 0);
                    // Support both styles:
                    // 1) {{environment.baseurl}}/api/Files/Get?id={{event_image_id}} → keep host, swap id
                    // 2) src="{{event_image_id}}" (expects full URL)
                    if (eventImageId > 0)
                    {
                        eventTemplate = eventTemplate.Replace(
                            "/api/Files/Get?id={{event_image_id}}",
                            $"/api/Files/Get?id={eventImageId}");
                    }

                    eventTemplate = eventTemplate.Replace(
                        "{{event_image_id}}",
                        eventImageUrl);

                    eventTemplate = eventTemplate.Replace(
                        "{{event_image_url}}",
                        eventImageUrl);

                    eventTemplate = eventTemplate.Replace(
                        "{{EVENT_IMAGE_URL}}",
                        eventImageUrl);

                    eventTemplate = eventTemplate.Replace(
                        "{{EVENTBOOKURL}}",
                        $"{frontendBaseUrl}/user/events/{evt.id}/book");

                    var hasToDate = evt.to_date.HasValue;
                    eventTemplate = ApplyConditionalSection(
                        eventTemplate,
                        "{{#to_date}}",
                        "{{/to_date}}",
                        hasToDate);

                    return eventTemplate;
                });

            // Facilities loop ({{#facilities}}...{{/facilities}})
            var facilityList = facilities ?? new List<string>();
            html = ApplyConditionalSection(html, "{{#hasfacilities}}", "{{/hasfacilities}}", facilityList.Count > 0);
            html = ApplyLoopSection(
                html,
                "{{#facilities}}",
                "{{/facilities}}",
                facilityList,
                (loop, facility) =>
                {
                    return loop.Replace("{{facility_displaytext}}", facility ?? "");
                });

            html = BindHospitalitySections(
                html,
                siteDetail,
                organisationDetail?.organisationid ?? 0,
                organisationDetail?.organisationlocationid ?? 0,
                apiBaseUrl,
                frontendBaseUrl);

            return html;
        }

        private static string BindHospitalitySections(
            string templateHtml,
            Sitedetails siteDetail,
            long organisationId,
            long locationId,
            string apiBaseUrl,
            string frontendBaseUrl)
        {
            var html = templateHtml ?? "";
            var profile = siteDetail.hospitality_profile;
            var rooms = (siteDetail.hospitality_rooms ?? []).Where(r => r.isactive
                && !string.Equals(r.status, "maintenance", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(r.status, "blocked", StringComparison.OrdinalIgnoreCase)).ToList();
            var packages = (profile?.packages ?? []).Where(p => p.is_active && !string.IsNullOrWhiteSpace(p.name)).OrderBy(p => p.sort_order).ToList();
            var foodMenu = (profile?.food_menu ?? []).Where(f => !string.IsNullOrWhiteSpace(f.title) || !string.IsNullOrWhiteSpace(f.meal)).ToList();
            var nearbyPlaces = (profile?.nearby_places ?? []).Where(p => !string.IsNullOrWhiteSpace(p.name)).ToList();

            var cancellationPolicy = profile?.cancellation_policy ?? "";
            var paymentPolicy = profile?.payment_policy ?? "";
            var checkInTime = profile?.checkin_time ?? "14:00";
            var checkOutTime = profile?.checkout_time ?? "11:00";

            html = html.Replace("{{hospitality.cancellation_policy}}", cancellationPolicy);
            html = html.Replace("{{hospitality.payment_policy}}", paymentPolicy);
            html = html.Replace("{{hospitality.check_in_time}}", checkInTime);
            html = html.Replace("{{hospitality.check_out_time}}", checkOutTime);
            html = html.Replace("{{organisation.cancellation_policy}}", cancellationPolicy);
            html = html.Replace("{{organisation.payment_policy}}", paymentPolicy);
            html = html.Replace("{{organisation.check_in_time}}", checkInTime);
            html = html.Replace("{{organisation.check_out_time}}", checkOutTime);

            var hasPolicies = !string.IsNullOrWhiteSpace(cancellationPolicy)
                || !string.IsNullOrWhiteSpace(paymentPolicy)
                || !string.IsNullOrWhiteSpace(checkInTime)
                || !string.IsNullOrWhiteSpace(checkOutTime);
            // Default check-in/out times alone should not force an empty Policies section when
            // both policy texts are blank and there is no hospitality profile.
            if (profile == null && string.IsNullOrWhiteSpace(cancellationPolicy) && string.IsNullOrWhiteSpace(paymentPolicy))
            {
                hasPolicies = false;
            }
            html = ApplyConditionalSection(html, "{{#haspolicies}}", "{{/haspolicies}}", hasPolicies);

            html = ApplyConditionalSection(html, "{{#hasrooms}}", "{{/hasrooms}}", rooms.Count > 0);
            html = ApplyConditionalSection(html, "{{#haspackages}}", "{{/haspackages}}", packages.Count > 0);
            html = ApplyConditionalSection(html, "{{#hasfoodmenu}}", "{{/hasfoodmenu}}", foodMenu.Count > 0);
            html = ApplyConditionalSection(html, "{{#hasnearby}}", "{{/hasnearby}}", nearbyPlaces.Count > 0);

            html = ApplyLoopSection(html, "{{#rooms}}", "{{/rooms}}", rooms, (loop, room) =>
            {
                var code = ResolveRoomCode(room);
                var available = !string.Equals(room.status, "maintenance", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(room.status, "blocked", StringComparison.OrdinalIgnoreCase);
                var name = !string.IsNullOrWhiteSpace(room.room_name) ? room.room_name.Trim() : $"Room {room.room_number}";
                var mainPhoto = ResolveHospitalityMediaUrl(room.main_photo, apiBaseUrl, "");
                var bookUrl = $"{frontendBaseUrl}/book?roomId={Uri.EscapeDataString(code)}&organisationId={organisationId}&locationId={locationId}";

                var roomHtml = loop
                    .Replace("{{room.id}}", code)
                    .Replace("{{room.room_number}}", room.room_number ?? "")
                    .Replace("{{room.room_name}}", room.room_name ?? "")
                    .Replace("{{room.name}}", name)
                    .Replace("{{room.type}}", room.room_type ?? "")
                    .Replace("{{room.capacity}}", (room.capacity?.total_guests ?? 2).ToString())
                    .Replace("{{room.price}}", (room.pricing?.price_per_night ?? 0).ToString())
                    .Replace("{{room.main_photo}}", mainPhoto)
                    .Replace("{{room.video_url}}", room.booking_rules?.video_url ?? "")
                    // Public template never shows occupied/reserved — guests book via dates on /book.
                    .Replace("{{room.status}}", available ? "available" : room.status ?? "")
                    .Replace("{{room.status_label}}", available ? "Available" : FormatRoomStatusLabel(room.status))
                    .Replace("{{ROOM_BOOK_URL}}", bookUrl);

                // Always show Book on the public site when the room is not permanently blocked.
                roomHtml = ApplyConditionalSection(roomHtml, "{{#if_room_available}}", "{{/if_room_available}}", available);
                roomHtml = ApplyConditionalSection(roomHtml, "{{#if_room_unavailable}}", "{{/if_room_unavailable}}", !available);
                return roomHtml;
            });

            html = ApplyLoopSection(html, "{{#packages}}", "{{/packages}}", packages, (loop, pkg) =>
            {
                var packageId = !string.IsNullOrWhiteSpace(pkg.id) ? pkg.id.Trim() : $"name:{pkg.name.Trim().ToLowerInvariant()}";
                var bookUrl = $"{frontendBaseUrl}/book?packageId={Uri.EscapeDataString(packageId)}&organisationId={organisationId}&locationId={locationId}";
                return loop
                    .Replace("{{package.id}}", packageId)
                    .Replace("{{package.name}}", pkg.name ?? "")
                    .Replace("{{package.price}}", pkg.price ?? "")
                    .Replace("{{package.description}}", pkg.description ?? "")
                    .Replace("{{package.badge}}", pkg.badge ?? "")
                    .Replace("{{package.image_url}}", ResolveHospitalityMediaUrl(pkg.image_url, apiBaseUrl, ""))
                    .Replace("{{package.minimum_nights}}", pkg.minimum_nights.ToString())
                    .Replace("{{package.max_guests}}", pkg.max_guests.ToString())
                    .Replace("{{package.room_type}}", pkg.room_type ?? "")
                    .Replace("{{package.includes}}", string.Join(" · ", pkg.includes ?? []))
                    .Replace("{{PACKAGE_BOOK_URL}}", bookUrl);
            });

            html = ApplyLoopSection(html, "{{#food_menu}}", "{{/food_menu}}", foodMenu, (loop, item) =>
                loop
                    .Replace("{{food.meal}}", item.meal ?? "")
                    .Replace("{{food.title}}", item.title ?? "")
                    .Replace("{{food.description}}", item.description ?? "")
                    .Replace("{{food.cuisines}}", string.Join(", ", item.cuisines ?? [])));

            html = ApplyLoopSection(html, "{{#nearby_places}}", "{{/nearby_places}}", nearbyPlaces, (loop, place) =>
                loop
                    .Replace("{{place.name}}", place.name ?? "")
                    .Replace("{{place.distance}}", place.distance ?? "")
                    .Replace("{{place.travel_time}}", place.travel_time ?? "")
                    .Replace("{{place.icon}}", place.icon ?? "")
                    .Replace("{{place.image_url}}", place.image_url ?? "")
                    .Replace("{{place.map_url}}", place.map_url ?? ""));

            return html;
        }

        private static string ResolveRoomCode(OrganisationRoom room)
        {
            var code = room.booking_rules?.room_code?.Trim();
            if (!string.IsNullOrEmpty(code))
                return code;
            if (!string.IsNullOrWhiteSpace(room.room_number))
                return $"room-{room.room_number.Trim().Replace(' ', '-').ToLowerInvariant()}";
            return $"room-{room.id}";
        }

        private static string ResolveHospitalityMediaUrl(string value, string apiBaseUrl, string fallback)
        {
            var trimmed = (value ?? "").Trim();
            if (string.IsNullOrEmpty(trimmed))
                return fallback;
            if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return trimmed;
            if (long.TryParse(trimmed, out var id) && id > 0)
                return $"{apiBaseUrl}/api/Files/Get?id={id}";
            return trimmed;
        }

        private static string FormatRoomStatusLabel(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return "Unknown";
            return char.ToUpper(status[0]) + status[1..].Replace('_', ' ');
        }

        private static string ApplyConditionalSection(string template, string startMarker, string endMarker, bool keepContent)
        {
            var startIdx = template.IndexOf(startMarker, StringComparison.Ordinal);
            var endIdx = template.IndexOf(endMarker, StringComparison.Ordinal);
            if (startIdx < 0 || endIdx <= startIdx)
            {
                return template.Replace(startMarker, "").Replace(endMarker, "");
            }

            if (keepContent)
            {
                var content = template.Substring(startIdx + startMarker.Length, endIdx - startIdx - startMarker.Length);
                return template.Substring(0, startIdx) + content + template.Substring(endIdx + endMarker.Length);
            }

            return template.Substring(0, startIdx) + template.Substring(endIdx + endMarker.Length);
        }

        private static string RemoveSection(string template, string startMarker, string endMarker)
        {
            var startIdx = template.IndexOf(startMarker, StringComparison.Ordinal);
            var endIdx = template.IndexOf(endMarker, StringComparison.Ordinal);
            if (startIdx < 0 || endIdx <= startIdx)
            {
                return template.Replace(startMarker, "").Replace(endMarker, "");
            }

            return template.Substring(0, startIdx) + template.Substring(endIdx + endMarker.Length);
        }

        private static string ApplyLoopSection<T>(
            string template,
            string startMarker,
            string endMarker,
            IList<T> items,
            Func<string, T, string> renderItem)
        {
            var startIdx = template.IndexOf(startMarker, StringComparison.Ordinal);
            var endIdx = template.IndexOf(endMarker, StringComparison.Ordinal);
            if (startIdx < 0 || endIdx <= startIdx)
            {
                return template.Replace(startMarker, "").Replace(endMarker, "");
            }

            if (items == null || items.Count == 0)
            {
                return template.Substring(0, startIdx) + template.Substring(endIdx + endMarker.Length);
            }

            var loopTemplate = template.Substring(startIdx + startMarker.Length, endIdx - startIdx - startMarker.Length);
            var content = string.Join("", items.Select(item => renderItem(loopTemplate, item)));
            return template.Substring(0, startIdx) + content + template.Substring(endIdx + endMarker.Length);
        }

        private static string BuildVideoEmbedUrl(string raw)
        {
            if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return "";
            }

            var host = uri.Host.ToLowerInvariant();
            if (host.StartsWith("www."))
            {
                host = host.Substring(4);
            }

            if (host == "youtu.be")
            {
                var id = uri.AbsolutePath.Trim('/').Split('/').FirstOrDefault() ?? "";
                return Regex.IsMatch(id, @"^[\w-]{6,}$")
                    ? $"https://www.youtube-nocookie.com/embed/{id}"
                    : "";
            }

            if (host == "youtube.com" || host == "m.youtube.com")
            {
                var path = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
                var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query);
                var id = query.TryGetValue("v", out var value)
                    ? value.FirstOrDefault() ?? ""
                    : path.Length > 1 && new[] { "embed", "shorts", "live" }.Contains(path[0])
                        ? path[1]
                        : "";
                return Regex.IsMatch(id, @"^[\w-]{6,}$")
                    ? $"https://www.youtube-nocookie.com/embed/{id}"
                    : "";
            }

            if (host == "vimeo.com" || host == "player.vimeo.com")
            {
                var id = uri.AbsolutePath
                    .Split('/', StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault(part => part.All(char.IsDigit)) ?? "";
                return id.Length > 0 ? $"https://player.vimeo.com/video/{id}" : "";
            }

            return uri.AbsoluteUri;
        }
    }
} 