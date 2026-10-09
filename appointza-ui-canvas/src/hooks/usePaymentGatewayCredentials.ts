import { useQuery } from '@tanstack/react-query';
import { environment } from '@/utils/environment';
import { getAuthHeaders } from '@/utils/authSession.util';

export type PaymentGatewayCredential = {
  id: number;
  gateway_id: number;
  organization_id: number;
  gateway_name: string;
  api_key: string;
  api_secret: string;
  upi_id?: string;
  webhook_secret?: string;
  environment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const paymentCredentialsQueryKey = (organisationId: number) =>
  ['payment-credentials', organisationId] as const;

export async function fetchPaymentGatewayCredentials(
  organisationId: number,
): Promise<PaymentGatewayCredential[]> {
  if (organisationId <= 0) {
    return [];
  }

  const response = await fetch(`${environment.baseurl}/api/PaymentGatewayCredentials/Select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      item: {
        organization_id: organisationId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to load payment credentials');
  }

  const result = await response.json();
  return result.item ?? [];
}

export function usePaymentGatewayCredentials(params: {
  organisationId: number;
  enabled?: boolean;
}) {
  const { organisationId, enabled = true } = params;

  return useQuery({
    queryKey: paymentCredentialsQueryKey(organisationId),
    queryFn: () => fetchPaymentGatewayCredentials(organisationId),
    enabled: enabled && organisationId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
