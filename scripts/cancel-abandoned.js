#!/usr/bin/env node
/**
 * Cancel abandoned — cancela pedidos PENDING sem mp_payment_id (carrinho abandonado).
 * 1) Chama POST /api/internal/cancel-abandoned com dryRun=true e imprime summary.
 * 2) Se --apply ou APPLY=true, chama novamente com dryRun=false.
 *
 * Usage: node scripts/cancel-abandoned.js <API_URL> <ADMIN_TOKEN> [--apply]
 *   Or: API_URL=<url> ADMIN_TOKEN=<token> [APPLY=true] node scripts/cancel-abandoned.js [--apply]
 * Loads server/.env for ADMIN_TOKEN if not in env.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', 'server', '.env') });

const API_URL = (process.argv[2] || process.env.API_URL || process.env.MONITOR_API_URL || '').replace(/\/$/, '');
const ADMIN_TOKEN = process.argv[3] || process.env.ADMIN_TOKEN;
const APPLY = process.argv.includes('--apply') || process.env.APPLY === 'true' || process.env.APPLY === '1';

if (!API_URL || !ADMIN_TOKEN) {
  console.error('Usage: node scripts/cancel-abandoned.js <API_URL> <ADMIN_TOKEN> [--apply]');
  console.error('   Or: API_URL=<url> ADMIN_TOKEN=<token> [APPLY=true] node scripts/cancel-abandoned.js [--apply]');
  process.exit(1);
}

const OLDER_THAN_MINUTES = parseInt(process.env.OLDER_THAN_MINUTES || '60', 10);
const LIMIT = parseInt(process.env.LIMIT || '100', 10);

async function callCancelAbandoned(dryRun) {
  const res = await fetch(`${API_URL}/api/internal/cancel-abandoned`, {
    method: 'POST',
    headers: {
      'x-admin-token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      olderThanMinutes: OLDER_THAN_MINUTES,
      limit: LIMIT,
      dryRun,
    }),
  });

  if (res.status !== 200) {
    const text = await res.text();
    throw new Error(`cancel-abandoned ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  try {
    // 1) Dry run
    const dry = await callCancelAbandoned(true);
    console.log('[DRYRUN]', dry.message || `affected=${dry.affected}`);
    if (dry.examples?.length > 0) {
      console.log('[DRYRUN] examples:', dry.examples.slice(0, 5).join(', '));
    }

    if (!APPLY) {
      console.log('[INFO] Use --apply or APPLY=true to apply changes.');
      process.exit(0);
    }

    if (dry.affected === 0) {
      console.log('[OK] Nothing to apply.');
      process.exit(0);
    }

    // 2) Apply
    const applied = await callCancelAbandoned(false);
    console.log('[APPLIED]', applied.message || `affected=${applied.affected}`);
    process.exit(0);
  } catch (e) {
    console.error('[FAIL]', e.message || String(e));
    process.exit(1);
  }
}

main();
