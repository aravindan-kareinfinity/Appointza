import type { OnboardingStepId } from "@/components/onboarding/OrganizationOnboarding";
import type {
  OnboardingOfferingKey,
  OnboardingWizardStep,
} from "@/models/organisationOnboarding.model";
import type { CatalogOfferingKind } from "@/utils/organisationCatalogOfferings.util";

/** ReferenceValue type id for organisation website templates. */
export const ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID = 5;
/** Max website templates an organisation can save (excludes the hidden assets row). */
export const ORG_WEBSITE_TEMPLATE_MAX_PER_ORG = 2;

/** Legacy system default assigned on registration — not a user-created website. */
export const SYSTEM_DEFAULT_LOCATION_TEMPLATE_ID = 60;
/** Onboarding wizard hub (offerings → create items → website → timing). */
export const ORGANIZATION_ONBOARDING_WIZARD_ROUTE = "/organization/onboarding";

export const ORGANIZATION_ONBOARDING_ROUTES = [
  ORGANIZATION_ONBOARDING_WIZARD_ROUTE,
  "/organization/hospitality",
  "/organization/custom-domain",
  "/organization/services",
  "/organization/timing",
  "/organization/templates",
  "/organization/template-builder",
  "/register/business",
  "/register/location",
  "/register/offerings",
  "/register/create",
  "/register/website",
  "/register/domain",
  "/register/complete",
] as const;

export function isOrganizationOnboardingRoute(pathname: string): boolean {
  return ORGANIZATION_ONBOARDING_ROUTES.some((route) => pathname.startsWith(route));
}

/** Where template builder should return during setup vs after setup. */
export function organizationTemplatesRoute(isSetupComplete: boolean): string {
  return isSetupComplete
    ? "/organization/profile?tab=templates"
    : "/organization/templates";
}

export function locationNeedsWebsiteTemplate(templateid?: number | null): boolean {
  return !templateid || templateid <= 0;
}

/** True when the location points at a template this organisation owns (saved in builder). */
export function locationHasAssignedOrgTemplate(
  templateid: number | undefined | null,
  orgTemplateIds: ReadonlySet<number>,
): boolean {
  const id = templateid ?? 0;
  if (id <= 0) return false;
  if (id === SYSTEM_DEFAULT_LOCATION_TEMPLATE_ID && !orgTemplateIds.has(id)) {
    return false;
  }
  return orgTemplateIds.has(id);
}

export function orgHasWebsiteFromLocations(
  locations: { templateid?: number | null }[],
  orgTemplateIds: ReadonlySet<number>,
): boolean {
  return locations.some((loc) => locationHasAssignedOrgTemplate(loc.templateid, orgTemplateIds));
}

export function buildTemplateBuilderPath(locationId: number, templateId?: number): string {
  const params = new URLSearchParams();
  if (locationId > 0) params.set("locationId", String(locationId));
  if (templateId && templateId > 0) params.set("templateId", String(templateId));
  const query = params.toString();
  return `/organization/template-builder${query ? `?${query}` : ""}`;
}

const ONBOARDING_STEP_ROUTES: Record<OnboardingStepId, string> = {
  customDomain: "/organization/custom-domain",
  services: "/organization/services?kind=services",
  website: "/organization/templates",
  timing: "/organization/timing",
};

/** Route for an onboarding step; website opens the builder when locationId is known. */
export function onboardingStepRoute(step: OnboardingStepId, locationId?: number): string {
  if (step === "website" && locationId && locationId > 0) {
    return buildTemplateBuilderPath(locationId);
  }
  return ONBOARDING_STEP_ROUTES[step];
}

/** Real create route for each onboarding offering (null = nothing to create, e.g. "other"). */
export function onboardingOfferingCreateRoute(offering: OnboardingOfferingKey): string | null {
  switch (offering) {
    case "services":
      return "/organization/services?kind=services";
    case "events":
      return "/organization/services?kind=events";
    case "classes":
      return "/organization/services?kind=events";
    case "stay":
      return "/organization/hospitality?section=room-status";
    case "facilities":
      return "/organization/profile?tab=location";
    default:
      return null;
  }
}

/**
 * Onboarding offering → catalog nav kind. Navigation only — onboarding keys stay separate.
 * stay → rooms, classes → events; facilities/other have no catalog kind.
 */
export function onboardingOfferingToCatalogKind(
  offering: OnboardingOfferingKey,
): CatalogOfferingKind | null {
  if (offering === "stay") return "rooms";
  if (offering === "services") return "services";
  if (offering === "events" || offering === "classes") return "events";
  return null;
}

/** Route used when a wizard step needs the user to leave the hub (website / timing). */
export function onboardingWizardStepRoute(step: OnboardingWizardStep): string {
  switch (step) {
    case "website":
      return "/organization/templates";
    case "timing":
      return "/organization/timing";
    case "complete":
      return "/organization/dashboard";
    default:
      return ORGANIZATION_ONBOARDING_WIZARD_ROUTE;
  }
}

const onboardingCompleteCacheKey = (organisationId: number) =>
  `org-onboarding-complete-${organisationId}`;

/** Persisted flag — skip services/timing/template onboarding checks when true. */
export function readOnboardingCompleteCache(organisationId: number): boolean {
  if (organisationId <= 0) return false;
  try {
    return localStorage.getItem(onboardingCompleteCacheKey(organisationId)) === "true";
  } catch {
    return false;
  }
}

export function writeOnboardingCompleteCache(organisationId: number, complete: boolean): void {
  if (organisationId <= 0) return;
  try {
    if (complete) {
      localStorage.setItem(onboardingCompleteCacheKey(organisationId), "true");
    } else {
      localStorage.removeItem(onboardingCompleteCacheKey(organisationId));
    }
  } catch {
    // ignore storage errors
  }
}

export function clearOnboardingCompleteCache(organisationId: number): void {
  writeOnboardingCompleteCache(organisationId, false);
}
