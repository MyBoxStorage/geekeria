import type { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * POST /api/coupons/validate
 * Valida um cupom. Funciona com ou sem autenticação.
 * Se autenticado, verifica se o usuário já usou o cupom.
 */
export async function validateCoupon(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Código do cupom é obrigatório');
      return;
    }

    const normalizedCode = (code as string).trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      sendError(res, req, 404, 'NOT_FOUND', 'Cupom não encontrado');
      return;
    }

    if (!coupon.isActive) {
      sendError(res, req, 400, 'COUPON_INACTIVE', 'Cupom inativo');
      return;
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      sendError(res, req, 400, 'COUPON_EXPIRED', 'Cupom expirado');
      return;
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      sendError(res, req, 400, 'COUPON_EXHAUSTED', 'Cupom esgotado');
      return;
    }

    if (userId) {
      const previousUse = await prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (previousUse) {
        sendError(res, req, 400, 'COUPON_ALREADY_USED', 'Você já usou este cupom');
        return;
      }
    }

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao validar cupom');
  }
}
