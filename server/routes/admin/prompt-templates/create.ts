import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function createPromptTemplate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, content } = req.body;

    if (!name || !content) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Nome e conteúdo são obrigatórios');
      return;
    }

    const template = await prisma.promptTemplate.create({
      data: {
        name,
        content,
        isActive: false,
      },
    });

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Create prompt template error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao criar template');
  }
}
