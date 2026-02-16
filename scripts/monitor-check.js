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

    // Info logs (always show for observability)
    if (data.countHighRiskLast1h != null || data.countHighRiskLast24h != null) {
      console.log(`[INFO] highRisk last1h=${data.countHighRiskLast1h ?? 0} last24h=${data.countHighRiskLast24h ?? 0}`);
    }
    if (data.abandonedPending?.count != null && data.abandonedPending.count > 0) {
      console.log(`[INFO] abandonedPending=${data.abandonedPending.count} (non-blocking)`);
    }
    if (data.pendingTooLong?.count > 0) {
      console.log(`[WARN] pendingTooLong=${data.pendingTooLong.count} examples=${(data.pendingTooLong.examples || []).join(',')}`);
    }

    if (data.ok === true) {
      console.log('[PASS] ok=true');
      process.exit(0);
    }

    // Determine severity — only hard-fail on critical issues
    const hardFail = [];
    const softWarn = [];

    if (!data.db?.ok) hardFail.push('db=down');
    if (data.failedWebhooks?.count > 0) hardFail.push(`failedWebhooks=${data.failedWebhooks.count}`);
    if (data.countHighRiskLast1h != null && data.countHighRiskLast1h >= 5) {
      hardFail.push(`highRiskLast1h=${data.countHighRiskLast1h}`);
    }
    if (data.countHighRiskLast24h != null && data.countHighRiskLast24h >= 30) {
      hardFail.push(`highRiskLast24h=${data.countHighRiskLast24h}`);
    }

    // pendingTooLong: only hard-fail if count > 5 (few stuck orders = warn only)
    const PENDING_HARD_FAIL_THRESHOLD = 5;
    if (data.pendingTooLong?.count > PENDING_HARD_FAIL_THRESHOLD) {
      hardFail.push(`pendingTooLong=${data.pendingTooLong.count}(>${PENDING_HARD_FAIL_THRESHOLD})`);
    } else if (data.pendingTooLong?.count > 0) {
      softWarn.push(`pendingTooLong=${data.pendingTooLong.count}(<=${PENDING_HARD_FAIL_THRESHOLD})`);
    }

    if (hardFail.length > 0) {
      console.log('[FAIL] ok=false', hardFail.join(' '), softWarn.length ? `(warn: ${softWarn.join(' ')})` : '');
      process.exit(1);
    }

    // Only soft warnings — pass with warnings
    if (softWarn.length > 0) {
      console.log('[PASS] ok=false (soft warnings only)', softWarn.join(' '));
      process.exit(0);
    }

    // Fallback: unknown failure reason
    console.log('[FAIL] ok=false (unknown reason)');
    process.exit(1);
  } catch (e) {
    console.log('[FAIL]', e.message || String(e));
    process.exit(1);
  }
}

main();
