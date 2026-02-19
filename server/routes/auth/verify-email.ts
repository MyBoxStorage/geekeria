import type { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { generateToken } from '../../utils/authMiddleware.js';
import { isTokenExpired } from '../../utils/emailVerification.js';
import { sendError } from '../../utils/errorResponse.js';
import { sendWelcomeEmail } from '../../utils/email.js';

/**
 * POST /api/auth/verify-email
 * Confirma o e-mail com o código enviado e concede 5 créditos + JWT
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      sendError(res, req, 400, 'MISSING_FIELDS', 'userId e token são obrigatórios');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      sendError(res, req, 404, 'USER_NOT_FOUND', 'Usuário não encontrado');
      return;
    }
    if (user.emailVerified) {
      sendError(res, req, 400, 'ALREADY_VERIFIED', 'E-mail já verificado');
      return;
    }
    if (user.verifyToken !== token) {
      sendError(res, req, 400, 'INVALID_TOKEN', 'Código inválido');
      return;
    }
    if (isTokenExpired(user.verifyTokenExp)) {
      sendError(res, req, 400, 'TOKEN_EXPIRED', 'Código expirado. Solicite um novo');
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          verifyToken: null,
          verifyTokenExp: null,
          credits: 5,
        },
      }),
      prisma.creditLog.create({
        data: { userId, amount: 5, reason: 'SIGNUP' },
      }),
    ]);

    const jwt = generateToken(user.id, user.email);

    console.log(`✅ Email verified: ${user.email} (${user.id})`);

    sendWelcomeEmail({
      name: user.name || 'Cliente',
      email: user.email,
    }).catch((err) => console.error('Welcome email error:', err));

    res.json({
      success: true,
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: 5,
      },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao verificar e-mail');
  }
}
