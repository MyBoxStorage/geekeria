import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma.js';
import { sendWelcomeEmail } from '../../utils/email.js';
import { signupSchema } from './schemas.js';
import { generateToken } from '../../utils/authMiddleware.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * POST /api/auth/signup
 * Criar nova conta de usuário (ganha 5 créditos grátis)
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Dados inválidos', { details: validation.error.issues });
      return;
    }

    const { email, password, name, phone } = validation.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, req, 409, 'EMAIL_ALREADY_EXISTS', 'Email já cadastrado');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          phone: phone || null,
          credits: 5,
        },
      });

      await tx.creditLog.create({
        data: {
          userId: newUser.id,
          amount: 5,
          reason: 'SIGNUP',
        },
      });

      return newUser;
    });

    const token = generateToken(user.id, user.email);

    console.log(`✅ New user registered: ${user.email} (${user.id})`);

    // Enviar email de boas-vindas (não bloqueia o response)
    sendWelcomeEmail({
      name: user.name || 'Cliente',
      email: user.email,
    }).catch((err) => console.error('Email error:', err));

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao criar conta');
  }
}
