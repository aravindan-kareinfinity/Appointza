import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ClientsSelectReq, ClientInfoRes } from '@/models/appoinment.model';
import { AppoinmentService } from '@/services/appoinment.service';

export const CLIENT_PAGE_SIZE = 80;

export const organisationClientsQueryKey = (
  organisationId: number,
  organisationLocationId: number,
  search: string,
) => ['organisation-clients', organisationId, organisationLocationId, search] as const;

export async function fetchOrganisationClients(
  organisationId: number,
  organisationLocationId: number,
  search = '',
  skip = 0,
  take = CLIENT_PAGE_SIZE,
): Promise<ClientInfoRes[]> {
  if (!organisationId) return [];

  const appointmentService = new AppoinmentService();
  const req = new ClientsSelectReq();
  req.organisationid = organisationId;
  req.organisationlocationid = organisationLocationId;
  req.mobilenumber = search;
  req.include_room_customers = true;
  req.skip = skip;
  req.take = take;

  const rows = (await appointmentService.SelectUniqueClients(req)) ?? [];
  // Defensive client-side dedupe (userid, then normalized phone).
  const byUser = new Map<number, (typeof rows)[number]>();
  const phoneToUser = new Map<string, number>();
  for (const row of rows) {
    const userId = Number(row.userid);
    if (userId > 0 && byUser.has(userId)) continue;
    const phone = String(row.mobile || "").replace(/\D/g, "");
    if (phone && phoneToUser.has(phone)) continue;
    if (userId > 0) {
      byUser.set(userId, row);
      if (phone) phoneToUser.set(phone, userId);
    } else if (userId < 0) {
      // Room-only guests keep negative ids; skip phone collide with real users.
      if (phone && phoneToUser.has(phone)) continue;
      byUser.set(userId, row);
      if (phone) phoneToUser.set(phone, userId);
    }
  }
  return Array.from(byUser.values());
}

export function useOrganisationClients(params: {
  organisationId: number;
  organisationLocationId: number;
  search?: string;
  enabled?: boolean;
}) {
  const { organisationId, organisationLocationId, search = '', enabled = true } = params;

  return useInfiniteQuery({
    queryKey: organisationClientsQueryKey(organisationId, organisationLocationId, search),
    queryFn: ({ pageParam }) =>
      fetchOrganisationClients(
        organisationId,
        organisationLocationId,
        search,
        pageParam,
        CLIENT_PAGE_SIZE,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < CLIENT_PAGE_SIZE ? undefined : allPages.length * CLIENT_PAGE_SIZE,
    enabled: enabled && organisationId > 0,
    staleTime: 30_000,
  });
}

export function useInvalidateOrganisationClients() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['organisation-clients'] });
}
