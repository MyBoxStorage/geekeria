/**
 * Serviços admin para operação manual Montink
 */

import { getJSON, postJSON } from './api';

export interface AdminOrderSummary {
  orderId: string;
  externalReference: string;
  status: string;
  createdAt: string;
  total: number;
  itemCount: number;
  shippingCity: string | null;
  shippingState: string | null;
  mpStatus: string | null;
  mpPaymentId: string | null;
  payerEmailMasked: string | null;
  riskScore: number | null;
  riskFlag: boolean;
  riskReasons: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AdminOrderListResponse {
  status: string;
  count: number;
  orders: AdminOrderSummary[];
}

export type AdminOrderExport = any;

export async function fetchAdminOrders(
  token: string,
  status = 'READY_FOR_MONTINK',
  limit = 50
): Promise<AdminOrderListResponse> {
  return getJSON<AdminOrderListResponse>(
    `/api/admin/orders?status=${encodeURIComponent(status)}&limit=${limit}`,
    {
      headers: {
        'x-admin-token': token,
      },
    }
  );
}

export async function exportAdminOrder(
  token: string,
  externalReference: string,
  includeCpf = false
): Promise<AdminOrderExport> {
  const query = includeCpf ? '?includeCpf=true' : '';
  return getJSON<AdminOrderExport>(
    `/api/admin/orders/${encodeURIComponent(externalReference)}/export${query}`,
    {
      headers: {
        'x-admin-token': token,
      },
    }
  );
}

export async function markMontinkAdmin(
  token: string,
  externalReference: string,
  payload: { montinkOrderId: string; montinkStatus: string }
): Promise<{
  success: boolean;
  message: string;
}> {
  return postJSON(`/api/orders/${encodeURIComponent(externalReference)}/mark-montink`, payload, {
    headers: {
      'x-admin-token': token,
    },
  });
}

