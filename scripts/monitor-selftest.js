#!/usr/bin/env node
/**
 * Monitor self-test — validates that failed/ignored webhook logic is correct.
 *
 * 1) Inserts 1 fake webhook_event (status=failed, error=MP_PAYMENT_NOT_FOUND_404)
 * 2) Normalizes locally: failed + MP_PAYMENT_NOT_FOUND_404 => ignored
 * 3) Calls GET /api/internal/monitor and asserts:
 *    - failedWebhooks.count did NOT increase (selftest record is ignored, not failed)
 *    - ignoredWebhooksLast24h.count increased by +1
 * 4) Cleanup: deletes selftest records
 *
 * Does NOT require Mercado Pago secrets. Runs manually only (not in cron).
 * Usage: API_URL=<url> ADMIN_TOKEN=<token> [DATABASE_URL=<url>] node scripts/monitor-selftest.js
 *        Or: node scripts/monitor-selftest.js <API_URL> <ADMIN_TOKEN>
 *
 * Loads server/.env for DATABASE_URL if not in env.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', 'server', '.env') });

const API_URL = process.env.API_URL || process.env.MONITOR_API_URL || (process.argv[2] || '').replace(/\/$/, '');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.argv[3];

if (!API_URL || !ADMIN_TOKEN) {
  console.error('Usage: API_URL=<url> ADMIN_TOKEN=<token> node scripts/monitor-selftest.js');
  console.error('   Or: node scripts/monitor-selftest.js <API_URL> <ADMIN_TOKEN>');
  process.exit(1);
}

const prisma = new PrismaClient();
const EVENT_ID = `selftest-404-${Date.now()}`;

async function fetchMonitor() {
  const res = await fetch(`${API_URL}/api/internal/monitor`, {
    method: 'GET',
    headers: {
      'x-admin-token': ADMIN_TOKEN,
      Accept: 'application/json',
    },
  });
  if (res.status !== 200) throw new Error(`monitor status ${res.status}`);
  return res.json();
}

async function cleanup() {
  const r = await prisma.webhookEvent.deleteMany({
    where: { eventId: { startsWith: 'selftest-404-' } },
  });
  if (r.count > 0) console.log(`[CLEANUP] deleted ${r.count} selftest record(s)`);
}

async function main() {
  try {
    // Baseline
    const baseline = await fetchMonitor();
    const baselineFailed = baseline.failedWebhooks?.count ?? 0;
    const baselineIgnored = baseline.ignoredWebhooksLast24h?.count ?? 0;

    // 3.1) Insert fake webhook_event
    await prisma.webhookEvent.create({
      data: {
        provider: 'mercadopago',
        eventId: EVENT_ID,
        eventType: 'payment',
        receivedAt: new Date(),
        processedAt: new Date(),
        payload: {},
        status: 'failed',
        errorMessage: 'MP_PAYMENT_NOT_FOUND_404',
      },
    });

    // 3.2) Normalize: failed + MP_PAYMENT_NOT_FOUND_404 => ignored
    await prisma.webhookEvent.updateMany({
      where: {
        status: 'failed',
        errorMessage: 'MP_PAYMENT_NOT_FOUND_404',
        eventId: { startsWith: 'selftest-404-' },
      },
      data: { status: 'ignored' },
    });

    // 3.3) Call monitor and assert
    const after = await fetchMonitor();
    const afterFailed = after.failedWebhooks?.count ?? 0;
    const afterIgnored = after.ignoredWebhooksLast24h?.count ?? 0;

    const failedOk = afterFailed === baselineFailed;
    const ignoredOk = afterIgnored >= baselineIgnored + 1;

    if (!failedOk) {
      console.error(`[FAIL] failedWebhooks.count changed: baseline=${baselineFailed} after=${afterFailed} (expected unchanged)`);
    }
    if (!ignoredOk) {
      console.error(`[FAIL] ignoredWebhooksLast24h.count did not increase: baseline=${baselineIgnored} after=${afterIgnored} (expected +1)`);
    }
    if (!failedOk || !ignoredOk) {
      await cleanup();
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log('[PASS] failedWebhooks unchanged, ignoredWebhooksLast24h +1');
  } finally {
    await cleanup();
  }
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('[FAIL]', e.message || String(e));
  try {
    await cleanup();
  } catch {}
  await prisma.$disconnect();
  process.exit(1);
});
