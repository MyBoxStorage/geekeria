import type { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { z } from 'zod';
import { sendError } from '../../utils/errorResponse.js';

const linkOrderSchema = z.object({
  externalReference: z.string().min(1),
  payerEmail: z.string().email(),
});

/**
 * POST /api/orders/link
 * Vincula um pedido existente ao usuário logado
 * (para casos onde comprou sem login)
 */
export async function linkOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Não autenticado');
      return;
    }

    const validation = linkOrderSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Dados inválidos', { details: validation.error.issues });
      return;
    }

    const { externalReference, payerEmail } = validation.data;

    if (payerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      sendError(res, req, 403, 'EMAIL_MISMATCH', 'O email do pedido deve ser o mesmo da sua conta');
      return;
    }

    const order = await prisma.order.findUnique({
      where: { externalReference },
    });

    if (!order) {
      sendError(res, req, 404, 'NOT_FOUND', 'Pedido não encontrado');
      return;
    }

    if (order.buyerId) {
      sendError(res, req, 409, 'ORDER_ALREADY_LINKED', 'Este pedido já está vinculado a uma conta');
      return;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { buyerId: req.user.id },
    });

    // Se o pagamento já foi aprovado E ainda não liberou créditos, libera agora
    if (order.status === 'PAID' && !order.creditsGranted) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.user.id },
          data: { credits: { increment: 5 } },
        }),
        prisma.creditLog.create({
          data: {
            userId: req.user.id,
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

      res.json({
        success: true,
        message: 'Pedido vinculado! +5 créditos adicionados à sua conta.',
        creditsGranted: true,
      });
      return;
    }

    // Também verifica READY_FOR_MONTINK (status quando MP approved)
    if (order.status === 'READY_FOR_MONTINK' && !order.creditsGranted) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.user.id },
          data: { credits: { increment: 5 } },
        }),
        prisma.creditLog.create({
          data: {
            userId: req.user.id,
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

      res.json({
        success: true,
        message: 'Pedido vinculado! +5 créditos adicionados à sua conta.',
        creditsGranted: true,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Pedido vinculado com sucesso',
      creditsGranted: false,
    });
  } catch (error) {
    console.error('Link order error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao vincular pedido');
  }
}
