import type { Request, Response } from 'express';
import { prisma } from '../../../utils/prisma.js';

export async function createPromptTemplate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, content } = req.body;

    if (!name || !content) {
      res.status(400).json({ error: 'Nome e conteúdo são obrigatórios' });
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
    res.status(500).json({ error: 'Erro ao criar template' });
  }
}
