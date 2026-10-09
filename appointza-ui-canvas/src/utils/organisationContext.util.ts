import { getStoredOrganisationId } from "@/utils/authSession.util";

/** Resolve the active organisation from auth state, with persisted context fallback. */
export function resolveOrganisationId(organisationIdFromUser?: number): number {
  if (organisationIdFromUser && organisationIdFromUser > 0) {
    return organisationIdFromUser;
  }
  return getStoredOrganisationId();
}
