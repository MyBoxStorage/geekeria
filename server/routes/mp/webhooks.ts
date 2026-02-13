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
import { fetchMpPayment } from '../../services/mp/fetchPayment.js';
import { mapMpStatusToOrderStatus } from '../../services/mp/statusMapper.js';

/**
 * Valida assinatura do webhook conforme documentação Mercado Pago.
 * Header x-signature: ts=<timestamp>,v1=<hmac_hex>
 * Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * HMAC SHA256(secret, manifest) deve ser igual a v1.
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
    const id = typeof dataId === 'string' && /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
    partsManifest.push(`id:${id}`);
  }
  if (xRequestId != null && xRequestId !== '') partsManifest.push(`request-id:${xRequestId}`);
  partsManifest.push(`ts:${ts}`);
  const manifest = partsManifest.join(';') + ';';

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return expected === hash;
}

export async function webhookHandler(req: Request, res: Response) {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.trim() === '') {
    logger.warn('[WEBHOOK] MP_WEBHOOK_SECRET not configured');
    res.status(401).json({ error: 'Webhook secret not configured' });
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
    logger.warn('[WEBHOOK] Signature validation failed', {
      hasSignature: !!xSignature,
      hasRequestId: !!reqId,
      hasDataId: !!dataId,
    });
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // Sempre responder 200 rapidamente para o Mercado Pago
  // Processamento assíncrono acontece após resposta
  res.status(200).json({ received: true });

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
      logger.info('[WEBHOOK] Event ignored: empty eventId', { eventType });
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
      logger.info('[WEBHOOK] Event received', { eventType, eventId });
    } catch (error: any) {
      // Se falhar por unique constraint, evento já foi processado
      if (error.code === 'P2002') {
        logger.info('[WEBHOOK] Event already processed', { eventType, eventId });
        return;
      }
      // Outro erro: logar e retornar
      logger.error('[WEBHOOK] Error creating WebhookEvent', {
        eventType,
        eventId,
        error: error.message,
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
      logger.info('[WEBHOOK] Merchant order processed', { eventId });
    } else {
      // Tipo não tratado: marcar como ignored
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'ignored',
          processedAt: new Date(),
        },
      });
      logger.info('[WEBHOOK] Unhandled event type', { eventType, eventId });
    }
  } catch (error) {
    logger.error('[WEBHOOK] Processing error', {
      error: error instanceof Error ? error.message : 'Unknown error',
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
      logger.error('[WEBHOOK] MP_ACCESS_TOKEN não configurado', { webhookEventId, paymentId });
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
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[WEBHOOK] Failed to fetch payment', { webhookEventId, paymentId, error: msg });
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'failed',
          errorMessage: msg,
          processedAt: new Date(),
        },
      });
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
      logger.info('[WEBHOOK] Payment ignored: externalReference missing', { webhookEventId, paymentId });
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
        logger.info('[WEBHOOK] Payment ID already processed for different order', {
          webhookEventId,
          paymentId: mpPaymentId,
          currentExternalRef: externalReference,
          existingExternalRef: existingOrderWithPaymentId.externalReference,
        });
        return;
      }
    }

    // Buscar Order por externalReference
    const order = await prisma.order.findUnique({
      where: { externalReference },
      select: {
        id: true,
        status: true,
        mpPaymentId: true,
        mpStatus: true,
        externalReference: true,
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
      logger.warn('[WEBHOOK] Order not found', { webhookEventId, paymentId, externalReference });
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
        logger.info('[WEBHOOK] Payment already processed, status unchanged', {
          webhookEventId,
          paymentId: mpPaymentId,
          externalReference,
          currentStatus: order.status,
          mpStatus: order.mpStatus,
        });
        return;
      }
    }

    const orderStatus = mapMpStatusToOrderStatus(mpStatus);
    if (mpStatus && !['approved', 'cancelled', 'rejected', 'refunded', 'charged_back', 'pending', 'in_process'].includes(mpStatus)) {
      logger.warn('[WEBHOOK] Unknown payment status', { webhookEventId, paymentId, mpStatus });
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
      logger.info('[WEBHOOK] No changes detected, skipping update', {
        webhookEventId,
        paymentId: mpPaymentId,
        externalReference,
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

    // Se pedido está READY_FOR_MONTINK, enfileirar fulfillment (fire-and-forget)
    if (orderStatus === 'READY_FOR_MONTINK') {
      // Importar dinamicamente para evitar dependência circular e carregamento desnecessário
      import('../../services/montinkFulfillment')
        .then(({ processMontinkFulfillment }) => {
          // Fire-and-forget: não aguardar resultado
          processMontinkFulfillment(order.id).catch((err: unknown) => {
            // Erro já foi logado dentro de processMontinkFulfillment
            logger.error('[WEBHOOK] Montink fulfillment async error', { orderId: order.id, error: err });
          });
        })
        .catch((err: unknown) => {
          logger.error('[WEBHOOK] Failed to load montinkFulfillment service', { error: err });
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

    // Log estruturado sem PII (sem email, CPF, nome, etc)
    logger.info('[WEBHOOK] Order updated successfully', {
      webhookEventId,
      orderId: order.id,
      externalReference,
      paymentId: mpPaymentId,
      previousStatus: order.status,
      newStatus: orderStatus,
      previousMpStatus: order.mpStatus,
      newMpStatus: mpStatus,
      statusChanged,
      paymentIdChanged,
    });
  } catch (error) {
    logger.error('[WEBHOOK] Error processing payment event', {
      webhookEventId,
      paymentId,
      error: error instanceof Error ? error.message : 'Unknown error',
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
