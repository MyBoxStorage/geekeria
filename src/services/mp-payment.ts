/**
 * Serviço para buscar detalhes de pagamento no backend (Mercado Pago).
 * Usado por CheckoutPending quando não há dados PIX no localStorage.
 * Retorna ok + status para tratamento de 429 e outros erros.
 */

import { apiConfig } from '@/config/api';

export interface MpPaymentResponse {
  ok: boolean;
  status?: number;
  id?: number | string;
  status_detail?: string | null;
  payment_method_id?: string | null;
  external_reference?: string | null;
  transaction_details?: {
    qr_code?: string;
    qr_code_base64?: string;
  } | null;
  error?: string;
  message?: string;
}

/**
 * Busca detalhes de um pagamento no Mercado Pago via backend.
 * Não engole status HTTP: retorna { ok, status, ...data } para o cliente tratar 429 etc.
 */
export async function getPaymentDetails(paymentId: string): Promise<MpPaymentResponse> {
  const r = await fetch(`${apiConfig.baseURL}/api/mp/payment/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await r.json().catch(() => null);

  if (!r.ok) {
    return { ok: false, status: r.status, ...(data || {}) };
  }
  return { ok: true, status: r.status, ...(data || {}) };
}
