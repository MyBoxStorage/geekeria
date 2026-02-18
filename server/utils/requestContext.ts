/**
 * Request context middleware — requestId + response duration logging.
 *
 * - Generates a unique requestId per request (reuses X-Request-Id if provided).
 * - Attaches requestId to req for downstream use.
 * - Sets X-Request-Id response header.
 * - Logs { event, method, path, status, durationMs, requestId } on response finish.
 */

import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

/* ── Extend Express Request with requestId ─────────────────────────────── */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/* ── Middleware ─────────────────────────────────────────────────────────── */

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Reuse client-provided id or generate a new one
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.trim()
      ? incoming.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - start);

    logger.info('http_request', {
      event: 'http_request',
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      requestId,
    });
  });

  next();
}
