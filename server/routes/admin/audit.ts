/**
 * GET /api/admin/orders/:externalReference/audit
 *
 * Returns audit trail for a single order: order snapshot + admin events + webhook events.
 * No PII (no email, address, payer info). Protected by x-admin-token.
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendError } from '../../utils/errorResponse.js';

const auditParamsSchema = z.object({
  externalReference: z.string().min(1),
});

const ADMIN_EVENTS_LIMIT = 50;
const WEBHOOK_EVENTS_LIMIT = 50;

export async function getOrderAudit(req: Request, res: Response) {
  try {
    const parsed = auditParamsSchema.safeParse({
      externalReference: req.params.externalReference,
    });

    if (!parsed.success) {
      return sendError(res, req, 400, 'INVALID_PARAMS', 'Parâmetros inválidos');
    }

    const { externalReference } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { externalReference },
      select: {
        externalReference: true,
        status: true,
        mpPaymentId: true,
        mpStatus: true,
        createdAt: true,
        updatedAt: true,
        id: true,
      },
    });

    if (!order) {
      return sendError(res, req, 404, 'ORDER_NOT_FOUND', 'Pedido não encontrado');
    }

    const [adminEvents, webhookEvents] = await Promise.all([
      prisma.adminEvent.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: 'desc' },
        take: ADMIN_EVENTS_LIMIT,
        select: {
          action: true,
          createdAt: true,
          metadata: true,
        },
      }),
      order.mpPaymentId
        ? prisma.webhookEvent.findMany({
            where: {
              provider: 'mercadopago',
              eventId: order.mpPaymentId,
            },
            orderBy: { receivedAt: 'desc' },
            take: WEBHOOK_EVENTS_LIMIT,
            select: {
              eventId: true,
              eventType: true,
              status: true,
              receivedAt: true,
              processedAt: true,
              errorMessage: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const response = {
      ok: true,
      order: {
        externalReference: order.externalReference,
        status: order.status,
        mpPaymentId: order.mpPaymentId,
        mpStatus: order.mpStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      adminEvents: adminEvents.map((e: { action: string; createdAt: Date; metadata: unknown }) => ({
        action: e.action,
        createdAt: e.createdAt,
        metadata: e.metadata,
      })),
      webhookEvents: webhookEvents.map(
        (e: {
          eventId: string;
          eventType: string | null;
          status: string | null;
          receivedAt: Date | null;
          processedAt: Date | null;
          errorMessage: string | null;
        }) => ({
          eventId: e.eventId,
          eventType: e.eventType,
          status: e.status,
          receivedAt: e.receivedAt,
          processedAt: e.processedAt,
          errorMessage: e.errorMessage ?? undefined,
        })
      ),
    };

    if (!order.mpPaymentId) {
      (response as { webhookEventsNote?: string }).webhookEventsNote =
        'Order has no mpPaymentId; webhook events are keyed by payment id.';
    }

    logger.info(`Audit retrieved: externalReference=${externalReference}`);

    return res.json(response);
  } catch (err) {
    logger.error(
      `Audit error: ${err instanceof Error ? err.message : String(err)}`
    );
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar auditoria');
  }
}
