import type { Request, Response } from 'express';
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
    res.status(500).json({ error: 'Erro ao listar templates' });
  }
}
