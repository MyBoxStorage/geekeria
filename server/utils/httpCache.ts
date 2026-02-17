/**
 * HTTP caching helpers — ETag + Cache-Control + 304 Not Modified.
 *
 * Usage:
 *   sendCachedJson(req, res, payload);            // default public catalog TTL
 *   sendCachedJson(req, res, payload, 'private');  // custom Cache-Control
 */

import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

/** Default Cache-Control for public catalog endpoints. */
const DEFAULT_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

/**
 * Compute a weak ETag from a JSON-serialisable payload.
 * Uses SHA-1 (fast, collision-resistant enough for HTTP ETag).
 */
export function computeEtag(payload: unknown): string {
  const json = JSON.stringify(payload);
  const hash = createHash('sha1').update(json).digest('hex');
  return `W/"${hash}"`;
}

/**
 * Send a JSON response with ETag / Cache-Control headers.
 *
 * - If the client sends `If-None-Match` matching the current ETag → 304.
 * - Otherwise → 200 with full body + cache headers.
 */
export function sendCachedJson(
  req: Request,
  res: Response,
  payload: unknown,
  cacheControl: string = DEFAULT_CACHE_CONTROL,
): void {
  const etag = computeEtag(payload);

  const clientEtag = req.headers['if-none-match'];
  if (clientEtag && clientEtag === etag) {
    res.status(304).end();
    return;
  }

  res
    .set('ETag', etag)
    .set('Cache-Control', cacheControl)
    .set('Vary', 'Accept-Encoding')
    .json(payload);
}
