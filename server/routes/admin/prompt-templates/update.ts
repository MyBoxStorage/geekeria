import type { Request, Response } from 'express';
import { sendError } from '../../../utils/errorResponse.js';
import { prisma } from '../../../utils/prisma.js';

export async function updatePromptTemplate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'ID obrigatório');
      return;
    }
    const { name, content } = req.body;

    const template = await prisma.promptTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
      },
    });

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Update prompt template error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao atualizar template');
  }
}
