import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function createCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { code, type, value, maxUses, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Código, tipo e valor são obrigatórios');
      return;
    }

    const normalizedCode = code.trim().toUpperCase();

    if (type === 'PERCENTAGE' && value > 20) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Desconto máximo: 20%');
      return;
    }

    if (value <= 0) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Valor deve ser maior que zero');
      return;
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      sendError(res, req, 400, 'DUPLICATE_CODE', 'Código já existe');
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        type,
        value,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao criar cupom');
  }
}
