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

/**
 * API origin from appointza-urls.json (`frontendApiBaseUrl`), set in main.tsx.
 * Empty = same-origin (Vite /api proxy in local, or API-hosted wwwroot in prod).
 */
function resolveApiBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const configured = stripSlash(String(window.__APPOINTZA_API_URL__ ?? "").trim());
  if (configured) return configured;
  return "";
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

/** Full Meta callback URL (API origin + WhatsAppWebhookController path). */
export function getWhatsAppWebhookCallbackUrl(): string {
  const api = getApiBaseUrl();
  const origin =
    api ||
    (typeof window !== "undefined" ? stripSlash(window.location.origin) : "");
  return `${origin}/api/webhooks/whatsapp`;
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
