import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma.js';
import { loginSchema } from './schemas.js';
import { generateToken } from '../../utils/authMiddleware.js';
import { sendError } from '../../utils/errorResponse.js';

/**
 * POST /api/auth/login
 * Fazer login com email e senha
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, req, 400, 'VALIDATION_ERROR', 'Dados inválidos', { details: validation.error.issues });
      return;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, req, 401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos');
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      sendError(res, req, 401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos');
      return;
    }

    const token = generateToken(user.id, user.email);

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
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
    console.error('Login error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao fazer login');
  }
}
