/**
 * GET /api/mp/payment/:paymentId
 *
 * Busca detalhes de um pagamento no Mercado Pago (server-side com MP_ACCESS_TOKEN).
 * Usado pela página CheckoutPending para exibir PIX QR/copia-e-cola quando não há dados no localStorage.
 * Nunca expõe o access token; retorna apenas status e transaction_details (qr_code, qr_code_base64).
 */

import { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { errorMeta } from '../../utils/logging.js';
import { sendError } from '../../utils/errorResponse.js';

export async function getPayment(req: Request, res: Response) {
  const raw = req.params.paymentId;
  const paymentId = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() ?? '' : '';
  if (!paymentId) {
    return sendError(res, req, 400, 'MISSING_PAYMENT_ID', 'paymentId is required');
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    logger.error('MP_ACCESS_TOKEN not set');
    return sendError(res, req, 500, 'SERVER_CONFIG_ERROR', 'Mercado Pago access token not configured');
  }

  try {
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const mpData = (await mpResponse.json()) as any;

    if (!mpResponse.ok) {
      logger.warn('MP get payment failed', {
        paymentId,
        status: mpResponse.status,
        mpError: mpData?.error,
        mpMessage: mpData?.message,
      });

      // Keep status mapping: MP 5xx -> 502, MP 4xx -> 400
      const proxyStatus = mpResponse.status >= 500 ? 502 : 400;
      return sendError(res, req, proxyStatus, 'MP_GET_PAYMENT_FAILED', 'Falha ao buscar pagamento no Mercado Pago', { mpStatus: mpResponse.status });
    }

    // Extrair PIX do point_of_interaction.transaction_data (mesmo formato usado em create-payment)
    let transaction_details: { qr_code?: string; qr_code_base64?: string } | null = null;
    const poi = mpData.point_of_interaction;
    if (poi?.transaction_data) {
      const td = poi.transaction_data;
      if (td.qr_code || td.qr_code_base64) {
        transaction_details = {
          qr_code: td.qr_code ?? undefined,
          qr_code_base64: td.qr_code_base64 ?? undefined,
        };
      }
    }

    // Fallback: some responses can include PIX fields under transaction_details (rare but safe)
    if (!transaction_details && mpData?.transaction_details) {
      const td2 = mpData.transaction_details;
      if (td2.qr_code || td2.qr_code_base64) {
        transaction_details = {
          qr_code: td2.qr_code ?? undefined,
          qr_code_base64: td2.qr_code_base64 ?? undefined,
        };
      }
    }

    return res.json({
      ok: true,
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail ?? null,
      payment_method_id: mpData.payment_method_id ?? null,
      external_reference: mpData.external_reference ?? null,
      transaction_details,
    });
  } catch (err) {
    logger.error('getPayment error:', errorMeta(err));
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar pagamento');
  }
}
