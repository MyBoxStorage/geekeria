import type { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * GET /api/user/my-generations
 * Lista gerações do usuário autenticado
 */
export async function getMyGenerations(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Não autenticado');
      return;
    }

    const generations = await prisma.generation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prompt: true,
        imageUrl: true,
        status: true,
        isExpired: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      generations,
    });
  } catch (error) {
    console.error('Get my generations error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar gerações');
  }
}
