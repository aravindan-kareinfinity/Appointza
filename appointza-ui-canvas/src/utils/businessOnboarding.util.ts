export const BUSINESS_ONBOARDING_RETURN_PATH = "/register/business";
export const BUSINESS_LOCATION_PATH = "/register/location";
export const BUSINESS_OFFERINGS_PATH = "/register/offerings";
export const BUSINESS_CREATE_PATH = "/register/create";
export const BUSINESS_WEBSITE_PATH = "/register/website";
export const BUSINESS_DOMAIN_PATH = "/register/domain";
export const BUSINESS_TIMING_PATH = "/organization/timing";
export const BUSINESS_COMPLETE_PATH = "/register/complete";
export const BUSINESS_ONBOARDING_TOTAL_STEPS = 9;

const PENDING_KEY = "appointza_pending_business_onboarding";
const PLAN_KEY = "appointza_register_plan_code";
const PROFILE_DRAFT_KEY = "appointza_business_profile_draft";
const STEP_KEY = "appointza_business_onboarding_step";
/** When set, org create pages should return here after save (clean URLs, no ?onboarding=). */
const CREATE_RETURN_KEY = "appointza_register_create_return";
const CREATE_OFFERING_KEY = "appointza_register_create_offering";

export type BusinessOnboardingStep =
  | "account"
  | "profile"
  | "location"
  | "offerings"
  | "create_items"
  | "website"
  | "domain"
  | "complete";

export function markPendingBusinessOnboarding(): void {
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
    sessionStorage.setItem(STEP_KEY, "profile");
  } catch {
    // ignore
  }
}

export function clearPendingBusinessOnboarding(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
    sessionStorage.removeItem(STEP_KEY);
    sessionStorage.removeItem(PROFILE_DRAFT_KEY);
    sessionStorage.removeItem(CREATE_RETURN_KEY);
    sessionStorage.removeItem(CREATE_OFFERING_KEY);
  } catch {
    // ignore
  }
}

/** Stash return path so create screens can use clean URLs (e.g. /organization/services?kind=services). */
export function stashRegisterCreateReturn(
  path: string = BUSINESS_CREATE_PATH,
  offering?: string,
): void {
  try {
    sessionStorage.setItem(CREATE_RETURN_KEY, path.startsWith("/") ? path : BUSINESS_CREATE_PATH);
    if (offering) {
      sessionStorage.setItem(CREATE_OFFERING_KEY, offering);
    } else {
      sessionStorage.removeItem(CREATE_OFFERING_KEY);
    }
  } catch {
    // ignore
  }
}

export function readRegisterCreateReturn(): string | null {
  try {
    const raw = sessionStorage.getItem(CREATE_RETURN_KEY);
    return raw && raw.startsWith("/") ? raw : null;
  } catch {
    return null;
  }
}

export function readRegisterCreateOffering(): string | null {
  try {
    return sessionStorage.getItem(CREATE_OFFERING_KEY);
  } catch {
    return null;
  }
}

export function clearRegisterCreateReturn(): void {
  try {
    sessionStorage.removeItem(CREATE_RETURN_KEY);
    sessionStorage.removeItem(CREATE_OFFERING_KEY);
  } catch {
    // ignore
  }
}

export function isRegisterCreateFlow(): boolean {
  return !!readRegisterCreateReturn();
}

/** Guided business signup steps that use the org shell + setup sidebar. */
export function isRegisterOnboardingPath(pathname: string): boolean {
  return (
    pathname.startsWith("/register/business") ||
    pathname.startsWith("/register/location") ||
    pathname.startsWith("/register/offerings") ||
    pathname.startsWith("/register/create") ||
    pathname.startsWith("/register/website") ||
    pathname.startsWith("/register/domain") ||
    pathname.startsWith("/register/complete")
  );
}

export function isPendingBusinessOnboarding(): boolean {
  try {
    return sessionStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function setBusinessOnboardingStep(step: BusinessOnboardingStep): void {
  try {
    sessionStorage.setItem(STEP_KEY, step);
  } catch {
    // ignore
  }
}

export function getBusinessOnboardingStep(): BusinessOnboardingStep {
  try {
    return (sessionStorage.getItem(STEP_KEY) as BusinessOnboardingStep) || "profile";
  } catch {
    return "profile";
  }
}

/** Map backend wizard step → register Screen route (Screens 4–7). */
export function businessOnboardingRouteForStep(
  step: string | null | undefined,
): string {
  switch ((step || "").toLowerCase()) {
    case "offerings":
      return BUSINESS_OFFERINGS_PATH;
    case "create_items":
      return BUSINESS_CREATE_PATH;
    case "website":
      return BUSINESS_WEBSITE_PATH;
    case "domain":
      return BUSINESS_DOMAIN_PATH;
    case "timing":
      return BUSINESS_TIMING_PATH;
    case "complete":
      return BUSINESS_COMPLETE_PATH;
    default:
      return BUSINESS_OFFERINGS_PATH;
  }
}

export function stashRegisterPlanCode(plan: string): void {
  try {
    sessionStorage.setItem(PLAN_KEY, plan || "free");
  } catch {
    // ignore
  }
}

export function readRegisterPlanCode(): string {
  try {
    return sessionStorage.getItem(PLAN_KEY) || "free";
  } catch {
    return "free";
  }
}

export type BusinessProfileDraft = {
  orgName: string;
  gst: string;
  referral: string;
  primarytype: number;
  primarytypecode: string;
  secondarytype: number;
  secondarytypecode: string;
  organisationlogo: number;
  logoPreview?: string | null;
};

export function saveBusinessProfileDraft(draft: BusinessProfileDraft): void {
  try {
    sessionStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function readBusinessProfileDraft(): BusinessProfileDraft | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BusinessProfileDraft;
  } catch {
    return null;
  }
}

/** Indian GSTIN — 15 characters. Empty string is valid (optional field). */
export function isValidGstin(value: string): boolean {
  const gst = value.trim().toUpperCase();
  if (!gst) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
}

export function isAllowedLogoFile(file: File): { ok: boolean; message?: string } {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (!allowed.includes(file.type)) {
    return { ok: false, message: "Logo must be a JPG, PNG or GIF file." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, message: "Logo must be 2 MB or less." };
  }
  return { ok: true };
}

export function isDraftOrganisationName(name?: string | null): boolean {
  return String(name || "").trim().startsWith("Pending setup");
}

export function isOrganizationUserContext(ctx: {
  organisationid?: number | null;
}): boolean {
  return (Number(ctx?.organisationid) || 0) > 0;
}

/**
 * After Google / session restore: send org users to the matching onboarding
 * screen (draft → profile, no location → location, else wizard hub).
 */
export function resolveOrganizationAuthPath(
  ctx: {
    organisationid?: number | null;
    organisationname?: string | null;
    organisationlocationid?: number | null;
    locationid?: number | null;
  },
  preferredFrom?: string,
): string {
  if (isPendingBusinessOnboarding() || isDraftOrganisationName(ctx.organisationname)) {
    return BUSINESS_ONBOARDING_RETURN_PATH;
  }

  const orgId = Number(ctx.organisationid) || 0;
  if (orgId <= 0) {
    return (preferredFrom || "").trim() || "/explore";
  }

  const locId =
    Number(ctx.organisationlocationid) || Number(ctx.locationid) || 0;
  if (locId <= 0) {
    return BUSINESS_LOCATION_PATH;
  }

  const from = (preferredFrom || "").trim();
  if (
    from &&
    from !== "/" &&
    from !== "/login" &&
    from !== "/register" &&
    from !== "/otp" &&
    !from.startsWith("http://") &&
    !from.startsWith("https://")
  ) {
    return from.startsWith("/") ? from : `/${from}`;
  }

  // Wizard hub forwards to create / website / complete or dashboard.
  return "/organization/onboarding";
}

/** Detect backend GoogleLogin / auth "no user for this email" responses. */
export function isUsersNotFoundAuthError(error: unknown): boolean {
  const err = error as {
    response?: { data?: { key?: string; error?: string; message?: string } };
    message?: string;
  };
  const data = err?.response?.data;
  const key = String(data?.key || "");
  const msg = String(data?.message || data?.error || err?.message || "");
  return (
    key === "UsersNotFound" ||
    key === "UserNotFound" ||
    msg.includes("UsersNotFound") ||
    /no account found for this google/i.test(msg)
  );
}
