import type { Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * GET /api/my-generations
 * Lista gerações do usuário autenticado (apenas não expiradas)
 */
export async function listMyGenerations(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Não autenticado');
      return;
    }

    const generations = await prisma.generation.findMany({
      where: {
        userId: req.user.id,
        status: 'COMPLETED',
        isExpired: false,
      },
      select: {
        id: true,
        prompt: true,
        imageUrl: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = new Date();
    const activeGenerations = generations.map((gen) => ({
      ...gen,
      daysUntilExpiration: gen.expiresAt
        ? Math.ceil(
            (gen.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    res.json({
      success: true,
      generations: activeGenerations,
      total: activeGenerations.length,
    });
  } catch (error) {
    console.error('List generations error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar gerações');
  }
}
