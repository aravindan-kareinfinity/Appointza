import { SiteDetailsItem } from "@/models/sitedetail.model";
import { environment, getUiBaseUrl } from "@/utils/environment";
import { injectContactFormSupport } from "@/utils/templateContactForm.util";
import {
  buildBookAppointmentPath,
  injectTemplateNavScript,
} from "@/utils/templateBookingNav.util";
import { getServiceStartingPrice } from "@/utils/servicePricing.util";
import { toDateOnlyString } from "@/utils/eventDate.util";
import {
  buildHospitalityPolicyTokens,
  buildTemplateFoodMenu,
  buildTemplateGuestServices,
  buildTemplateNearbyPlaces,
  buildTemplatePackages,
  buildTemplateRooms,
  extractHospitalityFromSite,
} from "@/utils/hospitalityTemplate.util";

const replaceToken = (html: string, token: string, value: string | number | null | undefined) => {
  const safeValue = value === null || value === undefined ? "" : String(value);
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`\\{\\{\\s*${escapedToken}\\s*\\}\\}`, "g"), safeValue);
};

const renderConditionalBlock = (html: string, blockName: string, shouldRender: boolean) => {
  const regex = new RegExp(`\\{\\{#${blockName}\\}\\}([\\s\\S]*?)\\{\\{\\/${blockName}\\}\\}`, "g");
  return html.replace(regex, (_match, innerContent) => (shouldRender ? innerContent : ""));
};

/** Rewrites every `start…end` section (a page may contain the same block more than once). */
const replaceEverySection = (
  template: string,
  startMarker: string,
  endMarker: string,
  render: (inner: string) => string,
) => {
  let output = "";
  let cursor = 0;
  while (cursor < template.length) {
    const startIdx = template.indexOf(startMarker, cursor);
    if (startIdx < 0) break;
    const endIdx = template.indexOf(endMarker, startIdx + startMarker.length);
    if (endIdx < 0) break;
    output += template.slice(cursor, startIdx);
    output += render(template.slice(startIdx + startMarker.length, endIdx));
    cursor = endIdx + endMarker.length;
  }
  output += template.slice(cursor);
  return output.replaceAll(startMarker, "").replaceAll(endMarker, "");
};

export const applyConditionalSection = (
  template: string,
  startMarker: string,
  endMarker: string,
  keepContent: boolean,
) => replaceEverySection(template, startMarker, endMarker, (inner) => (keepContent ? inner : ""));

export const applyLoopSection = <T>(
  template: string,
  startMarker: string,
  endMarker: string,
  items: T[],
  renderItem: (loopTemplate: string, item: T) => string
) =>
  replaceEverySection(template, startMarker, endMarker, (loopTemplate) =>
    (items ?? []).map((item) => renderItem(loopTemplate, item)).join(""),
  );

const formatDateValue = (value: unknown) => {
  if (!value) {
    return "";
  }
  return toDateOnlyString(value as string | Date | null) ?? String(value);
};

const buildFileGetUrl = (filesApiBaseUrl: string, fileId: number): string =>
  fileId > 0 ? `${filesApiBaseUrl}/api/Files/Get?id=${fileId}` : "";

/**
 * Templates often use `{{environment.baseurl}}/api/Files/Get?id={{token}}`.
 * After baseurl is applied, replacing the path with a *full* URL doubles the host.
 * Swap only the id in Files/Get paths; bare `{{token}}` still becomes a full URL.
 */
const bindFileIdToken = (
  html: string,
  token: string,
  fileId: number,
  fileUrl: string,
): string => {
  const placeholder = `{{${token}}}`;
  let out = html;
  if (fileId > 0) {
    out = out.replaceAll(`/api/Files/Get?id=${placeholder}`, `/api/Files/Get?id=${fileId}`);
  }
  out = out.replaceAll(placeholder, fileId > 0 ? fileUrl : "");
  return out;
};

/** When a custom/AI template omits event image tokens, still show the event photo. */
const injectEventImageIfMissing = (loopTemplate: string, eventImageUrl: string): string => {
  if (!eventImageUrl) return loopTemplate;
  if (/\{\{\s*#?event_image|EVENT_IMAGE/i.test(loopTemplate)) return loopTemplate;

  const img = `<img class="event-card-image" src="${eventImageUrl}" alt="" loading="lazy" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:0.75rem;" />`;
  const withCardClass = loopTemplate.replace(
    /<(article|div)([^>]*class=["'][^"']*event-card[^"']*["'][^>]*)>/i,
    `<$1$2>${img}`,
  );
  if (withCardClass !== loopTemplate) return withCardClass;

  return loopTemplate.replace(/<(article|div)(\b[^>]*)>/i, `<$1$2>${img}`);
};

const resolveServiceImageId = (service: unknown): number => {
  const record = service as {
    service_image_id?: number;
    imageid?: number;
    attributes?: { ImageIds?: number[] };
  };
  const fromAttributes = record.attributes?.ImageIds?.find((id) => (id ?? 0) > 0);
  if (fromAttributes && fromAttributes > 0) return fromAttributes;
  const direct = Number(record.service_image_id || record.imageid || 0);
  return direct > 0 ? direct : 0;
};

const resolveEventImageId = (evt: Record<string, unknown>): number => {
  const fromList = (evt.images as { ImageIds?: number[] } | undefined)?.ImageIds?.find(
    (id) => (id ?? 0) > 0,
  );
  if (fromList && fromList > 0) return fromList;
  const direct = Number(evt.event_image_id || evt.imageid || evt.image_id || 0);
  return direct > 0 ? direct : 0;
};

const buildVideoEmbedUrl = (raw: string): string => {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const id =
        url.searchParams.get("v") ||
        (["embed", "shorts", "live"].includes(pathParts[0]) ? pathParts[1] : "") ||
        "";
      return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part)) || "";
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
    return url.toString();
  } catch {
    return "";
  }
};

export const resolveSiteOrganisationId = (siteData: SiteDetailsItem): number => {
  const fromOrg = siteData.organisationdetail?.id ?? 0;
  if (fromOrg > 0) return fromOrg;
  const fromLocation = siteData.locationdetail?.organisationid ?? 0;
  return fromLocation > 0 ? fromLocation : 0;
};

export const renderSiteTemplateHtml = (templateHtml: string, siteData: SiteDetailsItem): string => {
  let html = templateHtml || "";
  const organisationId = resolveSiteOrganisationId(siteData);
  const frontendBaseUrl = window.location.origin;
  const normalizedBaseUrl = (environment.baseurl || "").replace(/\/+$/, "");
  const filesApiBaseUrl = normalizedBaseUrl || frontendBaseUrl;
  const fallbackImageUrl = `${window.location.origin}/placeholder.svg`;

  html = replaceToken(html, "environment.baseurl", filesApiBaseUrl);

  html = replaceToken(html, "organisationdetail.name", siteData.organisationdetail?.name);
  html = replaceToken(html, "organisationdetail.id", organisationId);
  html = replaceToken(html, "organisationdetail.tagline", siteData.organisationdetail?.tagline);
  html = replaceToken(html, "organisationdetail.organisationlogo", siteData.organisationdetail?.organisationlogo);
  const logoId = Number(siteData.organisationdetail?.organisationlogo) || 0;
  const organisationLogoUrl =
    logoId > 0 ? `${filesApiBaseUrl}/api/Files/Get?id=${logoId}` : "";
  html = replaceToken(html, "ORGANISATION_LOGO_URL", organisationLogoUrl);
  html = replaceToken(html, "organisationdetail.notes", siteData.organisationdetail?.notes);
  html = replaceToken(html, "organisation.notes", siteData.organisationdetail?.notes);
  html = replaceToken(html, "OrganisationNotes", siteData.organisationdetail?.notes);
  const gstNumber = (siteData.organisationdetail?.gstnumber || "").trim();
  for (const token of ["organisationdetail.gstnumber", "organisationgstnumber", "organizationgstnumber", "gstnumber"]) {
    html = replaceToken(html, token, gstNumber);
  }
  const locationEmail =
    (siteData.locationdetail as { email?: string } | undefined)?.email?.trim() ||
    (siteData.organisationdetail as { email?: string } | undefined)?.email?.trim() ||
    "";
  for (const token of ["organisationemail", "organizationemail"]) {
    html = replaceToken(html, token, locationEmail);
    html = applyConditionalSection(html, `{{#${token}}}`, `{{/${token}}}`, !!locationEmail);
  }

  html = replaceToken(html, "currentyear", new Date().getFullYear());
  const bookPath = buildBookAppointmentPath(organisationId, siteData.locationdetail?.id || 0);
  html = replaceToken(html, "BOOKNOWURL", `${getUiBaseUrl()}${bookPath}`);

  html = replaceToken(html, "locationdetail.name", siteData.locationdetail?.name);
  html = replaceToken(html, "locationdetail.id", siteData.locationdetail?.id);
  html = replaceToken(html, "locationdetail.addressline1", siteData.locationdetail?.addressline1);
  html = replaceToken(html, "locationdetail.addressline2", siteData.locationdetail?.addressline2);
  html = replaceToken(html, "locationdetail.city", siteData.locationdetail?.city);
  html = replaceToken(html, "locationdetail.state", siteData.locationdetail?.state);
  html = replaceToken(html, "locationdetail.country", siteData.locationdetail?.country);
  html = replaceToken(html, "locationdetail.pincode", siteData.locationdetail?.pincode);
  html = replaceToken(html, "locationdetail.latitude", siteData.locationdetail?.latitude);
  html = replaceToken(html, "locationdetail.longitude", siteData.locationdetail?.longitude);
  html = replaceToken(html, "locationdetail.googlelocation", siteData.locationdetail?.googlelocation);
  html = replaceToken(
    html,
    "locationdetail.mobile",
    (siteData.locationdetail as unknown as { whatsapp_mobile?: string })?.whatsapp_mobile
  );

  // Resolve conditional blocks BEFORE stripping any markers so they render correctly.
  const hasGoogleMapsLink = !!siteData.locationdetail?.googlelocation;
  const hasCoordinates =
    (siteData.locationdetail?.latitude ?? 0) !== 0 ||
    (siteData.locationdetail?.longitude ?? 0) !== 0;
  const hasCountry = !!siteData.locationdetail?.country;
  const hasAddressLine2 = !!(siteData.locationdetail?.addressline2);

  html = renderConditionalBlock(html, "googlemaps", hasGoogleMapsLink);
  html = renderConditionalBlock(html, "coordinates", hasCoordinates);
  html = renderConditionalBlock(html, "coordnates", hasCoordinates);
  html = renderConditionalBlock(html, "country", hasCountry);
  html = renderConditionalBlock(html, "addressline2", hasAddressLine2);

  html = applyConditionalSection(
    html,
    "{{#organizationlogo}}",
    "{{/organizationlogo}}",
    (siteData.organisationdetail?.organisationlogo || 0) > 0
  );

  // Strip any remaining bare markers that weren't handled above.
  html = html.replaceAll("{{#customurl}}", "").replaceAll("{{/customurl}}", "");
  const hasGst = !!(siteData.organisationdetail?.gstnumber || "").trim();
  html = applyConditionalSection(html, "{{#gstnumber}}", "{{/gstnumber}}", hasGst);

  const locationVideoUrls = (
    (siteData.locationdetail?.attributes as { video_urls?: unknown } | undefined)?.video_urls ?? []
  );
  const locationVideos = Array.isArray(locationVideoUrls)
    ? locationVideoUrls
        .filter((url): url is string => typeof url === "string" && !!buildVideoEmbedUrl(url))
        .slice(0, 12)
    : [];
  html = applyConditionalSection(
    html,
    "{{#haslocationvideos}}",
    "{{/haslocationvideos}}",
    locationVideos.length > 0,
  );
  html = applyLoopSection(
    html,
    "{{#locationvideos}}",
    "{{/locationvideos}}",
    locationVideos,
    (loopTemplate, videoUrl) =>
      loopTemplate
        .replaceAll("{{LOCATION_VIDEO_EMBED_URL}}", buildVideoEmbedUrl(videoUrl))
        .replaceAll("{{LOCATION_VIDEO_URL}}", videoUrl)
        .replaceAll("{{location_video_url}}", videoUrl),
  );

  const locationImages = siteData.locationdetail?.images || [];
  html = applyConditionalSection(
    html,
    "{{#haslocationimages}}",
    "{{/haslocationimages}}",
    locationImages.length > 0,
  );
  html = applyLoopSection(
    html,
    "{{#locationimages}}",
    "{{/locationimages}}",
    locationImages,
    (loopTemplate, imageId) => {
      const id = Number(imageId) || 0;
      const imageUrl = buildFileGetUrl(filesApiBaseUrl, id);
      return loopTemplate
        .replaceAll("/api/Files/Get?id={{location_image_id}}", imageUrl)
        .replaceAll("{{LOCATION_IMAGE_URL}}", imageUrl)
        .replaceAll("{{location_image_id}}", id > 0 ? imageUrl : "");
    },
  );

  if (locationImages.length > 0) {
    const imagesHtml =
      locationImages.length === 1
        ? `<div class="single-image-container"><img src="${filesApiBaseUrl}/api/Files/Get?id=${locationImages[0]}" alt="Location Image" class="single-image"></div>`
        : `<div class="image-gallery">${locationImages
            .map((id) => `<img src="${filesApiBaseUrl}/api/Files/Get?id=${id}" alt="Location Image" class="gallery-image">`)
            .join("")}</div>`;
    html = html.replace(/\{\{#if locationdetail\.images\}\}[\s\S]*?\{\{\/if\}\}/g, imagesHtml);
  } else {
    html = html.replace(/\{\{#if locationdetail\.images\}\}[\s\S]*?\{\{\/if\}\}/g, "");
  }

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const services = siteData.orgnaisatinservice || [];
  html = applyConditionalSection(html, "{{#hasservices}}", "{{/hasservices}}", services.length > 0);
  html = applyLoopSection(
    html,
    "{{#orgnaisatinservice}}",
    "{{/orgnaisatinservice}}",
    services,
    (loopTemplate, service) => {
      const serviceId = service?.id ?? 0;
      const locationId = siteData.locationdetail?.id || 0;
      const serviceBookPath = buildBookAppointmentPath(organisationId, locationId, serviceId);
      const serviceImageId = resolveServiceImageId(service);
      const serviceImageUrl = buildFileGetUrl(filesApiBaseUrl, serviceImageId);
      let serviceHtml = loopTemplate
        .replaceAll("{{Servicename}}", service?.Servicename || "")
        .replaceAll("{{prize}}", String(getServiceStartingPrice(service as any) ?? ""))
        .replaceAll("{{timetaken}}", String(service?.timetaken ?? ""))
        .replaceAll("{{notes}}", service?.notes || "")
        .replaceAll("{{service_id}}", String(serviceId))
        .replaceAll("{{SERVICE_BOOK_URL}}", `${getUiBaseUrl()}${serviceBookPath}`)
        .replaceAll("{{SERVICE_IMAGE_URL}}", serviceImageUrl);

      serviceHtml = applyConditionalSection(
        serviceHtml,
        "{{#service_image_id}}",
        "{{/service_image_id}}",
        serviceImageId > 0,
      );
      serviceHtml = bindFileIdToken(serviceHtml, "service_image_id", serviceImageId, serviceImageUrl);
      return serviceHtml;
    }
  );

  const timings = siteData.OrganisationServiceTiming || [];
  html = applyConditionalSection(html, "{{#hastimings}}", "{{/hastimings}}", timings.length > 0);
  html = applyLoopSection(
    html,
    "{{#OrganisationServiceTiming}}",
    "{{/OrganisationServiceTiming}}",
    timings,
    (loopTemplate, timing) =>
      loopTemplate
        .replaceAll("{{day_name}}", dayNames[timing?.day_of_week || 0] || `Day ${timing?.day_of_week || 0}`)
        .replaceAll("{{day_of_week}}", String(timing?.day_of_week ?? ""))
        .replaceAll("{{start_time}}", String(timing?.start_time ?? ""))
        .replaceAll("{{end_time}}", String(timing?.end_time ?? ""))
  );

  const events = (siteData as unknown as { events?: Array<Record<string, unknown>> })?.events || [];
  html = applyConditionalSection(html, "{{#hasevents}}", "{{/hasevents}}", events.length > 0);
  html = applyLoopSection(
    html,
    "{{#events}}",
    "{{/events}}",
    events,
    (loopTemplate, evt) => {
      const eventImageId = resolveEventImageId(evt as Record<string, unknown>);
      const eventImageUrl = buildFileGetUrl(filesApiBaseUrl, eventImageId);
      const templateWithImage = injectEventImageIfMissing(loopTemplate, eventImageUrl);

      let eventHtml = templateWithImage
        .replaceAll("{{event_name}}", String((evt as { event_name?: unknown }).event_name || ""))
        .replaceAll("{{event_date}}", formatDateValue((evt as { event_date?: unknown }).event_date))
        .replaceAll("{{from_date}}", formatDateValue((evt as { from_date?: unknown }).from_date))
        .replaceAll("{{to_date}}", formatDateValue((evt as { to_date?: unknown }).to_date))
        .replaceAll("{{entry_amount}}", String((evt as { entry_amount?: unknown }).entry_amount ?? ""))
        .replaceAll("{{remainingslot}}", String((evt as { remainingslot?: unknown }).remainingslot ?? ""))
        .replaceAll("{{description}}", String((evt as { description?: unknown }).description || ""))
        .replaceAll("{{status}}", String((evt as { status?: unknown }).status || ""))
        .replaceAll("{{EVENTBOOKURL}}", `${frontendBaseUrl}/user/events/${String((evt as { id?: unknown }).id || "")}/book`)
        .replaceAll("{{EVENT_IMAGE_URL}}", eventImageUrl);

      eventHtml = applyConditionalSection(eventHtml, "{{#event_image_id}}", "{{/event_image_id}}", eventImageId > 0);
      eventHtml = applyConditionalSection(
        eventHtml,
        "{{#to_date}}",
        "{{/to_date}}",
        !!(evt as { to_date?: unknown }).to_date
      );
      eventHtml = bindFileIdToken(eventHtml, "event_image_id", eventImageId, eventImageUrl);
      eventHtml = eventHtml.replaceAll("{{event_image_url}}", eventImageUrl);
      return eventHtml;
    }
  );

  const locationId = siteData.locationdetail?.id || 0;
  const { profile: hospitalityProfile, rooms: hospitalityRooms } = extractHospitalityFromSite(siteData);
  const policyTokens = buildHospitalityPolicyTokens(hospitalityProfile);
  const templateRooms = buildTemplateRooms(
    hospitalityRooms,
    organisationId,
    locationId,
    filesApiBaseUrl,
    fallbackImageUrl,
  );
  const templatePackages = buildTemplatePackages(
    hospitalityProfile?.packages ?? [],
    organisationId,
    locationId,
    filesApiBaseUrl,
  );
  const templateFoodMenu = buildTemplateFoodMenu(hospitalityProfile?.food_menu ?? []);
  const templateNearby = buildTemplateNearbyPlaces(hospitalityProfile?.nearby_places ?? []);
  const templateGuestServices = buildTemplateGuestServices(hospitalityProfile?.guest_services ?? []);

  html = replaceToken(html, "hospitality.cancellation_policy", policyTokens.cancellation_policy);
  html = replaceToken(html, "hospitality.payment_policy", policyTokens.payment_policy);
  html = replaceToken(html, "hospitality.check_in_time", policyTokens.check_in_time);
  html = replaceToken(html, "hospitality.check_out_time", policyTokens.check_out_time);
  html = replaceToken(html, "organisation.cancellation_policy", policyTokens.cancellation_policy);
  html = replaceToken(html, "organisation.payment_policy", policyTokens.payment_policy);
  html = replaceToken(html, "organisation.check_in_time", policyTokens.check_in_time);
  html = replaceToken(html, "organisation.check_out_time", policyTokens.check_out_time);

  const hasPolicies = !!(
    hospitalityProfile &&
    (policyTokens.cancellation_policy?.trim() ||
      policyTokens.payment_policy?.trim() ||
      (hospitalityProfile.checkin_time || "").trim() ||
      (hospitalityProfile.checkout_time || "").trim())
  );
  html = applyConditionalSection(html, "{{#haspolicies}}", "{{/haspolicies}}", hasPolicies);

  const hasTagline = !!(siteData.organisationdetail?.tagline || "").trim();
  const hasNotes = !!(siteData.organisationdetail?.notes || "").trim();
  html = applyConditionalSection(html, "{{#organisationtagline}}", "{{/organisationtagline}}", hasTagline);
  html = applyConditionalSection(html, "{{#organisationnotes}}", "{{/organisationnotes}}", hasNotes);

  html = applyConditionalSection(html, "{{#hasrooms}}", "{{/hasrooms}}", templateRooms.length > 0);
  html = applyConditionalSection(html, "{{#haspackages}}", "{{/haspackages}}", templatePackages.length > 0);
  html = applyConditionalSection(html, "{{#hasfoodmenu}}", "{{/hasfoodmenu}}", templateFoodMenu.length > 0);
  html = applyConditionalSection(
    html,
    "{{#hasnearby}}",
    "{{/hasnearby}}",
    templateNearby.length > 0,
  );
  html = applyConditionalSection(
    html,
    "{{#hasguestservices}}",
    "{{/hasguestservices}}",
    templateGuestServices.length > 0,
  );

  html = applyLoopSection(html, "{{#rooms}}", "{{/rooms}}", templateRooms, (loopTemplate, room) => {
    let roomHtml = loopTemplate
      .replaceAll("{{room.id}}", room.id)
      .replaceAll("{{room.room_number}}", room.room_number)
      .replaceAll("{{room.room_name}}", room.room_name)
      .replaceAll("{{room.name}}", room.name)
      .replaceAll("{{room.type}}", room.type)
      .replaceAll("{{room.capacity}}", String(room.capacity))
      .replaceAll("{{room.price}}", String(room.price))
      .replaceAll("{{room.main_photo}}", room.main_photo)
      .replaceAll("{{room.video_url}}", room.video_url)
      .replaceAll("{{room.status}}", room.status)
      .replaceAll("{{room.status_label}}", room.status_label)
      .replaceAll("{{ROOM_BOOK_URL}}", `${getUiBaseUrl()}${room.ROOM_BOOK_URL}`);

    roomHtml = applyConditionalSection(
      roomHtml,
      "{{#if_room_available}}",
      "{{/if_room_available}}",
      room.is_available,
    );
    roomHtml = applyConditionalSection(
      roomHtml,
      "{{#if_room_unavailable}}",
      "{{/if_room_unavailable}}",
      !room.is_available,
    );
    return roomHtml;
  });

  html = applyLoopSection(
    html,
    "{{#packages}}",
    "{{/packages}}",
    templatePackages,
    (loopTemplate, pkg) =>
      loopTemplate
        .replaceAll("{{package.id}}", pkg.id)
        .replaceAll("{{package.name}}", pkg.name)
        .replaceAll("{{package.price}}", pkg.price)
        .replaceAll("{{package.description}}", pkg.description)
        .replaceAll("{{package.badge}}", pkg.badge)
        .replaceAll("{{package.image_url}}", pkg.image_url)
        .replaceAll("{{package.minimum_nights}}", String(pkg.minimum_nights))
        .replaceAll("{{package.max_guests}}", String(pkg.max_guests))
        .replaceAll("{{package.room_type}}", pkg.room_type)
        .replaceAll("{{package.includes}}", pkg.includes)
        .replaceAll("{{PACKAGE_BOOK_URL}}", `${getUiBaseUrl()}${pkg.PACKAGE_BOOK_URL}`),
  );

  html = applyLoopSection(
    html,
    "{{#food_menu}}",
    "{{/food_menu}}",
    templateFoodMenu,
    (loopTemplate, item) =>
      loopTemplate
        .replaceAll("{{food.meal}}", item.meal)
        .replaceAll("{{food.title}}", item.title)
        .replaceAll("{{food.description}}", item.description)
        .replaceAll("{{food.cuisines}}", item.cuisines),
  );

  html = applyLoopSection(
    html,
    "{{#nearby_places}}",
    "{{/nearby_places}}",
    templateNearby,
    (loopTemplate, place) =>
      loopTemplate
        .replaceAll("{{place.name}}", place.name)
        .replaceAll("{{place.distance}}", place.distance)
        .replaceAll("{{place.travel_time}}", place.travel_time)
        .replaceAll("{{place.icon}}", place.icon)
        .replaceAll("{{place.image_url}}", place.image_url)
        .replaceAll("{{place.map_url}}", place.map_url),
  );

  html = applyLoopSection(
    html,
    "{{#guest_services}}",
    "{{/guest_services}}",
    templateGuestServices,
    (loopTemplate, guest) =>
      loopTemplate
        .replaceAll("{{guest.name}}", guest.name)
        .replaceAll("{{guest.price}}", guest.price)
        .replaceAll("{{guest.description}}", guest.description)
        .replaceAll("{{guest.category}}", guest.category)
        .replaceAll("{{guest.icon}}", guest.icon),
  );

  // Facilities (optional — may arrive as resolved display strings on site payload)
  const facilities = (
    (siteData as { facilities?: unknown }).facilities ??
    (siteData.locationdetail as { facilities?: unknown } | undefined)?.facilities ??
    []
  );
  const facilityLabels = Array.isArray(facilities)
    ? facilities
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object" && "facility_displaytext" in item) {
            return String((item as { facility_displaytext?: unknown }).facility_displaytext || "").trim();
          }
          if (item && typeof item === "object" && "displaytext" in item) {
            return String((item as { displaytext?: unknown }).displaytext || "").trim();
          }
          return "";
        })
        .filter(Boolean)
    : [];
  html = applyConditionalSection(html, "{{#hasfacilities}}", "{{/hasfacilities}}", facilityLabels.length > 0);
  html = applyLoopSection(
    html,
    "{{#facilities}}",
    "{{/facilities}}",
    facilityLabels,
    (loopTemplate, label) => loopTemplate.replaceAll("{{facility_displaytext}}", label),
  );

  // Reviews (optional — shows when review data exists on site payload)
  const reviews = (siteData as { reviews?: Array<Record<string, unknown>> }).reviews ?? [];
  const reviewList = Array.isArray(reviews) ? reviews : [];
  html = applyConditionalSection(html, "{{#hasreviews}}", "{{/hasreviews}}", reviewList.length > 0);
  html = applyLoopSection(
    html,
    "{{#reviews}}",
    "{{/reviews}}",
    reviewList,
    (loopTemplate, review) => {
      const rating = Number(review?.rating ?? 0);
      const stars =
        String(review?.rating_stars || "").trim() ||
        (Number.isFinite(rating) && rating > 0 ? "★".repeat(Math.min(5, Math.max(0, Math.round(rating)))) : "");
      return loopTemplate
        .replaceAll("{{rating_stars}}", stars)
        .replaceAll("{{comment}}", String(review?.comment || ""));
    },
  );

  // Remove any unhandled handlebars tags to avoid showing raw placeholders to users.
  html = html.replace(/\{\{#[^}]+\}\}/g, "");
  html = html.replace(/\{\{\/[^}]+\}\}/g, "");
  html = html.replace(/\{\{[^}]+\}\}/g, "");

  // Legacy templates may store absolute booking URLs — keep navigation on current subdomain.
  html = html.replace(
    /href=(["'])https?:\/\/[^"']*(\/book-appointment\/\d+\/\d+(?:\?[^"']*)?)\1/gi,
    'href=$1$2$1',
  );
  html = html.replace(
    /href=(["'])https?:\/\/[^"']*(\/user\/events\/\d+\/book)\1/gi,
    'href=$1$2$1',
  );
  html = html.replace(
    /href=(["'])https?:\/\/[^"']*(\/book\?[^"']*)\1/gi,
    'href=$1$2$1',
  );

  html = injectTemplateNavScript(html);

  html = injectContactFormSupport(
    html,
    organisationId,
    environment.baseurl || window.location.origin,
  );

  // Normalize file/image URLs to a stable absolute HTTPS endpoint.
  html = html.replace(/https?:\/\/[^"'\s>]*\/api\/Files\/Get\?id=(\d+)/g, (_m, id) => `${filesApiBaseUrl}/api/Files/Get?id=${id}`);
  html = html.replace(/(["'])\/api\/Files\/Get\?id=(\d+)\1/g, (_m, quote, id) => `${quote}${filesApiBaseUrl}/api/Files/Get?id=${id}${quote}`);

  // Image safety fallback: prevent broken/500 image requests from empty or unresolved ids.
  html = html.replace(/\/api\/Files\/Get\?id=\{\{[^}]+\}\}/g, fallbackImageUrl);
  html = html.replace(/\/api\/Files\/Get\?id=(?=["'\s>])/g, fallbackImageUrl);
  html = html.replace(/\/api\/Files\/Get\?id=0(?=["'\s>])/g, fallbackImageUrl);
  html = html.replace(/src=(['"])\s*\/api\/Files\/Get\?id=\s*\1/g, `src=$1${fallbackImageUrl}$1`);
  html = html.replace(/src=(['"])\s*\/api\/Files\/Get\?id=0\s*\1/g, `src=$1${fallbackImageUrl}$1`);
  html = html.replace(/src=(['"])\s*\{\{event_image_url\}\}\s*\1/g, `src=$1${fallbackImageUrl}$1`);

  return html;
};
