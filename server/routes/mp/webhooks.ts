/**
 * POST /api/mp/webhooks
 *
 * Recebe notificações do Mercado Pago sobre mudanças de status de pagamento
 *
 * - Valida assinatura x-signature (HMAC SHA256) com MP_WEBHOOK_SECRET
 * - Implementa idempotência via tabela WebhookEvent (DB) para evitar processamento duplicado
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendError } from '../../utils/errorResponse.js';
import { fetchMpPayment, MpHttpError } from '../../services/mp/fetchPayment.js';
import { mapMpStatusToOrderStatus } from '../../services/mp/statusMapper.js';
import { sendOrderConfirmationEmail } from '../../utils/email.js';

/**
 * Valida assinatura do webhook conforme documentação Mercado Pago.
 *
 * IMPORTANTE — esquema de assinatura do MP:
 * O MP **NÃO** assina o body do request. Ele assina um "manifest" construído
 * a partir de metadados: data.id (query/body), x-request-id (header) e
 * timestamp (ts, extraído do próprio header x-signature).
 *
 * Formato do header:
 *   x-signature: ts=<timestamp>,v1=<hmac_hex>
 *
 * Manifest (string para HMAC):
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * Algoritmo: HMAC-SHA256(secret, manifest) → hex
 * Comparação: timing-safe (crypto.timingSafeEqual) para evitar timing oracle.
 *
 * Referência: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function verifyWebhookSignature(
  secret: string,
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string | undefined
): boolean {
  if (!xSignature || !xSignature.trim()) return false;

  const parts = xSignature.split(',');
  let ts: string | null = null;
  let hash: string | null = null;
  for (const part of parts) {
    const [key, value] = part.split('=').map((s) => s.trim());
    if (key === 'ts') ts = value ?? null;
    else if (key === 'v1') hash = value ?? null;
  }
  if (!ts || !hash) return false;

  const partsManifest: string[] = [];
  if (dataId != null && dataId !== '') {
    // MP payment IDs are numeric strings — toLowerCase() is a no-op for them.
    // Preserved for defensive compatibility; MP signs the id it sends.
    const id = typeof dataId === 'string' && /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
    partsManifest.push(`id:${id}`);
  }
  if (xRequestId != null && xRequestId !== '') partsManifest.push(`request-id:${xRequestId}`);
  partsManifest.push(`ts:${ts}`);
  const manifest = partsManifest.join(';') + ';';

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  // Timing-safe comparison to prevent timing oracle attacks
  if (expected.length !== hash.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    // Buffer.from can throw if hash contains invalid hex chars
    return false;
  }
}

export async function webhookHandler(req: Request, res: Response) {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.trim() === '') {
    logger.warn('mp_webhook_rejected', { event: 'mp_webhook_rejected', reason: 'secret_not_configured' });
    sendError(res, req, 401, 'MP_WEBHOOK_UNAUTHORIZED', 'Webhook secret not configured');
    return;
  }

  const signature = req.headers['x-signature'];
  const xSignature = typeof signature === 'string' ? signature : Array.isArray(signature) ? signature[0] : undefined;
  const xRequestId = req.headers['x-request-id'];
  const reqId = typeof xRequestId === 'string' ? xRequestId : Array.isArray(xRequestId) ? xRequestId[0] : undefined;
  const dataIdQuery = req.query['data.id'];
  const dataIdBody = req.body?.data?.id;
  const dataId = dataIdQuery != null ? String(dataIdQuery) : dataIdBody != null ? String(dataIdBody) : undefined;

  if (!verifyWebhookSignature(webhookSecret, xSignature, reqId, dataId)) {
    logger.warn('mp_webhook_rejected', {
      event: 'mp_webhook_rejected',
      reason: xSignature ? 'invalid_signature' : 'missing_signature',
      requestId: reqId ?? null,
      dataId: dataId ?? null,
      hasSignature: !!xSignature,
      hasRequestId: !!reqId,
      hasDataId: !!dataId,
    });
    sendError(res, req, 401, 'MP_WEBHOOK_UNAUTHORIZED', 'Invalid signature');
    return;
  }

  // Log structured entry for every accepted webhook
  logger.info('mp_webhook_received', {
    event: 'mp_webhook_received',
    requestId: reqId ?? null,
    dataId: dataId ?? null,
    topic: req.body?.type ?? req.body?.topic ?? 'unknown',
    hasSignature: !!xSignature,
  });

  // Sempre responder 200 rapidamente para o Mercado Pago
  // Processamento assíncrono acontece após resposta
  res.status(200).json({ ok: true, result: 'accepted' });

  try {
    // Extract básico
    const provider = 'mercadopago';
    const eventType = req.body?.type ?? 'unknown';
    const eventId = String(req.body?.data?.id ?? '');

    // Se eventId vazio, criar WebhookEvent como ignored e retornar
    if (!eventId || eventId === '') {
      await prisma.webhookEvent.create({
        data: {
          provider,
          eventId: `empty-${Date.now()}`,
          eventType,
          payload: req.body,
          status: 'ignored',
          processedAt: new Date(),
        },
      });
      logger.info('mp_webhook_ignored', { event: 'mp_webhook_ignored', reason: 'empty_event_id', eventType });
      return;
    }

    // Idempotência via DB: tentar criar WebhookEvent
    let webhookEvent;
    try {
      webhookEvent = await prisma.webhookEvent.create({
        data: {
          provider,
          eventId,
          eventType,
          payload: req.body,
          status: 'received',
        },
      });
      logger.info('mp_webhook_event_created', { event: 'mp_webhook_event_created', eventType, dataId: eventId });
    } catch (error: any) {
      // Se falhar por unique constraint, evento já foi processado
      if (error.code === 'P2002') {
        logger.info('mp_webhook_duplicate', { event: 'mp_webhook_duplicate', eventType, dataId: eventId });
        return;
      }
      // Outro erro: logar e retornar
      logger.error('mp_webhook_error', {
        event: 'mp_webhook_error',
        stage: 'create_webhook_event',
        eventType,
        dataId: eventId,
        message: error.message,
      });
      return;
    }

    // Processamento baseado no tipo de evento
    if (eventType === 'payment') {
      await processPaymentEvent(eventId, webhookEvent.id);
    } else if (eventType === 'merchant_order') {
      // Marcar como processado (lógica futura pode ser adicionada aqui)
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
        },
      });
      logger.info('mp_webhook_processed', { event: 'mp_webhook_processed', result: 'merchant_order_ack', dataId: eventId });
    } else {
      // Tipo não tratado: marcar como ignored
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'ignored',
          processedAt: new Date(),
        },
      });
      logger.info('mp_webhook_ignored', { event: 'mp_webhook_ignored', reason: 'unhandled_event_type', eventType, dataId: eventId });
    }
  } catch (error) {
    logger.error('mp_webhook_error', {
      event: 'mp_webhook_error',
      stage: 'top_level',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    // Erro já foi logado, resposta 200 já foi enviada
  }
}

/**
 * Processa evento de pagamento do Mercado Pago
 * 
 * Garante idempotência verificando:
 * 1. Se paymentId já foi processado em outro pedido
 * 2. Se o status realmente mudou antes de atualizar
 */
async function processPaymentEvent(paymentId: string, webhookEventId: string) {
  try {
    // Buscar detalhes do pagamento na API do Mercado Pago
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      logger.error('mp_webhook_error', { event: 'mp_webhook_error', stage: 'missing_access_token', paymentId });
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'failed',
          errorMessage: 'MP_ACCESS_TOKEN não configurado',
          processedAt: new Date(),
        },
      });
      return;
    }

    let payment: { external_reference?: string; id?: string | number; status?: string };
    try {
      payment = await fetchMpPayment(paymentId);
    } catch (err) {
      if (err instanceof MpHttpError && err.status === 404) {
        logger.info('mp_webhook_ignored', {
          event: 'mp_webhook_ignored',
          reason: 'payment_not_found_404',
          paymentId,
        });
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            status: 'ignored',
            errorMessage: 'MP_PAYMENT_NOT_FOUND_404',
            processedAt: new Date(),
          },
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        logger.error('mp_webhook_error', { event: 'mp_webhook_error', stage: 'fetch_payment', paymentId, message: msg });
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            status: 'failed',
            errorMessage: msg,
            processedAt: new Date(),
          },
        });
      }
      return;
    }

    const externalReference = payment.external_reference;
    const mpPaymentId = payment.id?.toString() ?? null;
    const mpStatus = payment.status ?? null;

    // Se externalReference vazio, ignorar
    if (!externalReference || externalReference.trim() === '') {
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'ignored',
          errorMessage: 'External reference missing',
          processedAt: new Date(),
        },
      });
      logger.info('mp_webhook_ignored', { event: 'mp_webhook_ignored', reason: 'missing_external_reference', paymentId });
      return;
    }

    // VERIFICAÇÃO 1: Verificar se paymentId já existe em outro pedido
    // Isso previne que o mesmo payment_id seja associado a múltiplos pedidos
    if (mpPaymentId) {
      const existingOrderWithPaymentId = await prisma.order.findFirst({
        where: {
          mpPaymentId: mpPaymentId,
          externalReference: { not: externalReference }, // Excluir o próprio pedido
        },
        select: { id: true, externalReference: true },
      });

      if (existingOrderWithPaymentId) {
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            status: 'ignored',
            errorMessage: `Payment ID already processed for different order: ${existingOrderWithPaymentId.externalReference}`,
            processedAt: new Date(),
          },
        });
        logger.info('mp_webhook_duplicate', {
          event: 'mp_webhook_duplicate',
          reason: 'payment_id_on_different_order',
          paymentId: mpPaymentId,
          orderRef: externalReference,
          existingOrderRef: existingOrderWithPaymentId.externalReference,
        });
        return;
      }
    }

    // Buscar Order por externalReference (com dados para email de confirmação)
    const order = await prisma.order.findUnique({
      where: { externalReference },
      select: {
        id: true,
        status: true,
        mpPaymentId: true,
        mpStatus: true,
        externalReference: true,
        buyerId: true,
        creditsGranted: true,
        payerName: true,
        payerEmail: true,
        total: true,
        shippingCost: true,
        couponCode: true,
        couponDiscountAmount: true,
        shippingAddress1: true,
        shippingNumber: true,
        shippingDistrict: true,
        shippingCity: true,
        shippingState: true,
        shippingCep: true,
        shippingComplement: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            size: true,
            color: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'failed',
          errorMessage: `Order not found for externalReference: ${externalReference}`,
          processedAt: new Date(),
        },
      });
      logger.warn('mp_webhook_error', { event: 'mp_webhook_error', stage: 'order_lookup', reason: 'order_not_found', paymentId, orderRef: externalReference });
      return;
    }

    // VERIFICAÇÃO 2: Verificar se paymentId já foi processado para este pedido
    if (mpPaymentId && order.mpPaymentId && order.mpPaymentId === mpPaymentId) {
      // Payment ID já está associado a este pedido
      // Verificar se o status mudou antes de atualizar
      const orderStatus = mapMpStatusToOrderStatus(mpStatus);
      const statusChanged = order.status !== orderStatus || order.mpStatus !== mpStatus;

      if (!statusChanged) {
        // Status não mudou, ignorar atualização
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            status: 'processed',
            errorMessage: 'Payment already processed, status unchanged',
            processedAt: new Date(),
          },
        });
        logger.info('mp_webhook_duplicate', {
          event: 'mp_webhook_duplicate',
          reason: 'status_unchanged',
          paymentId: mpPaymentId,
          orderRef: externalReference,
          currentStatus: order.status,
          mpStatus: order.mpStatus,
        });
        return;
      }
    }

    const orderStatus = mapMpStatusToOrderStatus(mpStatus);
    if (mpStatus && !['approved', 'cancelled', 'rejected', 'refunded', 'charged_back', 'pending', 'in_process'].includes(mpStatus)) {
      logger.warn('mp_webhook_unknown_status', { event: 'mp_webhook_unknown_status', paymentId, mpStatus });
    }

    // VERIFICAÇÃO 3: Atualizar apenas se status realmente mudou
    const statusChanged = order.status !== orderStatus || order.mpStatus !== mpStatus;
    const paymentIdChanged = order.mpPaymentId !== mpPaymentId;

    if (!statusChanged && !paymentIdChanged) {
      // Nada mudou, marcar como processado sem atualizar
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'processed',
          errorMessage: 'No changes detected',
          processedAt: new Date(),
        },
      });
      logger.info('mp_webhook_duplicate', {
        event: 'mp_webhook_duplicate',
        reason: 'no_changes',
        paymentId: mpPaymentId,
        orderRef: externalReference,
        currentStatus: order.status,
        newStatus: orderStatus,
      });
      return;
    }

    // Atualizar Order com mpPaymentId, mpStatus e status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPaymentId,
        mpStatus,
        status: orderStatus,
      },
    });

    // ========== LIBERAR CRÉDITOS AUTOMÁTICO ==========
    // Se o pagamento foi aprovado E o pedido tem um comprador (buyerId)
    // E ainda não liberou créditos, libera +5 créditos
    if (
      mpStatus === 'approved' &&
      order.buyerId &&
      !order.creditsGranted
    ) {
      try {
        logger.info('mp_webhook_credits_pending', {
          event: 'mp_webhook_credits_pending',
          orderId: order.id,
          buyerId: order.buyerId,
        });

        await prisma.$transaction([
          prisma.user.update({
            where: { id: order.buyerId },
            data: { credits: { increment: 5 } },
          }),
          prisma.creditLog.create({
            data: {
              userId: order.buyerId,
              amount: 5,
              reason: 'PURCHASE',
              orderId: order.id,
            },
          }),
          prisma.order.update({
            where: { id: order.id },
            data: { creditsGranted: true },
          }),
        ]);

        logger.info('mp_webhook_credits_granted', {
          event: 'mp_webhook_credits_granted',
          orderId: order.id,
          buyerId: order.buyerId,
          amount: 5,
        });
      } catch (creditError) {
        logger.error('mp_webhook_error', {
          event: 'mp_webhook_error',
          stage: 'grant_credits',
          orderId: order.id,
          buyerId: order.buyerId,
          message: creditError instanceof Error ? creditError.message : 'Unknown',
        });
        // NÃO falha o webhook - apenas loga o erro
      }
    }
    // ========== FIM: LIBERAR CRÉDITOS ==========

    // Enviar email de confirmação ao cliente (apenas quando pagamento aprovado)
    if (mpStatus === 'approved' && order.payerEmail) {
      const shippingAddress = [
        order.shippingAddress1,
        order.shippingNumber,
        order.shippingDistrict,
        order.shippingCity,
        order.shippingState,
        order.shippingCep,
        order.shippingComplement,
      ]
        .filter(Boolean)
        .join(', ');
      sendOrderConfirmationEmail({
        name: order.payerName ?? 'Cliente',
        email: order.payerEmail,
        orderId: order.id,
        total: order.total,
        shippingCost: order.shippingCost ?? 0,
        couponCode: order.couponCode ?? undefined,
        couponDiscount: order.couponDiscountAmount ?? 0,
        items: order.items.map((item) => ({
          name: item.product.name,
          color: item.color ?? '',
          size: item.size ?? '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        shippingAddress,
      }).catch((err) => logger.error('mp_webhook_error', { event: 'mp_webhook_error', stage: 'order_confirmation_email', orderId: order.id, message: err instanceof Error ? err.message : 'Unknown' }));
    }

    // Se pedido está READY_FOR_MONTINK, enfileirar fulfillment (fire-and-forget)
    if (orderStatus === 'READY_FOR_MONTINK') {
      // Importar dinamicamente para evitar dependência circular e carregamento desnecessário
      import('../../services/montinkFulfillment')
        .then(({ processMontinkFulfillment }) => {
          // Fire-and-forget: não aguardar resultado
          processMontinkFulfillment(order.id).catch((err: unknown) => {
            // Erro já foi logado dentro de processMontinkFulfillment
            logger.error('mp_webhook_error', { event: 'mp_webhook_error', stage: 'montink_fulfillment', orderId: order.id, message: err instanceof Error ? err.message : 'Unknown' });
          });
        })
        .catch((err: unknown) => {
          logger.error('mp_webhook_error', { event: 'mp_webhook_error', stage: 'montink_import', message: err instanceof Error ? err.message : 'Unknown' });
        });
    }

    // Marcar WebhookEvent como processado
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });

    logger.info('mp_webhook_processed', {
      event: 'mp_webhook_processed',
      paymentId: mpPaymentId,
      orderRef: externalReference,
      mpStatus,
      newOrderStatus: orderStatus,
      previousStatus: order.status,
      previousMpStatus: order.mpStatus,
      statusChanged,
      paymentIdChanged,
    });
  } catch (error) {
    logger.error('mp_webhook_error', {
      event: 'mp_webhook_error',
      stage: 'process_payment',
      paymentId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
      },
    });
  }
}
