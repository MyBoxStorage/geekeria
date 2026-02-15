import type { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
        model: 'gemini-3-pro-image-preview',
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'text/plain',
        },
      });

      const fullPrompt = `TAREFA: Gerar um design de camiseta de alta resolução (300 DPI) para impressão DTF.

REQUISITOS:
1. FORMATO: PNG transparente, proporção 3:4.
2. CONTEÚDO: APENAS o gráfico isolado. PROIBIDO mockups, modelos humanos ou marcas d'água.
3. ESTÉTICA: Heroico, épico, patriótico. Cores: Verde (#00843D) e Amarelo (#FFCC29). PROIBIDO Vermelho.

${uploadedImage ? `
IMAGEM DE BASE: A imagem enviada é o elemento central. Transforme-a em uma arte de camiseta. Aprimore, não substitua. Preserve as características do sujeito, aplicando efeitos sutis como sobreposições da bandeira, respingos de tinta verde/amarela, iluminação dramática ou texturas de desgaste.
` : `
ELEMENTO CENTRAL: O design deve ser construído em torno de um poderoso símbolo patriótico brasileiro. Use a ferramenta Google Search se necessário para garantir que brasões e bandeiras estejam atualizados e corretos.
`}

FUNDO 100% TRANSPARENTE: O resultado FINAL DEVE ser um PNG com um canal alfa real e ativo.
PROIBIDO FUNDOS SÓLIDOS: NENHUM fundo branco, cinza ou preto.

PEDIDO DO USUÁRIO: "${prompt}"`;

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: fullPrompt },
              ...(uploadedImage
                ? [
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: uploadedImage.split(',')[1],
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      } as Parameters<typeof model.generateContent>[0]);

      const response = result.response;

      if (!response.candidates?.[0]?.content?.parts?.length) {
        throw new Error('Gemini não retornou imagem');
      }

      const imagePart = response.candidates[0].content.parts.find(
        (part: { inlineData?: { mimeType?: string } }) =>
          part.inlineData && part.inlineData.mimeType
      );

      if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
        throw new Error('Gemini não retornou dados da imagem');
      }

      const imageData = imagePart.inlineData;
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
