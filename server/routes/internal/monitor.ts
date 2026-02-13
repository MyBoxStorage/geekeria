/**
 * GET /api/internal/monitor
 *
 * Protected monitoring endpoint (x-admin-token).
 * Detects: DB connectivity, PENDING orders too long, failed webhooks.
 * Returns only safe identifiers (externalReference, eventId); no PII.
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';

const PENDING_TOO_LONG_MINUTES = 15;
const FAILED_WEBHOOKS_LOOKBACK_HOURS = 24;
/** High risk: riskFlag=true or riskScore >= 60. No PII returned. */
const HIGH_RISK_SCORE_THRESHOLD = 60;

export async function monitorStatus(req: Request, res: Response) {
  const now = new Date();

  const thresholds = {
    pendingTooLongMinutes: PENDING_TOO_LONG_MINUTES,
    failedWebhooksLookbackHours: FAILED_WEBHOOKS_LOOKBACK_HOURS,
  };

  let dbOk = false;
  let pendingTooLong = { count: 0, examples: [] as string[] };
  let failedWebhooks = { count: 0, examples: [] as string[] };
  let countHighRiskLast24h = 0;
  let countHighRiskLast1h = 0;

  // A) DB connectivity
  try {
    await prisma.order.count({ take: 1 });
    dbOk = true;
  } catch {
    res.status(200).json({
      ok: false,
      now: now.toISOString(),
      thresholds,
      db: { ok: false },
      pendingTooLong,
      failedWebhooks,
      countHighRiskLast24h,
      countHighRiskLast1h,
    });
    return;
  }

  // B) PENDING too long (createdAt < now - 15 min)
  const pendingCutoff = new Date(now.getTime() - PENDING_TOO_LONG_MINUTES * 60 * 1000);
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: pendingCutoff },
      },
      select: { externalReference: true },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });
    const count = await prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: { lt: pendingCutoff },
      },
    });
    pendingTooLong = {
      count,
      examples: pendingOrders.map((o: { externalReference: string }) => o.externalReference),
    };
  } catch {
    // If query fails, leave count 0 and examples []
  }

  // C) Failed webhooks in last 24h (status === 'failed', receivedAt >= now - 24h)
  const webhookCutoff = new Date(now.getTime() - FAILED_WEBHOOKS_LOOKBACK_HOURS * 60 * 60 * 1000);
  try {
    const failedEvents = await prisma.webhookEvent.findMany({
      where: {
        status: 'failed',
        receivedAt: { gte: webhookCutoff },
      },
      select: { eventId: true },
      orderBy: { receivedAt: 'desc' },
      take: 5,
    });
    const count = await prisma.webhookEvent.count({
      where: {
        status: 'failed',
        receivedAt: { gte: webhookCutoff },
      },
    });
    failedWebhooks = {
      count,
      examples: failedEvents.map((e: { eventId: string }) => e.eventId),
    };
  } catch {
    // If query fails, leave count 0 and examples []
  }

  // D) High-risk orders (riskFlag=true or riskScore >= 60) — counts only, no PII
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  try {
    const [last1h, last24h] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: oneHourAgo },
          OR: [
            { riskFlag: true },
            { riskScore: { gte: HIGH_RISK_SCORE_THRESHOLD } },
          ],
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          OR: [
            { riskFlag: true },
            { riskScore: { gte: HIGH_RISK_SCORE_THRESHOLD } },
          ],
        },
      }),
    ]);
    countHighRiskLast24h = last24h;
    countHighRiskLast1h = last1h;
  } catch {
    // If query fails, leave counts 0
  }

  const ok =
    dbOk &&
    pendingTooLong.count === 0 &&
    failedWebhooks.count === 0 &&
    countHighRiskLast1h < 5 &&
    countHighRiskLast24h < 30;

  res.status(200).json({
    ok,
    now: now.toISOString(),
    thresholds,
    db: { ok: dbOk },
    pendingTooLong,
    failedWebhooks,
    countHighRiskLast24h,
    countHighRiskLast1h,
  });
}
