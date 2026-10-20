import type { OrganisationDetail } from "@/models/organisation.model";
import { getUiBaseUrl } from "@/utils/environment";
import {
  buildOrganisationPublicSiteUrl,
  buildOrganisationTemplateBookingUrl,
} from "@/utils/orgPublicSiteUrl.util";

export function organisationInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Public profile / book URL for marketing browse cards.
 * Prefer custom subdomain → published template GUID → direct book-appointment path.
 */
export function organisationPublicUrls(org: OrganisationDetail) {
  const subdomainUrl = buildOrganisationPublicSiteUrl({
    customUrl: org.organisationlocationcustomurl,
  });
  const templateUrl = buildOrganisationTemplateBookingUrl(
    org.organisationlocationorgloctempid,
  );
  const bookUrl =
    org.organisationid > 0 && org.organisationlocationid > 0
      ? `${getUiBaseUrl()}/book-appointment/${org.organisationid}/${org.organisationlocationid}`
      : "";

  const fullUrl = subdomainUrl || templateUrl || bookUrl || "";

  if (!fullUrl) {
    return { fullUrl: "", displayUrl: "Booking page not set up yet" };
  }

  try {
    const parsed = new URL(fullUrl);
    return {
      fullUrl,
      displayUrl: `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`,
    };
  } catch {
    return { fullUrl, displayUrl: fullUrl.replace(/^https?:\/\//, "") };
  }
}
