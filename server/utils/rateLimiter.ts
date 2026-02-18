/**
 * Rate limiter abstraction (in-memory by default).
 * Structured so the store can be swapped (e.g. Redis) without changing route usage.
 */

import type { Request, Response, NextFunction } from 'express';
import { sendError } from './errorResponse.js';

/**
 * Resolve the real client IP from a request.
 *
 * Priority:
 *  1. req.ip — Express parses x-forwarded-for respecting `trust proxy` setting.
 *     With `app.set('trust proxy', 1)` this is the right-most untrusted IP.
 *  2. fly-client-ip — Fly.io injects the real client IP in this header.
 *  3. x-forwarded-for first entry — manual fallback (parsed, trimmed).
 *  4. req.socket.remoteAddress — direct connection.
 *  5. 'unknown' — last resort (never returns null).
 */
export function resolveClientIp(req: Request): string {
  // 1. req.ip (trust proxy already configured)
  if (req.ip) return req.ip;

  // 2. Fly.io specific header
  const fly = req.headers['fly-client-ip'];
  if (fly && typeof fly === 'string') return fly.trim();

  // 3. x-forwarded-for first entry (manual parse)
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = (Array.isArray(xff) ? xff[0] : xff.split(',')[0])?.trim();
    if (first) return first;
  }

  // 4. Direct socket
  if (req.socket?.remoteAddress) return req.socket.remoteAddress;

  return 'unknown';
}

export type RateLimitEntry = {
  count: number;
  firstRequestAt: number;
};

/** Store interface: swap for Redis later without touching routes. */
export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
}

const defaultStore: RateLimitStore = (() => {
  const memory: Record<string, RateLimitEntry> = {};
  return {
    get(key) {
      return memory[key];
    },
    set(key, entry) {
      memory[key] = entry;
    },
  };
})();

export interface RateLimiterConfig {
  routeKey: string;
  maxRequests: number;
  windowMs: number;
  store?: RateLimitStore;
}

/**
 * Returns Express middleware that enforces rate limit per IP + routeKey.
 * Uses in-memory store unless config.store is provided (e.g. Redis-backed store later).
 */
export function createRateLimiter(
  config: RateLimiterConfig
): (req: Request, res: Response, next: NextFunction) => void {
  const { routeKey, maxRequests, windowMs, store = defaultStore } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = resolveClientIp(req);
      const key = `${ip}:${routeKey}`;
      const now = Date.now();
      const entry = store.get(key);

      if (!entry) {
        store.set(key, { count: 1, firstRequestAt: now });
        return next();
      }

      const elapsed = now - entry.firstRequestAt;

      if (elapsed > windowMs) {
        store.set(key, { count: 1, firstRequestAt: now });
        return next();
      }

      if (entry.count >= maxRequests) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        res.setHeader('Retry-After', String(retryAfterSeconds));
        sendError(res, req, 429, 'RATE_LIMITED', 'Muitas requisições. Aguarde um pouco e tente novamente.', { retryAfterSeconds });
        return;
      }

      store.set(key, { ...entry, count: entry.count + 1 });
      next();
    } catch {
      next();
    }
  };
}
