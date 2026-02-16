import type { Request, Response } from 'express';
import { prisma } from '../../../utils/prisma.js';

export async function updatePromptTemplate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ error: 'ID obrigatório' });
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
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
}
