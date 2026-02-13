#!/usr/bin/env node
/**
 * Reconcile pending — calls POST /api/internal/reconcile-pending with x-admin-token.
 * Usage: node scripts/reconcile-pending.js <API_URL> <ADMIN_TOKEN>
 * Exit 0 if ok:true, 1 otherwise. Does not print the token.
 */

const API_URL = (process.argv[2] || '').replace(/\/$/, '');
const ADMIN_TOKEN = process.argv[3];

if (!API_URL || !ADMIN_TOKEN) {
  console.error('Usage: node scripts/reconcile-pending.js <API_URL> <ADMIN_TOKEN>');
  process.exit(1);
}

async function main() {
  try {
    const res = await fetch(`${API_URL}/api/internal/reconcile-pending`, {
      method: 'POST',
      headers: {
        'x-admin-token': ADMIN_TOKEN,
        'x-monitor-source': 'cron',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ olderThanMinutes: 15, limit: 25 }),
    });

    if (res.status !== 200) {
      console.log(`[FAIL] status=${res.status}`);
      process.exit(1);
    }

    const data = await res.json();

    if (data.ok === true) {
      console.log(
        `[OK] checked=${data.checked} updated=${data.updated} skipped=${data.skippedMissingPaymentId || 0} errors=${data.errors || 0}`
      );
      process.exit(0);
    }

    console.log('[FAIL] ok=false');
    process.exit(1);
  } catch (e) {
    console.log('[FAIL]', e.message || String(e));
    process.exit(1);
  }
}

main();
