import type { NavigateFunction } from "react-router-dom";
import { getUiBaseUrl } from "@/utils/environment";
import { resolvePostLoginPath } from "@/utils/postAuthNavigation";
import { isOrganisationSubdomainHost } from "@/utils/orgPublicSiteUrl.util";
import { hydrateAuthFromSharedCookie } from "@/utils/authStorage.util";
import { hasAuthSession } from "@/utils/authSession.util";

declare global {
  interface Window {
    __APPOINTZA_MAIN_ORIGIN__?: string;
  }
}

export const AUTH_RETURN_STORAGE_KEY = "appointza_auth_return";
const AUTH_RETURN_COOKIE = "appointza_auth_return";
const AUTH_RETURN_WINDOW_PREFIX = "appointza_return:";

/** Marketing / auth host — never an org subdomain (e.g. always localhost:8083 in dev). */
export function getMainAppOrigin(): string {
  if (typeof window !== "undefined" && window.__APPOINTZA_MAIN_ORIGIN__) {
    try {
      const published = new URL(window.__APPOINTZA_MAIN_ORIGIN__);
      if (!isOrganisationSubdomainHost(published.host)) {
        return published.origin;
      }
    } catch {
      // fall through
    }
  }
  return getUiBaseUrl();
}

export function publishMainAppOrigin(): void {
  if (typeof window !== "undefined") {
    window.__APPOINTZA_MAIN_ORIGIN__ = getUiBaseUrl();
  }
}

export function isOrgSubdomainHost(host: string = window.location.host): boolean {
  return isOrganisationSubdomainHost(host);
}

/** Auth pages must run on main UI host, not org *.localhost / *.appointza.com. */
export function mustUseMainAppForAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const mainHost = new URL(getMainAppOrigin()).host;
    return mainHost !== window.location.host;
  } catch {
    return isOrgSubdomainHost();
  }
}

export function isUserLoggedIn(): boolean {
  hydrateAuthFromSharedCookie();
  return hasAuthSession();
}

/** Current page path for login return (pathname + search + hash). */
export function getCurrentAppPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Service / event booking must always return to the main app host after login.
 * Auth tokens live in main-app localStorage and are not shared with org subdomains
 * (e.g. awonderonesurprise.appointza.com ≠ appointza.com).
 */
export function isMainAppBookingPath(pathOrUrl: string): boolean {
  try {
    const parsed =
      pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")
        ? new URL(pathOrUrl)
        : new URL(pathOrUrl, "https://appointza.local");
    const path = parsed.pathname;
    return (
      path === "/book" ||
      path.includes("/book-appointment/") ||
      path.includes("/user/events/")
    );
  } catch {
    return (
      pathOrUrl.includes("/book?") ||
      pathOrUrl.endsWith("/book") ||
      pathOrUrl.includes("/book-appointment/") ||
      pathOrUrl.includes("/user/events/")
    );
  }
}

/** Path + search + hash only (no origin) — keeps login URLs clean. */
export function toRelativeAppPath(pathOrUrl: string): string {
  const raw = (pathOrUrl || "").trim();
  if (!raw) return "/";
  try {
    const parsed =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? new URL(raw)
        : new URL(raw.startsWith("/") ? raw : `/${raw}`, "https://appointza.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

/** Rewrite any booking URL/path onto the main app origin (keeps query + hash). */
export function toMainAppBookingUrl(pathOrUrl: string): string {
  const path = toRelativeAppPath(pathOrUrl);
  return `${getMainAppOrigin()}${path}`;
}

function canUseAppointzaReturnCookie(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "appointza.com" || host.endsWith(".appointza.com");
}

function writeReturnCookie(relativePath: string): void {
  if (typeof document === "undefined" || !canUseAppointzaReturnCookie()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${encodeURIComponent(AUTH_RETURN_COOKIE)}=${encodeURIComponent(relativePath)}` +
    `; Path=/; Domain=.appointza.com; Max-Age=600; SameSite=Lax${secure}`;
}

function readReturnCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(AUTH_RETURN_COOKIE)}=`;
  for (const part of document.cookie.split("; ")) {
    if (!part.startsWith(prefix)) continue;
    try {
      return decodeURIComponent(part.slice(prefix.length));
    } catch {
      return part.slice(prefix.length);
    }
  }
  return null;
}

function clearReturnCookie(): void {
  if (typeof document === "undefined" || !canUseAppointzaReturnCookie()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${encodeURIComponent(AUTH_RETURN_COOKIE)}=; Path=/; Domain=.appointza.com; Max-Age=0; SameSite=Lax${secure}`;
}

/**
 * Canonical post-login destination.
 * Booking paths are always relative main-app routes (never org subdomain absolute URLs).
 */
export function buildLoginReturnValue(returnPath: string): string {
  const raw = (returnPath || "").trim();
  if (!raw) {
    const current = getCurrentAppPath();
    if (isMainAppBookingPath(current)) return toRelativeAppPath(current);
    if (isOrgSubdomainHost()) return "/";
    return current;
  }

  if (isMainAppBookingPath(raw)) {
    return toRelativeAppPath(raw);
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      return `${u.pathname}${u.search}${u.hash}` || "/";
    } catch {
      return "/";
    }
  }

  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Remember where to send the user after login (keeps `/login` URL clean). */
export function stashAuthReturnPath(returnPath?: string): void {
  const value = buildLoginReturnValue(returnPath || getCurrentAppPath());
  if (!value || value === "/") return;

  try {
    sessionStorage.setItem(AUTH_RETURN_STORAGE_KEY, value);
  } catch {
    // ignore private mode / blocked storage
  }

  // Cross-subdomain: sessionStorage on awonderonesurprise.appointza.com is not
  // visible on appointza.com — mirror onto a shared cookie + window.name.
  writeReturnCookie(value);
  try {
    window.name = `${AUTH_RETURN_WINDOW_PREFIX}${value}`;
  } catch {
    // ignore
  }
}

/** Always plain main-app `/login` — never put return URLs in the query string. */
export function getMainAppLoginUrl(_returnPath?: string): string {
  return `${getMainAppOrigin()}/login`;
}

export function getMainAppAuthUrl(path: string): string {
  const normalized = toRelativeAppPath(path);
  return `${getMainAppOrigin()}${normalized}`;
}

function consumeWindowNameReturn(): string {
  try {
    const raw = window.name || "";
    if (!raw.startsWith(AUTH_RETURN_WINDOW_PREFIX)) return "";
    const value = raw.slice(AUTH_RETURN_WINDOW_PREFIX.length);
    window.name = "";
    return value;
  } catch {
    return "";
  }
}

/** Read return path after login: cookie / sessionStorage / window.name, then legacy query. */
export function resolveLoginReturnPath(location: {
  search: string;
  state?: { from?: string | { pathname?: string } };
}): string {
  let stored = "";
  try {
    stored = sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY) || "";
  } catch {
    // ignore
  }

  if (!stored) {
    stored = readReturnCookie() || "";
  }

  if (!stored) {
    stored = consumeWindowNameReturn();
  }

  if (stored) {
    try {
      sessionStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
    } catch {
      // ignore
    }
    clearReturnCookie();
    return buildLoginReturnValue(stored);
  }

  const fromQuery = new URLSearchParams(location.search).get("from") || "";
  const fromState = location.state?.from;
  const fromStatePath =
    typeof fromState === "string" ? fromState : fromState?.pathname || "";

  const legacy = fromQuery || fromStatePath || "/";
  return buildLoginReturnValue(legacy);
}

/** Go to main-app `/login` only (return path stashed in cookie/sessionStorage). */
export function redirectToLogin(returnPath?: string, _navigate?: NavigateFunction): void {
  stashAuthReturnPath(returnPath);
  window.location.href = getMainAppLoginUrl();
}

export function completeAuthNavigation(
  navigate: NavigateFunction,
  userType: "user" | "organization",
  from?: string,
): void {
  const rawTarget = resolvePostLoginPath(userType, from);
  const relative = toRelativeAppPath(rawTarget);
  const target = isMainAppBookingPath(relative)
    ? toMainAppBookingUrl(relative)
    : rawTarget.startsWith("http://") || rawTarget.startsWith("https://")
      ? rawTarget
      : relative;

  try {
    sessionStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
  } catch {
    // ignore
  }
  clearReturnCookie();

  if (target.startsWith("http://") || target.startsWith("https://")) {
    window.location.replace(target);
    return;
  }
  navigate(target, { replace: true });
}
