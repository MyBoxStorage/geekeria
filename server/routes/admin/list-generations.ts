import type { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * GET /api/admin/generations
 * Lista todas as gerações (requer ADMIN_TOKEN)
 */
export async function listGenerations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { status, userId, limit = 50, offset = 0 } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.generation.count({ where }),
    ]);

    res.json({
      success: true,
      generations: generations.map((g) => ({
        id: g.id,
        prompt: g.prompt,
        status: g.status,
        imageUrl: g.imageUrl,
        isExpired: g.isExpired,
        expiresAt: g.expiresAt,
        createdAt: g.createdAt,
        user: {
          email: g.user.email,
          name: g.user.name,
          phone: g.user.phone,
        },
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('List generations error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao listar gerações');
  }
}
