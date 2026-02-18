/**
 * Centralized admin token validation middleware.
 *
 * Features:
 * - Structured audit log on invalid attempts (never logs the token itself)
 * - Penalty delay (250–750 ms) on invalid/missing token to slow brute-force
 * - Consistent 401 JSON response across all admin routes
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';
import { resolveClientIp } from './rateLimiter.js';
import { adminAuthPenaltyDelay } from './security.js';
import { sendError } from './errorResponse.js';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function validateAdminToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers['x-admin-token'] as string;

  if (!ADMIN_TOKEN) {
    logger.error('ADMIN_TOKEN not configured in environment');
    sendError(res, req, 500, 'SERVER_CONFIG_ERROR', 'Token administrativo não configurado');
    return;
  }

  if (!token || token !== ADMIN_TOKEN) {
    const ip = resolveClientIp(req);

    logger.warn('admin_auth_failed', {
      event: 'admin_auth_failed',
      method: req.method,
      path: req.originalUrl,
      ip,
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      hasToken: !!token,
    });

    await adminAuthPenaltyDelay();

    sendError(res, req, 401, 'UNAUTHORIZED_ADMIN', 'Token administrativo inválido');
    return;
  }

  next();
}
