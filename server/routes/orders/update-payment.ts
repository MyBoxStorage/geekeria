/**
 * POST /api/orders/:externalReference/update-payment
 *
 * Atualiza o pedido com mpPaymentId quando o pagamento é criado no client (Payment Brick).
 * Chamado imediatamente após o Brick retornar o resultado, antes do webhook.
 * Garante que a página pending possa buscar o payment via order caso payment_id se perca na URL.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { errorMeta } from '../../utils/logging.js';

const updatePaymentSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
  status: z.string().optional(),
});

export async function updateOrderPayment(req: Request, res: Response) {
  try {
    const raw = req.params.externalReference;
    const externalReference = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() ?? '' : '';
    if (!externalReference) {
      return res.status(400).json({ error: 'externalReference is required' });
    }

    const body = updatePaymentSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: body.error.issues,
      });
    }

    const { paymentId, status } = body.data;

    const order = await prisma.order.findUnique({
      where: { externalReference },
      select: { id: true, mpPaymentId: true, status: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Só atualiza se ainda não tem mpPaymentId ou se é o mesmo (idempotente)
    if (order.mpPaymentId && order.mpPaymentId !== paymentId) {
      logger.warn('updateOrderPayment: Order already has different mpPaymentId', {
        externalReference,
        existing: order.mpPaymentId,
        received: paymentId,
      });
      return res.json({ ok: true, message: 'Order already has payment ID' });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPaymentId: paymentId,
        ...(status && { mpStatus: status }),
      },
    });

    logger.info('Order payment updated', {
      externalReference,
      paymentId,
      status,
    });

    return res.json({ ok: true });
  } catch (error) {
    logger.error('updateOrderPayment error:', errorMeta(error));
    return res.status(500).json({ error: 'Erro ao atualizar pagamento' });
  }
}
