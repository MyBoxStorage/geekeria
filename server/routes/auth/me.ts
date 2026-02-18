import type { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado (requer JWT)
 */
export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Não autenticado');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        credits: true,
        totalGenerations: true,
        createdAt: true,
      },
    });

    if (!user) {
      sendError(res, req, 404, 'NOT_FOUND', 'Usuário não encontrado');
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar dados');
  }
}
