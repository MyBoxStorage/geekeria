/**
 * Fetches a payment from Mercado Pago by ID.
 * Reused by webhook processing and reconcile-pending; uses MP_ACCESS_TOKEN.
 */

import { logger } from '../../utils/logger.js';

export type MpPaymentPayload = {
  id?: string | number;
  status?: string;
  external_reference?: string;
  [key: string]: unknown;
};

export async function fetchMpPayment(paymentId: string): Promise<MpPaymentPayload> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN not set');
  }

  const url = `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.warn(`MP fetch payment failed: paymentId=${paymentId}, status=${res.status}`);
    throw new Error(`Failed to fetch payment: ${res.status}`);
  }

  return (await res.json()) as MpPaymentPayload;
}
