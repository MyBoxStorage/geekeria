#!/usr/bin/env node
/**
 * E2E Smoke (Staging) — cria pedidos nos 3 fluxos e valida admin + tracking.
 *
 * Uso:
 *   BASE_URL=https://staging.example.com ADMIN_TOKEN=xxx [PRODUCT_ID=xxx] node scripts/e2e-smoke-staging.js
 *
 * PRODUCT_ID: id de um produto existente no banco (obrigatório para create-order/create-preference/create-payment).
 * Não altera schema; só leitura/escrita via API.
 */

const BASE_URL = (process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PRODUCT_ID = process.env.PRODUCT_ID || 'test-product-id';

const TEST_EMAIL = 'test@exemplo.com';
const TEST_PAYER = { name: 'Test User', email: TEST_EMAIL };

if (!ADMIN_TOKEN) {
  console.error('ADMIN_TOKEN is required. Set it in the environment.');
  process.exit(1);
}

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-admin-token': ADMIN_TOKEN,
};

function log(label, data) {
  console.log(`\n--- ${label} ---`);
  if (typeof data === 'object') console.log(JSON.stringify(data, null, 2));
  else console.log(data);
}

async function createOrder() {
  const body = {
    payer: TEST_PAYER,
    items: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 99.9 }],
  };
  const res = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    throw new Error(`create-order ${res.status}: ${JSON.stringify(data)}`);
  }
  return { externalReference: data.externalReference, email: TEST_EMAIL };
}

async function createPreference() {
  const body = {
    items: [
      {
        productId: PRODUCT_ID,
        quantity: 1,
        unitPrice: 99.9,
        name: 'Produto Teste E2E',
      },
    ],
    payer: TEST_PAYER,
    amount: 99.9,
  };
  const res = await fetch(`${BASE_URL}/api/mp/create-preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    throw new Error(`create-preference ${res.status}: ${JSON.stringify(data)}`);
  }
  return { externalReference: data.externalReference, email: TEST_EMAIL };
}

async function createPayment() {
  const body = {
    items: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 99.9 }],
    payer: TEST_PAYER,
    amount: 99.9,
    paymentMethod: 'pix',
  };
  const res = await fetch(`${BASE_URL}/api/mp/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    throw new Error(`create-payment ${res.status}: ${JSON.stringify(data)}`);
  }
  return { externalReference: data.externalReference, email: TEST_EMAIL };
}

async function adminListPending() {
  const res = await fetch(
    `${BASE_URL}/api/admin/orders?status=PENDING&limit=50`,
    { headers: adminHeaders }
  );
  const data = await res.json().catch(() => ({}));
  if (res.status !== 200) throw new Error(`admin list ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function adminExport(ref) {
  const res = await fetch(`${BASE_URL}/api/admin/orders/${encodeURIComponent(ref)}/export`, {
    headers: adminHeaders,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== 200) throw new Error(`admin export ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function publicTracking(ref, email) {
  const res = await fetch(
    `${BASE_URL}/api/orders/${encodeURIComponent(ref)}?email=${encodeURIComponent(email)}`,
    { headers: { Accept: 'application/json' } }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function recordFromList(listRes, ref) {
  const order = (listRes.orders || []).find((o) => o.externalReference === ref);
  return order
    ? {
        riskScore: order.riskScore,
        riskFlag: order.riskFlag,
        riskReasons: order.riskReasons,
        ipAddress: order.ipAddress != null ? 'present' : 'null',
        userAgent: order.userAgent != null ? 'present' : 'null',
      }
    : null;
}

async function validateOrder(ref, email, flowName) {
  const listRes = await adminListPending();
  const record = recordFromList(listRes, ref);
  const exportData = await adminExport(ref);
  const riskExport = exportData.risk || {};
  const track = await publicTracking(ref, email);

  const out = {
    flow: flowName,
    externalReference: ref,
    adminList: record,
    exportRisk: {
      score: riskExport.score,
      flag: riskExport.flag,
      reasons: riskExport.reasons,
      ipAddress: riskExport.ipAddress != null ? 'present' : 'null',
      userAgent: riskExport.userAgent != null ? 'present' : 'null',
    },
    trackingStatus: track.status,
    trackingHasMaskedEmail: track.data?.payerEmailMasked != null,
  };
  log(`${flowName} validation`, out);
  return out;
}

async function adversarialGetOrder(ref, email, count = 65) {
  const results = { ok: 0, err: 0, status429: 0 };
  const requests = Array.from({ length: count }, () =>
    fetch(
      `${BASE_URL}/api/orders/${encodeURIComponent(ref)}?email=${encodeURIComponent(email)}`,
      { headers: { Accept: 'application/json' } }
    )
  );
  const responses = await Promise.all(requests);
  responses.forEach((res) => {
    if (res.status === 200) results.ok++;
    else if (res.status === 429) results.status429++;
    else results.err++;
  });
  log('Adversarial (rapid GET /api/orders)', {
    totalRequests: count,
    ...results,
    note: 'Limit is 60 per 5 min per IP; expect 429 after 60.',
  });
  return results;
}

async function main() {
  const results = [];

  try {
    log('Env', { BASE_URL, PRODUCT_ID: PRODUCT_ID.substring(0, 12) + '...', hasAdminToken: !!ADMIN_TOKEN });

    // 1) Create order (checkout flow — backend part)
    let ref1, email1;
    try {
      const out = await createOrder();
      ref1 = out.externalReference;
      email1 = out.email;
      log('1) create-order', { externalReference: ref1 });
      results.push(await validateOrder(ref1, email1, 'create-order'));
    } catch (e) {
      log('1) create-order FAIL', e.message);
      results.push({ flow: 'create-order', error: e.message, stack: e.stack });
    }

    // 2) Create preference
    let ref2, email2;
    try {
      const out = await createPreference();
      ref2 = out.externalReference;
      email2 = out.email;
      log('2) create-preference', { externalReference: ref2 });
      results.push(await validateOrder(ref2, email2, 'create-preference'));
    } catch (e) {
      log('2) create-preference FAIL', e.message);
      results.push({ flow: 'create-preference', error: e.message, stack: e.stack });
    }

    // 3) Create payment
    let ref3, email3;
    try {
      const out = await createPayment();
      ref3 = out.externalReference;
      email3 = out.email;
      log('3) create-payment', { externalReference: ref3 });
      results.push(await validateOrder(ref3, email3, 'create-payment'));
    } catch (e) {
      log('3) create-payment FAIL', e.message);
      results.push({ flow: 'create-payment', error: e.message, stack: e.stack });
    }

    // 4) Adversarial — use first available ref
    const refForRate = ref1 || ref2 || ref3;
    const emailForRate = email1 || email2 || email3;
    if (refForRate && emailForRate) {
      try {
        await adversarialGetOrder(refForRate, emailForRate, 65);
      } catch (e) {
        log('4) adversarial FAIL', e.message);
      }
    } else {
      log('4) adversarial SKIP', 'No ref/email from previous steps');
    }

    // Summary
    log('Summary', results);
    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      console.error('\n[E2E] Some steps failed:', failed.map((f) => f.flow + ': ' + f.error).join('; '));
      process.exit(1);
    }
    console.log('\n[E2E] All validations completed. Review output above for risk/export/tracking.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
