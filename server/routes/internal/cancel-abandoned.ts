/**
 * POST /api/internal/cancel-abandoned
 *
 * Cancela pedidos PENDING abandonados (sem mp_payment_id) criados há mais de X minutos.
 * Protegido por x-admin-token e rate limit (5 req / 5 min).
 * NÃO cancela pedidos com mp_payment_id. NÃO toca em PAID/CANCELED/REFUNDED.
 *
 * Params (body JSON):
 * - olderThanMinutes (default 60, min 15)
 * - limit (default 50, max 200)
 * - dryRun (default true)
 *
 * AdminEvent: CANCEL_ABANDONED_DRYRUN | CANCEL_ABANDONED_APPLIED
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';

const DEFAULT_OLDER_THAN_MINUTES = 60;
const MIN_OLDER_THAN_MINUTES = 15;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_EXAMPLES = 10;

export async function cancelAbandoned(req: Request, res: Response) {
  const olderThanMinutes = Math.max(
    MIN_OLDER_THAN_MINUTES,
    Math.floor(Number(req.body?.olderThanMinutes) || DEFAULT_OLDER_THAN_MINUTES)
  );
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(req.body?.limit) || DEFAULT_LIMIT)));
  const dryRun = req.body?.dryRun !== false;

  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  // Selecionar orders: PENDING, mp_payment_id IS NULL, created_at < cutoff
  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      mpPaymentId: null,
      createdAt: { lt: cutoff },
    },
    select: { id: true, externalReference: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  const affected = orders.length;
  const examples = orders.slice(0, MAX_EXAMPLES).map((o) => o.externalReference);

  if (dryRun) {
    if (affected > 0) {
      try {
        await prisma.adminEvent.create({
          data: {
            action: 'CANCEL_ABANDONED_DRYRUN',
            orderId: orders[0].id,
            externalReference: orders[0].externalReference,
            metadata: {
              olderThanMinutes,
              limit,
              affected,
              examplesExternalReferences: examples,
            },
          },
        });
      } catch (e) {
        logger.warn('[CANCEL_ABANDONED] AdminEvent DRYRUN create failed', { error: e instanceof Error ? e.message : 'Unknown' });
      }
    }
    logger.info('[CANCEL_ABANDONED] Dry run', {
      olderThanMinutes,
      limit,
      affected,
      examples: examples.slice(0, 3),
    });
    return res.status(200).json({
      ok: true,
      dryRun: true,
      affected,
      examples,
      message: `${affected} pedidos seriam cancelados. Use dryRun=false para aplicar.`,
    });
  }

  if (affected === 0) {
    return res.status(200).json({
      ok: true,
      dryRun: false,
      affected: 0,
      examples: [],
      message: 'Nenhum pedido abandonado para cancelar.',
    });
  }

  const updateResult = await prisma.order.updateMany({
    where: {
      status: 'PENDING',
      mpPaymentId: null,
      createdAt: { lt: cutoff },
      id: { in: orders.map((o) => o.id) },
    },
    data: {
      status: 'CANCELED',
      updatedAt: new Date(),
    },
  });

  const actuallyUpdated = updateResult.count;

  // Registrar CANCEL_ABANDONED_APPLIED (já criado acima se dryRun; para apply, recriar com action APPLIED)
  try {
    await prisma.adminEvent.create({
      data: {
        action: 'CANCEL_ABANDONED_APPLIED',
        orderId: orders[0].id,
        externalReference: orders[0].externalReference,
        metadata: {
          olderThanMinutes,
          limit,
          affected: actuallyUpdated,
          examplesExternalReferences: examples,
        },
      },
    });
  } catch (e) {
    logger.warn('[CANCEL_ABANDONED] AdminEvent APPLIED create failed', { error: e instanceof Error ? e.message : 'Unknown' });
  }

  logger.info('[CANCEL_ABANDONED] Applied', {
    olderThanMinutes,
    limit,
    affected: actuallyUpdated,
    examples: examples.slice(0, 3),
  });

  return res.status(200).json({
    ok: true,
    dryRun: false,
    affected: actuallyUpdated,
    examples,
    message: `${actuallyUpdated} pedidos cancelados.`,
  });
}
