import type { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateStampSchema } from './schemas.js';
import { prisma } from '../../utils/prisma.js';
import type { AuthRequest } from '../../types/auth.js';
import { uploadImageToGCS } from '../../utils/storage.js';
import { notifyNewGeneration } from '../../utils/telegram.js';
import { sendError } from '../../utils/errorResponse.js';

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
    // Feature guard: fail clearly if generation deps are not configured
    const missingDeps = [
      !process.env.GEMINI_API_KEY && 'GEMINI_API_KEY',
      !process.env.GCS_KEY_BASE64 && process.env.NODE_ENV === 'production' && 'GCS_KEY_BASE64',
    ].filter(Boolean) as string[];

    if (missingDeps.length > 0) {
      sendError(res, req, 503, 'SERVICE_UNAVAILABLE', 'O serviço de geração de estampas não está configurado neste ambiente.', { missing: missingDeps });
      return;
    }

    if (!req.user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Não autenticado');
      return;
    }

    const validation = generateStampSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Dados inválidos', { details: validation.error.issues });
      return;
    }

    const { prompt, uploadedImage } = validation.data;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, email: true, name: true, phone: true },
    });

    if (!user || user.credits < 1) {
      sendError(res, req, 403, 'NO_CREDITS', 'Compre um produto para ganhar +5 créditos', { credits: user?.credits || 0 });
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
      const hasTextRequest =
        prompt.toLowerCase().includes('texto') ||
        prompt.toLowerCase().includes('frase') ||
        prompt.toLowerCase().includes('palavra') ||
        prompt.toLowerCase().includes('escrito') ||
        prompt.toLowerCase().includes('escrita') ||
        prompt.toLowerCase().includes('escrever') ||
        prompt.toLowerCase().includes('letras') ||
        !!prompt.toLowerCase().match(/"[^"]+"/) ||
        !!prompt.toLowerCase().match(/'[^']+'/);

      const defaultPrompt = `TAREFA: Criar arte PROFISSIONAL para estampa de camiseta (impressão DTF, 300 DPI, PNG transparente, 3:4).

ESTILO: Ilustração digital vibrante inspirada em arte de camiseta premium.

IMAGEM ENVIADA: {{UPLOADED_IMAGE}}
{{UPLOADED_IMAGE}} = SIM: Use as instruções de imagem abaixo.
{{UPLOADED_IMAGE}} = NÃO: Use as instruções sem foto abaixo.

Se {{UPLOADED_IMAGE}} = SIM:
IMAGEM ENVIADA - ANÁLISE E ADAPTAÇÃO:
1. ANALISE o conteúdo: pessoa, família, pet, objeto, paisagem, etc.
2. TRANSFORME em arte de estampa mantendo o TEMA CENTRAL reconhecível
3. ADAPTE a composição para camiseta:
   - Se pessoa sozinha: formato busto/retrato (ombros para cima)
   - Se família/grupo: enquadre todos dentro da composição
   - Se pet/animal: centralize o animal, composição fechada
   - Se objeto: destaque o objeto centralizado
   - Se paisagem: adapte para formato vertical/quadrado

IMPORTANTE:
- NÃO deixe elementos saindo da composição (braços, pernas cortadas)
- Composição FECHADA e equilibrada
- Arte deve caber perfeitamente em uma camiseta
- Mantenha características reconhecíveis do conteúdo original
- Cores naturais preservadas (só altere se pedido)

ELEMENTOS BRASILEIROS (sutis):
- Bandeira do Brasil desfocada ao fundo
- Respingos de tinta verde (#00843D) e amarelo (#FFCC29)
- Efeitos de luz dourada
- Elementos decorativos discretos

Se {{UPLOADED_IMAGE}} = NÃO:
SEM FOTO:
- Criar ilustração original relacionada ao tema brasileiro
- Estilo: arte de camiseta profissional
- Composição equilibrada para impressão

BANDEIRAS E ELEMENTOS VISUAIS:
- Se o usuário pedir "bandeira do Brasil E Estados Unidos" ou similar: mostrar AMBAS as bandeiras
- Se pedir "bandeira do Brasil" apenas: mostrar só bandeira do Brasil
- Se pedir elementos de múltiplos países: incluir TODOS os elementos pedidos

PEDIDO DO USUÁRIO: "{{USER_PROMPT}}"

TEXTO SOLICITADO: {{HAS_TEXT}}
Se {{HAS_TEXT}} = SIM:
- Texto em dourado 3D com contorno
- Fonte bold, impactante
- Posição: embaixo ou conforme pedido
- Efeito: relevo, sombra, brilho metálico
- IMPORTANTE: Incluir exatamente o texto que o usuário pediu

Se {{HAS_TEXT}} = NÃO:
- Não adicione textos, palavras ou frases (usuário não pediu).

OBRIGATÓRIO:
- Fundo 100% transparente (PNG com canal alfa)
- Sem mockups, modelos ou marcas d'água
- Qualidade profissional de impressão
- Proporção adequada para camiseta`;

      const activeTemplate = await prisma.promptTemplate.findFirst({
        where: { isActive: true },
      });

      const systemPrompt = activeTemplate?.content ?? defaultPrompt;

      const fullPrompt = systemPrompt
        .replace(/\{\{UPLOADED_IMAGE\}\}/g, uploadedImage ? 'SIM' : 'NÃO')
        .replace(/\{\{USER_PROMPT\}\}/g, prompt)
        .replace(/\{\{HAS_TEXT\}\}/g, hasTextRequest ? 'SIM' : 'NÃO');

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

      // Upload para Google Cloud Storage
      const fileName = `${user.email.replace('@', '_at_')}_${prompt
        .slice(0, 30)
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()}_${Date.now()}.png`;

      const imageUrl = await uploadImageToGCS(imageBase64, fileName);

      // Atualizar geração com URL assinada (não salvar base64)
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          imageUrl, // URL assinada, não base64
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

      // Notificar admin no Telegram
      await notifyNewGeneration({
        userName: user.name || 'Sem nome',
        userEmail: user.email,
        userPhone: user.phone || undefined,
        prompt,
        imageUrl,
        creditsRemaining: updatedUser.credits,
      });

      res.json({
        success: true,
        image: imageUrl,
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

      sendError(res, req, 500, 'GENERATION_FAILED', 'Tente novamente. Seu crédito não foi consumido.');
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Generate stamp error:', err);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro interno do servidor');
  }
}
