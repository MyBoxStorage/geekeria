import type { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * POST /api/internal/cleanup-expired-generations
 * CRON Job: Apaga imagens expiradas (7+ dias)
 * Requer ADMIN_TOKEN
 */
export async function cleanupExpiredGenerations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const now = new Date();

    const expired = await prisma.generation.findMany({
      where: {
        expiresAt: { lte: now },
        isExpired: false,
        status: 'COMPLETED',
      },
      select: { id: true, userId: true, prompt: true, expiresAt: true },
    });

    if (expired.length === 0) {
      console.log('🧹 No expired generations to cleanup');
      res.json({
        success: true,
        cleaned: 0,
        message: 'Nenhuma geração expirada',
      });
      return;
    }

    const result = await prisma.generation.updateMany({
      where: {
        id: { in: expired.map((g) => g.id) },
      },
      data: {
        imageUrl: null,
        uploadedImg: null,
        isExpired: true,
      },
    });

    console.log(
      `🧹 Cleaned ${result.count} expired generations (>7 days old)`
    );

    res.json({
      success: true,
      cleaned: result.count,
      message: `${result.count} imagens expiradas foram apagadas`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    sendError(res, req, 500, 'CLEANUP_ERROR', 'Erro ao limpar gerações expiradas');
  }
}
