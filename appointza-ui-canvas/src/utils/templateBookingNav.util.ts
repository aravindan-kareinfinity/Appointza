import type { NavigateFunction } from "react-router-dom";
import {
  getMainAppAuthUrl,
  isOrgSubdomainHost,
  isUserLoggedIn,
  redirectToLogin,
  toRelativeAppPath,
} from "@/utils/authNavigation.util";

/** Turn template booking href into a path (pathname + search + hash). */
export function resolveTemplateBookingPath(href: string): string {
  return toRelativeAppPath(href);
}

/** Booking from org subdomain always opens on the main app host (e.g. localhost:8083). */
export function resolveMainAppBookingUrl(href: string): string {
  const path = resolveTemplateBookingPath(href);
  if (!path || path === "/") return "";
  return getMainAppAuthUrl(path);
}

/** Hospitality stay booking (`/book?...`). */
export function isGuestHospitalityBookPath(hrefOrPath: string): boolean {
  const raw = (hrefOrPath || "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw, "https://appointza.local");
    return parsed.pathname === "/book" || parsed.pathname.endsWith("/book");
  } catch {
    return raw === "/book" || raw.startsWith("/book?") || raw.includes("/book?");
  }
}

/**
 * Book now from org website → main app booking page.
 * Flow:
 * - Already logged in → open main-app booking path
 * - Guest → plain main-app /login (return path stashed; no ?from= clutter)
 */
export function navigateToTemplateBooking(href: string, navigate: NavigateFunction): void {
  const path = resolveTemplateBookingPath(href);
  if (!path || path === "/") return;

  const onOrgSite = isOrgSubdomainHost();
  const target = onOrgSite ? resolveMainAppBookingUrl(href) : path;

  if (isUserLoggedIn()) {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.location.href = target;
      return;
    }
    navigate(target);
    return;
  }

  // Always stash relative booking path → redirect to plain /login
  redirectToLogin(path);
}

export function buildBookAppointmentPath(
  organisationId: number,
  locationId: number,
  serviceId?: number,
): string {
  const base = `/book-appointment/${organisationId}/${locationId}`;
  if (serviceId && serviceId > 0) {
    return `${base}?serviceId=${serviceId}`;
  }
  return base;
}

export function buildRoomBookPath(
  organisationId: number,
  locationId: number,
  roomCode: string,
  options?: { checkIn?: string; checkOut?: string; packageId?: string },
): string {
  const params = new URLSearchParams();
  params.set("roomId", roomCode);
  params.set("organisationId", String(organisationId));
  params.set("locationId", String(locationId));
  if (options?.checkIn) params.set("checkIn", options.checkIn);
  if (options?.checkOut) params.set("checkOut", options.checkOut);
  if (options?.packageId) params.set("packageId", options.packageId);
  return `/book?${params.toString()}`;
}

export function buildPackageBookPath(
  organisationId: number,
  locationId: number,
  packageId: string,
): string {
  const params = new URLSearchParams();
  params.set("packageId", packageId);
  params.set("organisationId", String(organisationId));
  params.set("locationId", String(locationId));
  return `/book?${params.toString()}`;
}

const MAIN_APP_ORIGIN_RESOLVER = `
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
function appointzaStashReturnPath(path) {
  try { sessionStorage.setItem('appointza_auth_return', path); } catch (_) {}
  try { window.name = 'appointza_return:' + path; } catch (_) {}
  try {
    var host = (window.location.hostname || '').toLowerCase();
    if (host === 'appointza.com' || (host.length > 14 && host.slice(-14) === '.appointza.com')) {
      var secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = 'appointza_auth_return=' + encodeURIComponent(path) +
        '; Path=/; Domain=.appointza.com; Max-Age=600; SameSite=Lax' + secure;
    }
  } catch (_) {}
}`;

/** Parent window handler for template iframe postMessage (booking + app chrome). */
export function handleTemplateFrameMessage(
  event: MessageEvent,
  navigate: NavigateFunction,
): void {
  if (!event.data || typeof event.data !== "object") return;

  if (event.data.type === "appointza:login-required") {
    const returnUrl: string = event.data.returnUrl || "";
    if (returnUrl) {
      try {
        sessionStorage.setItem("appointza_auth_return", returnUrl);
      } catch {
        // ignore
      }
    }
    redirectToLogin(returnUrl);
    return;
  }

  const url: string = typeof event.data.url === "string" ? event.data.url : "";
  if (!url) return;

  if (event.data.type === "appointza:booking-nav") {
    navigateToTemplateBooking(url, navigate);
    return;
  }

  if (event.data.type === "appointza:app-nav") {
    if (url.startsWith("/template/")) return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.location.href = url;
      return;
    }
    navigate(url);
  }
}

/** If the srcDoc iframe loads the SPA (e.g. /explore), move that route onto the parent URL. */
export function syncParentFromTemplateIframe(
  iframe: HTMLIFrameElement | null,
  navigate: NavigateFunction,
): void {
  if (!iframe?.contentWindow) return;
  try {
    const loc = iframe.contentWindow.location;
    const href = loc.href || "";
    if (!href || href === "about:srcdoc" || href.startsWith("about:")) return;
    const path = `${loc.pathname}${loc.search}${loc.hash}`;
    if (!path || path.startsWith("/template/")) return;
    navigate(path);
  } catch {
    // cross-origin
  }
}

export function stripInjectedTemplateNavScripts(html: string): string {
  return html
    .replace(/<script>[\s\S]*?MAIN_APP_ORIGIN[\s\S]*?<\/script>/gi, "")
    .replace(/<script>[\s\S]*?appointzaResolveMainAppOrigin[\s\S]*?<\/script>/gi, "")
    .replace(/<script>[\s\S]*?appointza:booking-nav[\s\S]*?<\/script>/gi, "")
    .replace(/<script>[\s\S]*?appointza:app-nav[\s\S]*?<\/script>/gi, "");
}

export function injectTemplateNavScript(html: string): string {
  const cleaned = stripInjectedTemplateNavScripts(html);
  const bookingNavScript = `
<script>
${buildTemplateBookingClickScript()}
</script>`;
  if (cleaned.indexOf("</body>") !== -1) {
    return cleaned.replace("</body>", bookingNavScript + "\n</body>");
  }
  return cleaned + bookingNavScript;
}

/** Script injected into published template HTML — resolves login host at click time (not baked). */
export function buildTemplateBookingClickScript(): string {
  return `
(function () {
${MAIN_APP_ORIGIN_RESOLVER}
  function isGuestHospitalityBook(href) {
    try {
      var u = new URL(href, window.location.href);
      return u.pathname === '/book';
    } catch (_) {
      return href.indexOf('/book?') !== -1 || href === '/book';
    }
  }
  function toPath(href) {
    try {
      var u = new URL(href, window.location.href);
      return u.pathname + u.search + u.hash;
    } catch (_) {
      return href.indexOf('/') === 0 ? href : '/' + href;
    }
  }
  function isHashOrScheme(href) {
    if (!href) return true;
    var t = href.trim();
    if (t.charAt(0) === '#') return true;
    if (/^(mailto:|tel:|sms:|javascript:)/i.test(t)) return true;
    return false;
  }
  function isBookingPath(path) {
    var pathname = path.split('?')[0].split('#')[0];
    return pathname === '/book' ||
      pathname.indexOf('/book-appointment/') === 0 ||
      /\\/user\\/events\\/\\d+\\/book$/.test(pathname);
  }
  function postParent(type, path) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: type, url: path }, '*');
      return true;
    }
    return false;
  }
  function openBooking(path) {
    var mainOrigin = appointzaResolveMainAppOrigin();
    var bookingUrl = mainOrigin + path;
    if (postParent('appointza:booking-nav', path)) return;
    var token = null;
    try { token = localStorage.getItem('auth_token'); } catch (_) {}
    if (!token) {
      try {
        var shared = document.cookie.split('; ').find(function (c) {
          return c.indexOf('appointza_auth_v1=') === 0;
        });
        if (shared) token = 'cookie';
      } catch (_) {}
    }
    if (!token) {
      appointzaStashReturnPath(path);
      window.location.href = mainOrigin + '/login';
      return;
    }
    window.location.href = bookingUrl;
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    if (isHashOrScheme(href)) return;
    var path = toPath(href);
    var originOk = true;
    try {
      var parsed = new URL(href, window.location.href);
      var here = window.location.origin;
      originOk = parsed.origin === here || here === 'null' || parsed.origin === 'null';
      if (!originOk && window.parent && window.parent !== window) {
        try { originOk = parsed.origin === window.parent.location.origin; } catch (_) {}
      }
      if (!originOk) return;
    } catch (_) {}
    var pathname = path.split('?')[0].split('#')[0];
    if (pathname === '/' || pathname === '' || pathname.indexOf('/template/') === 0) {
      e.preventDefault();
      e.stopPropagation();
      var hash = path.indexOf('#') >= 0 ? path.split('#')[1] : '';
      if (hash) {
        var target = document.getElementById(hash);
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (isBookingPath(path) || isGuestHospitalityBook(href)) {
      openBooking(path);
      return;
    }
    postParent('appointza:app-nav', path);
  }, true);
})();
`;
}
