#!/usr/bin/env node
/**
 * BRAVOS BRASIL - Testes de integração do backend
 * Uso: node scripts/test-backend.js [BASE_URL]
 * Exemplo: node scripts/test-backend.js https://bravosbackend.fly.dev
 */

const BASE_URL = process.argv[2] || 'https://bravosbackend.fly.dev';

function log(name, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}${detail ? ': ' + detail : ''}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(name, true);
    return true;
  } catch (e) {
    log(name, false, e.message || String(e));
    return false;
  }
}

async function main() {
  console.log('\n--- BRAVOS BRASIL - Testes do Backend ---');
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  // 1. GET /health
  const healthOk = await test('GET /health', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok' || !data.service) throw new Error('Resposta inválida');
  });
  healthOk ? passed++ : failed++;

  // 2. POST /api/shipping/quote
  const quoteOk = await test('POST /api/shipping/quote', async () => {
    const res = await fetch(`${BASE_URL}/api/shipping/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtotal: 150,
        cep: '01310100',
        items: [{ productId: '1', quantity: 2 }],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (typeof data.shippingCost !== 'number') throw new Error('Resposta sem shippingCost');
  });
  quoteOk ? passed++ : failed++;

  // 3. POST /api/checkout/create-order
  let externalRef = '';
  const createOrderOk = await test('POST /api/checkout/create-order', async () => {
    const res = await fetch(`${BASE_URL}/api/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payer: { name: 'Teste Silva', email: 'teste@example.com' },
        shipping: { cep: '01310100', city: 'São Paulo', state: 'SP' },
        items: [
          { productId: '1', quantity: 1, unitPrice: 89.9 },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.externalReference) throw new Error('Resposta sem externalReference');
    externalRef = data.externalReference;
  });
  createOrderOk ? passed++ : failed++;

  // 4. GET /api/orders/:externalReference
  if (!externalRef) externalRef = 'order_00000000-0000-0000-0000-000000000000'; // placeholder
  const getOrderOk = await test('GET /api/orders/:externalReference', async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${encodeURIComponent(externalRef)}`);
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (res.ok && !data.externalReference && !data.error) throw new Error('Resposta inválida');
  });
  getOrderOk ? passed++ : failed++;

  // 5. POST /api/mp/create-preference
  const preferenceOk = await test('POST /api/mp/create-preference', async () => {
    const res = await fetch(`${BASE_URL}/api/mp/create-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { productId: '1', quantity: 1, unitPrice: 89.9, name: 'Camiseta Teste' },
        ],
        payer: { name: 'Teste Silva', email: 'teste@example.com' },
        amount: 89.9,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.preferenceId && !data.init_point) throw new Error('Resposta sem preferenceId/init_point');
  });
  preferenceOk ? passed++ : failed++;

  console.log('\n--- Resultado ---');
  console.log(`Passaram: ${passed} | Falharam: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
