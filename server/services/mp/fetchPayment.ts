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

/**
 * HTTP error from Mercado Pago API with status code.
 * Allows handlers to check status === 404 instead of parsing error messages.
 */
export class MpHttpError extends Error {
  status: number;
  body?: string;

  constructor(status: number, message: string, body?: string) {
    super(message);
    this.name = 'MpHttpError';
    this.status = status;
    // Truncate body to max 500 chars and sanitize (no PII)
    this.body = body ? body.substring(0, 500).replace(/[^\x20-\x7E]/g, '') : undefined;
  }
}

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
    throw new MpHttpError(res.status, `Failed to fetch payment: ${res.status}`, errorText);
  }

  return (await res.json()) as MpPaymentPayload;
}
