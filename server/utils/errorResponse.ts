/**
 * Standardized error envelope for all API error responses.
 *
 * Shape:
 *   { ok: false, error: string, message: string, requestId: string, ...extra }
 *
 * `extra` allows route-specific fields (e.g. retryAfterSeconds) without
 * breaking the base contract.
 */

import type { Request, Response } from 'express';

export function sendError(
  res: Response,
  req: Request,
  status: number,
  error: string,
  message: string,
  extra?: Record<string, unknown>,
): void {
  const requestId = (req as Request & { requestId?: string }).requestId ?? 'unknown';

  // Guarantee the header is present even if requestContext middleware didn't run
  // (e.g. errors thrown during body parsing, before middleware chain completes).
  if (!res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', requestId);
  }

  res.status(status).json({
    ok: false,
    error,
    message,
    requestId,
    ...extra,
  });
}
