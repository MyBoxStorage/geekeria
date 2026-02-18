import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function listPromptTemplates(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const templates = await prisma.promptTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('List prompt templates error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao listar templates');
  }
}
