// Single source of truth for URLs: public/appointza-urls.json.
//   - main.tsx fetches it before boot and sets window.__APPOINTZA_API_URL__ (frontendApiBaseUrl).
//   - vite.config.ts reads backendListen from it for the dev /api proxy.
//   - The .NET API reads the same file for its listen port.
// config.js only carries public browser keys (maps, push).
import { isOrganisationSubdomainHost } from "@/utils/orgPublicSiteUrl.util";

const PUBLIC_DOMAIN = "appointza.com";
const LOCAL_DEV_UI_ORIGIN = "http://localhost:8083";

declare global {
  interface Window {
    __APPOINTZA_API_URL__?: string;
    APP_CONFIG?: AppConfig;
  }
}

type AppConfig = {
  googleMapsApiKey?: string;
  vapidKey?: string;
  [key: string]: unknown;
};

const stripSlash = (url: string) => url.replace(/\/+$/, "");
const isLoopback = (url: string) => /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);

/** Dev: "" (relative /api through the Vite proxy). Prod: appointza-urls.json, else page origin. */
function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV || typeof window === "undefined") return "";
  const configured = stripSlash(String(window.__APPOINTZA_API_URL__ ?? "").trim());
  if (configured && !isLoopback(configured)) return configured;
  return window.location?.origin ?? "";
}

const getConfig = () => ({
  ...(typeof window !== "undefined" ? window.APP_CONFIG : undefined),
  baseurl: resolveApiBaseUrl(),
});

/** Always reads current runtime values. */
export const environment = new Proxy({} as ReturnType<typeof getConfig>, {
  get(_, prop: string) {
    return (getConfig() as Record<string, unknown>)[prop];
  },
});

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function getMarketingDomain(): string {
  return PUBLIC_DOMAIN;
}

export function getOrganisationPublicSiteDomain(): string {
  return PUBLIC_DOMAIN;
}

export function getDomainName(): string {
  return PUBLIC_DOMAIN;
}

/** UI origin for login / Google Sign-In — never an org subdomain. */
export function getUiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (!isOrganisationSubdomainHost(window.location.host)) {
      return window.location.origin;
    }
    const h = window.location.hostname.toLowerCase();
    if (h.endsWith(".localhost") || h === "localhost" || h === "127.0.0.1") {
      return LOCAL_DEV_UI_ORIGIN;
    }
  }
  return `https://${PUBLIC_DOMAIN}`;
}

export function getAppBaseUrl(): string {
  return getUiBaseUrl();
}

export function getAppDomain(): string {
  try {
    const hostname = new URL(getAppBaseUrl()).hostname.toLowerCase();
    return (hostname.startsWith("www.") ? hostname.slice(4) : hostname) || PUBLIC_DOMAIN;
  } catch {
    return PUBLIC_DOMAIN;
  }
}
