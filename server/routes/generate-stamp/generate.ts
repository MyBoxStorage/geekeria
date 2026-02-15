import type { Response } from 'express';
import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { generateStampSchema } from './schemas.js';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY not set!');
}

const CACHE_DAYS = 7;

/**
 * POST /api/generate-stamp
 * Gera estampa usando Gemini AI (consome 1 crédito)
 * Imagens ficam disponíveis por 7 DIAS e depois são apagadas
 */
export async function generateStamp(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const validation = generateStampSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: validation.error.issues,
      });
      return;
    }

    const { prompt, uploadedImage } = validation.data;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, email: true },
    });

    if (!user || user.credits < 1) {
      res.status(403).json({
        error: 'Sem créditos disponíveis',
        credits: user?.credits || 0,
        message: 'Compre um produto para ganhar +5 créditos',
      });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_DAYS);

    const generation = await prisma.generation.create({
      data: {
        userId,
        prompt,
        uploadedImg: uploadedImage || null,
        status: 'PENDING',
        expiresAt,
        isExpired: false,
      },
    });

    console.log(
      `🎨 Starting generation ${generation.id} for user ${user.email} (expires: ${expiresAt.toISOString()})`
    );

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-image',
      });

      const parts: Part[] = [
        {
          text: `Crie uma arte para estampa de camiseta baseada nesta descrição: ${prompt}

INSTRUÇÕES:
- Crie uma imagem artística, vibrante e impactante
- Adequada para impressão em tecido (alta resolução)
- Estilo: ilustração vetorial, cores vivas
- Fundo transparente ou branco
- Formato quadrado ou retangular adequado para camiseta
- Evite textos muito pequenos
- Foco no conceito visual da descrição`,
        },
      ];

      if (uploadedImage) {
        const base64Data = uploadedImage.split(',')[1];
        const mimeType = uploadedImage.match(/data:(.*?);/)?.[1] || 'image/jpeg';

        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }

      const result = await model.generateContent(parts as Part[]);
      console.log('✅ Gemini raw response:', JSON.stringify(result.response, null, 2));
      const response = result.response;

      if (
        !response.candidates ||
        !response.candidates[0]?.content?.parts?.[0]?.inlineData
      ) {
        throw new Error('Gemini não retornou imagem');
      }

      const imageData = response.candidates[0].content.parts[0].inlineData;
      const imageBase64 = `data:${imageData.mimeType};base64,${imageData.data}`;

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          imageUrl: imageBase64,
        },
      });

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            credits: { decrement: 1 },
            totalGenerations: { increment: 1 },
          },
        }),
        prisma.creditLog.create({
          data: {
            userId,
            amount: -1,
            reason: 'GENERATION',
          },
        }),
      ]);

      console.log(
        `✅ Generation ${generation.id} completed. Credits: ${user.credits} → ${updatedUser.credits}`
      );

      res.json({
        success: true,
        image: imageBase64,
        generationId: generation.id,
        creditsRemaining: updatedUser.credits,
        expiresAt: expiresAt.toISOString(),
        expiresInDays: CACHE_DAYS,
        message:
          updatedUser.credits === 0
            ? 'Você usou todos os créditos! Compre um produto para ganhar +5.'
            : `${updatedUser.credits} créditos restantes`,
        warning: `⚠️ Esta imagem ficará disponível por ${CACHE_DAYS} dias e será automaticamente apagada em ${expiresAt.toLocaleDateString('pt-BR')}.`,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Generation ${generation.id} failed:`, err.message);

      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          errorMsg: err.message || 'Erro desconhecido',
        },
      });

      res.status(500).json({
        error: 'Erro ao gerar estampa',
        message: 'Tente novamente. Seu crédito não foi consumido.',
        details: err.message,
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Generate stamp error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
