import jwt from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import { prisma } from './prisma.js';
import type { AuthRequest, JWTPayload } from '../types/auth.js';
import { sendError } from './errorResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: JWT_SECRET not set in production!');
}

/**
 * Middleware: Requer autenticação JWT
 * Adiciona req.user com dados do usuário autenticado
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Token não fornecido');
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Token inválido ou expirado');
      return;
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        credits: true,
        name: true,
      },
    });

    if (!user) {
      sendError(res, req, 401, 'UNAUTHORIZED', 'Usuário não encontrado');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro de autenticação');
  }
}

/**
 * Middleware: Autenticação opcional
 * Se houver token válido, preenche req.user; caso contrário, segue sem erro
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, credits: true, name: true },
    });

    if (user) req.user = user;
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
}

/**
 * Gera token JWT para um usuário
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as JWTPayload, JWT_SECRET, { expiresIn: '30d' });
}
