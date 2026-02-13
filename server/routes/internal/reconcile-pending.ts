/**
 * POST /api/internal/reconcile-pending
 *
 * Reconciles stale PENDING orders against Mercado Pago.
 * Protected by x-admin-token and rate limit. No PII in response.
 * Records AdminEvent for audit: RECONCILE_UPDATED_STATUS, RECONCILE_SKIPPED_MISSING_PAYMENT_ID, RECONCILE_ERROR.
 * 
 * Mapeamento de status:
 * - approved → PAID
 * - cancelled/rejected → CANCELED
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { fetchMpPayment } from '../../services/mp/fetchPayment.js';

const DEFAULT_OLDER_THAN_MINUTES = 5;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const MAX_EXAMPLES = 5;

/**
 * Mapeia status do Mercado Pago para status do pedido (específico para reconcile)
 * approved → PAID (diferente do webhook que vai para READY_FOR_MONTINK)
 */
function mapMpStatusForReconcile(mpStatus: string | null | undefined): 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED' {
  if (!mpStatus) return 'PENDING';
  
  const status = mpStatus.toLowerCase();
  
  switch (status) {
    case 'approved':
      return 'PAID';
    case 'cancelled':
    case 'rejected':
      return 'CANCELED';
    case 'refunded':
    case 'charged_back':
      return 'REFUNDED';
    case 'pending':
    case 'in_process':
    default:
      return 'PENDING';
  }
}

function getReconcileSource(req: Request): 'cron' | 'manual' {
  const h = req.headers['x-monitor-source'];
  return h === 'cron' ? 'cron' : 'manual';
}

export async function reconcilePending(req: Request, res: Response) {
  const source = getReconcileSource(req);
  const olderThanMinutes = Math.max(1, Number(req.body?.olderThanMinutes) || DEFAULT_OLDER_THAN_MINUTES);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(req.body?.limit) || DEFAULT_LIMIT)));

  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const checkedAt = new Date().toISOString();

  // Buscar pedidos PENDING criados há mais de X minutos
  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      externalReference: true,
      status: true,
      mpPaymentId: true,
      mpStatus: true,
    },
  });

  // Log estruturado sem PII
  logger.info('[RECONCILE] Starting reconciliation', {
    source,
    olderThanMinutes,
    limit,
    cutoff: cutoff.toISOString(),
    ordersFound: orders.length,
  });

  const summary = {
    checked: 0,
    updated: 0,
    unchanged: 0,
    skippedMissingPaymentId: 0,
    errors: 0,
    examples: {
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    },
  };

  for (const order of orders) {
    summary.checked += 1;

    if (!order.mpPaymentId || order.mpPaymentId.trim() === '') {
      summary.skippedMissingPaymentId += 1;
      if (summary.examples.skipped.length < MAX_EXAMPLES) {
        summary.examples.skipped.push(order.externalReference);
      }
      
      // Log estruturado sem PII
      logger.warn('[RECONCILE] Skipping order - missing payment ID', {
        orderId: order.id,
        externalReference: order.externalReference,
        source,
      });
      
      await prisma.adminEvent.create({
        data: {
          action: 'RECONCILE_SKIPPED_MISSING_PAYMENT_ID',
          orderId: order.id,
          externalReference: order.externalReference,
          metadata: { source, checkedAt },
        },
      });
      continue;
    }

    try {
      // Consultar status no Mercado Pago
      const payment = await fetchMpPayment(order.mpPaymentId);
      const mpStatus = payment.status ?? null;
      const mappedStatus = mapMpStatusForReconcile(mpStatus);

      // Log estruturado sem PII
      logger.info('[RECONCILE] Checking payment status', {
        orderId: order.id,
        externalReference: order.externalReference,
        mpPaymentId: order.mpPaymentId,
        currentStatus: order.status,
        mpStatus,
        mappedStatus,
        source,
      });

      // Se status não mudou, pular
      if (mappedStatus === order.status) {
        summary.unchanged += 1;
        logger.info('[RECONCILE] Status unchanged', {
          orderId: order.id,
          externalReference: order.externalReference,
          status: order.status,
        });
        continue;
      }

      // Atualizar pedido no banco
      const oldStatus = order.status;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: mappedStatus,
          mpStatus,
          updatedAt: new Date(),
        },
      });

      // Criar evento de auditoria
      await prisma.adminEvent.create({
        data: {
          action: 'RECONCILE_UPDATED_STATUS',
          orderId: order.id,
          externalReference: order.externalReference,
          metadata: {
            from: oldStatus,
            to: mappedStatus,
            mpStatus,
            mpPaymentId: order.mpPaymentId,
            source,
            checkedAt,
          },
        },
      });

      // Log estruturado sem PII
      logger.info('[RECONCILE] Order status updated', {
        orderId: order.id,
        externalReference: order.externalReference,
        previousStatus: oldStatus,
        newStatus: mappedStatus,
        mpStatus,
        source,
      });

      summary.updated += 1;
      if (summary.examples.updated.length < MAX_EXAMPLES) {
        summary.examples.updated.push(order.externalReference);
      }
    } catch (err) {
      summary.errors += 1;
      if (summary.examples.errors.length < MAX_EXAMPLES) {
        summary.examples.errors.push(order.externalReference);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Log estruturado sem PII
      logger.error('[RECONCILE] Error processing order', {
        orderId: order.id,
        externalReference: order.externalReference,
        mpPaymentId: order.mpPaymentId,
        error: errorMessage,
        source,
      });
      
      await prisma.adminEvent.create({
        data: {
          action: 'RECONCILE_ERROR',
          orderId: order.id,
          externalReference: order.externalReference,
          metadata: { source, checkedAt, error: errorMessage },
        },
      });
    }
  }

  // Log estruturado final sem PII
  logger.info('[RECONCILE] Reconciliation completed', {
    source,
    olderThanMinutes,
    checked: summary.checked,
    updated: summary.updated,
    unchanged: summary.unchanged,
    skippedMissingPaymentId: summary.skippedMissingPaymentId,
    errors: summary.errors,
  });

  res.status(200).json({
    ok: true,
    ...summary,
  });
}
