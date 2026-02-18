import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function updateCoupon(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'ID obrigatório');
      return;
    }
    const { isActive, maxUses, expiresAt } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(maxUses !== undefined && { maxUses: maxUses || null }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
      },
    });

    res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao atualizar cupom');
  }
}
