import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'ID obrigatório');
      return;
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { usages: true } } },
    });

    if (!coupon) {
      sendError(res, req, 404, 'NOT_FOUND', 'Cupom não encontrado');
      return;
    }

    if (coupon._count.usages > 0) {
      sendError(res, req, 400, 'COUPON_IN_USE', 'Não é possível deletar cupom que já foi usado. Desative-o em vez disso.');
      return;
    }

    await prisma.coupon.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Cupom deletado',
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao deletar cupom');
  }
}
