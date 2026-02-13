#!/usr/bin/env node
/**
 * Monitor check — calls GET /api/internal/monitor with x-admin-token.
 * Fails if ok=false (DB down, pending too long, failed webhooks, or high-risk counts above threshold).
 * Logs only counts; no PII.
 * Usage: node scripts/monitor-check.js <API_URL> <ADMIN_TOKEN>
 */

const API_URL = (process.argv[2] || '').replace(/\/$/, '');
const ADMIN_TOKEN = process.argv[3];

if (!API_URL || !ADMIN_TOKEN) {
  console.error('Usage: node scripts/monitor-check.js <API_URL> <ADMIN_TOKEN>');
  process.exit(1);
}

async function main() {
  try {
    const res = await fetch(`${API_URL}/api/internal/monitor`, {
      method: 'GET',
      headers: {
        'x-admin-token': ADMIN_TOKEN,
        Accept: 'application/json',
      },
    });

    if (res.status !== 200) {
      console.log(`[FAIL] status=${res.status}`);
      process.exit(1);
    }

    const data = await res.json();

    if (data.ok === true) {
      console.log('[PASS] ok=true');
      if (data.countHighRiskLast1h != null || data.countHighRiskLast24h != null) {
        console.log(`[INFO] highRisk last1h=${data.countHighRiskLast1h ?? 0} last24h=${data.countHighRiskLast24h ?? 0}`);
      }
      process.exit(0);
    }

    const parts = [];
    if (data.pendingTooLong?.count > 0) parts.push(`pendingTooLong=${data.pendingTooLong.count}`);
    if (data.failedWebhooks?.count > 0) parts.push(`failedWebhooks=${data.failedWebhooks.count}`);
    if (!data.db?.ok) parts.push('db=down');
    if (data.countHighRiskLast1h != null && data.countHighRiskLast1h >= 5) {
      parts.push(`highRiskLast1h=${data.countHighRiskLast1h}`);
    }
    if (data.countHighRiskLast24h != null && data.countHighRiskLast24h >= 30) {
      parts.push(`highRiskLast24h=${data.countHighRiskLast24h}`);
    }
    console.log('[FAIL] ok=false', parts.length ? parts.join(' ') : '');
    process.exit(1);
  } catch (e) {
    console.log('[FAIL]', e.message || String(e));
    process.exit(1);
  }
}

main();
