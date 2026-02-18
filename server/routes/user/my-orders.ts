import type { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * GET /api/user/my-orders?limit=5
 * Lista pedidos do usuário autenticado (filtrado por buyerId)
 */
export async function getMyOrders(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Não autenticado');
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        externalReference: true,
        total: true,
        status: true,
        mpStatus: true,
        paymentMethod: true,
        shippingCity: true,
        shippingState: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            size: true,
            color: true,
            product: {
              select: {
                name: true,
                image: true,
                images: true,
                colorStock: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar pedidos');
  }
}
