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

      const fullPrompt = `TAREFA: Arte profissional para camiseta (impressão DTF, 300 DPI, PNG transparente).

ESTILO DE REFERÊNCIA: Ilustração digital vibrante com bandeira Brasil, textos 3D dourados, respingos de tinta verde/amarelo.

${uploadedImage ? `
COM FOTO:
- Transformar a pessoa em ILUSTRAÇÃO/ARTE (não manter foto realista)
- PRESERVAR características: formato do rosto, cabelo, barba, expressão
- Pessoa deve ser RECONHECÍVEL mas em estilo arte digital
- Cores naturais da pele (não verde/amarelo na pele)
- Roupa pode ter cores verde/amarelo se adequado

COMPOSIÇÃO:
- Pessoa no centro (protagonista)
- Bandeira do Brasil ao fundo (desfocada, artística, ondulante)
- Respingos de tinta verde (#00843D) e amarelo (#FFCC29) nas laterais
- Efeitos de luz dourada irradiando
- Opcional: raios de luz, brilhos, partículas

TEXTO (se pedido no prompt):
- Texto em dourado 3D com contorno
- Fonte bold, impactante
- Posição: geralmente embaixo
- Efeito: relevo, sombra, brilho metálico
` : `
SEM FOTO:
- Criar símbolo/ilustração relacionada ao Brasil
- Estilo: arte digital vibrante
- Cores: verde e amarelo predominantes
- Composição com bandeira ao fundo
`}

PEDIDO DO USUÁRIO: "${prompt}"

OBRIGATÓRIO:
- Fundo 100% transparente (canal alfa)
- Qualidade de impressão profissional
- Sem mockups, modelos ou marcas d'água`;

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
