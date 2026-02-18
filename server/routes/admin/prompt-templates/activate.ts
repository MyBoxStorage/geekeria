import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function activatePromptTemplate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'ID obrigatório');
      return;
    }

    // Desativar todos os templates
    await prisma.promptTemplate.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Ativar o template selecionado
    const template = await prisma.promptTemplate.update({
      where: { id },
      data: { isActive: true },
    });

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Activate prompt template error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao ativar template');
  }
}
