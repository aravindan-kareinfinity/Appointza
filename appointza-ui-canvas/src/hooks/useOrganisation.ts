import { useQuery } from '@tanstack/react-query';
import { Organisation, OrganisationSelectReq } from '@/models/organisation.model';
import { OrganisationService } from '@/services/organisation.service';

export const organisationQueryKey = (organisationId: number) =>
  ['organisation', organisationId] as const;

export async function fetchOrganisation(
  organisationId: number,
): Promise<Organisation | null> {
  if (organisationId <= 0) {
    return null;
  }

  const service = new OrganisationService();
  const req = new OrganisationSelectReq();
  req.id = organisationId;
  const response = await service.select(req);
  const org = response?.[0] ?? null;
  if (org) {
    // API often returns `attributes` object; keep attributes_json in sync for offering parsers.
    if (!org.attributes_json || org.attributes_json === "null" || org.attributes_json === "{}") {
      if (org.attributes && typeof org.attributes === "object") {
        org.attributes_json = JSON.stringify(org.attributes);
      } else {
        org.attributes_json = "{}";
      }
    }
  }
  return org;
}

export function useOrganisation(params: {
  organisationId: number;
  enabled?: boolean;
}) {
  const { organisationId, enabled = true } = params;

  return useQuery({
    queryKey: organisationQueryKey(organisationId),
    queryFn: () => fetchOrganisation(organisationId),
    enabled: enabled && organisationId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
