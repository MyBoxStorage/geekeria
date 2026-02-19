import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma.js';
import { sendVerificationEmail } from '../../utils/email.js';
import { generateVerifyToken } from '../../utils/emailVerification.js';
import { signupSchema } from './schemas.js';
import { sendError } from '../../utils/errorResponse.js';

const BLOCKED_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'spam4.me', 'trashmail.com', 'trashmail.me',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
  'maildrop.cc', 'fakeinbox.com', 'getairmail.com', 'filzmail.com',
  'owlpic.com', 'discard.email', 'spamherelots.com', 'binkmail.com',
];

/**
 * POST /api/auth/signup
 * Criar nova conta de usuário (requer verificação de e-mail para ganhar 5 créditos)
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Dados inválidos', { details: validation.error.issues });
      return;
    }

    const { email, password, name, phone } = validation.data;

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && BLOCKED_DOMAINS.includes(domain)) {
      sendError(res, req, 400, 'INVALID_EMAIL', 'Use um e-mail válido para se cadastrar');
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, req, 409, 'EMAIL_ALREADY_EXISTS', 'Email já cadastrado');
      return;
    }

    const verifyToken = generateVerifyToken();
    const verifyTokenExp = new Date(Date.now() + 15 * 60 * 1000);

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        phone: phone || null,
        credits: 0,
        emailVerified: false,
        verifyToken,
        verifyTokenExp,
      },
    });

    await sendVerificationEmail({
      name: name || 'Cliente',
      email,
      token: verifyToken,
    });

    console.log(`✅ New user registered (pending verification): ${newUser.email} (${newUser.id})`);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      userId: newUser.id,
      message: 'Verifique seu e-mail para ativar a conta',
    });
  } catch (error) {
    console.error('Signup error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao criar conta');
  }
}
