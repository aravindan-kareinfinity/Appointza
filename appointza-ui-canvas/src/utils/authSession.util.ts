/**
 * Single read path for the persisted login session.
 * Components should use these helpers instead of touching localStorage keys directly,
 * so the storage mechanism (localStorage today, HttpOnly cookie later) can change in one place.
 */

export const AUTH_TOKEN_KEY = "auth_token";
export const USER_CONTEXT_KEY = "user_context";

export type StoredUserContext = {
  userid?: number;
  usermobile?: string;
  organisationid?: number;
  organisationlocationid?: number;
  username?: string;
  useremail?: string;
  userimageid?: number;
  accesstoken?: string;
  refreshtoken?: string;
  [key: string]: unknown;
};

function safeGet(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getStoredUserContext(): StoredUserContext | null {
  const raw = safeGet(USER_CONTEXT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoredUserContext) : null;
  } catch {
    return null;
  }
}

/** Access token: prefers `user_context.accesstoken`, falls back to `auth_token`. */
export function getAuthToken(): string {
  const fromContext = getStoredUserContext()?.accesstoken;
  if (typeof fromContext === "string" && fromContext) return fromContext;
  return safeGet(AUTH_TOKEN_KEY) || "";
}

export function hasAuthSession(): boolean {
  return !!safeGet(AUTH_TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredOrganisationId(): number {
  const id = Number(getStoredUserContext()?.organisationid ?? 0);
  return Number.isFinite(id) && id > 0 ? id : 0;
}
