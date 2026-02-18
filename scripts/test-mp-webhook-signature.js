/**
 * Script de teste LOCAL para validar a lógica de verificação de assinatura
 * do webhook Mercado Pago.
 *
 * O esquema de assinatura do MP NÃO assina o body do request.
 * Ele assina um "manifest" construído a partir de metadados:
 *   id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
 *
 * Header x-signature: ts=<timestamp>,v1=<hmac_hex>
 * Algoritmo: HMAC-SHA256(secret, manifest) → hex
 *
 * Este script:
 *   1. Lê MP_WEBHOOK_SECRET do env (ou usa valor fake para demonstração)
 *   2. Gera um manifest com valores de exemplo
 *   3. Calcula a assinatura HMAC-SHA256
 *   4. Verifica usando o mesmo algoritmo do servidor (timing-safe)
 *   5. Imprime instrução curl pronta para testar o endpoint localmente
 *
 * Uso:
 *   node scripts/test-mp-webhook-signature.js
 *   MP_WEBHOOK_SECRET=my-secret node scripts/test-mp-webhook-signature.js
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env (tenta múltiplos caminhos, como os outros scripts)
for (const p of [
  join(__dirname, '../.env'),
  join(__dirname, '../server/.env'),
]) {
  try { dotenv.config({ path: p }); } catch { /* ignore */ }
}

const FAKE_SECRET = 'test-secret-for-local-demo';
const secret = process.env.MP_WEBHOOK_SECRET || FAKE_SECRET;
const usingFake = secret === FAKE_SECRET;

// ─── Parâmetros de exemplo (simulam o que MP envia) ───────────────────────
const dataId = '12345678901';          // data.id (payment ID)
const xRequestId = 'abc-def-123-456';  // x-request-id header
const ts = String(Math.floor(Date.now() / 1000)); // timestamp Unix

// ─── Construir manifest (exatamente como server/routes/mp/webhooks.ts) ────
const manifestParts = [];
if (dataId) manifestParts.push(`id:${dataId}`);
if (xRequestId) manifestParts.push(`request-id:${xRequestId}`);
manifestParts.push(`ts:${ts}`);
const manifest = manifestParts.join(';') + ';';

// ─── Calcular HMAC-SHA256 ─────────────────────────────────────────────────
const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

// ─── Formato do header x-signature ────────────────────────────────────────
const xSignature = `ts=${ts},v1=${hmac}`;

// ─── Verificar com timing-safe (mesmo algoritmo do servidor) ──────────────
const recomputed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
let verified = false;
try {
  verified = crypto.timingSafeEqual(
    Buffer.from(recomputed, 'hex'),
    Buffer.from(hmac, 'hex'),
  );
} catch {
  verified = false;
}

// ─── Output ───────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
console.log('  MP Webhook Signature — Local Test');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log(`Secret:       ${usingFake ? `${secret} (FAKE — set MP_WEBHOOK_SECRET for real)` : '****** (from env)'}`);
console.log(`data.id:      ${dataId}`);
console.log(`x-request-id: ${xRequestId}`);
console.log(`timestamp:    ${ts}`);
console.log();
console.log(`Manifest:     ${manifest}`);
console.log(`HMAC (hex):   ${hmac}`);
console.log(`x-signature:  ${xSignature}`);
console.log();
console.log(`Verification: ${verified ? '✅ PASS (timing-safe)' : '❌ FAIL'}`);
console.log();

// ─── Instrução curl ───────────────────────────────────────────────────────
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const body = JSON.stringify({
  type: 'payment',
  data: { id: dataId },
});

console.log('─── curl para testar localmente (copie e cole): ───');
console.log();
console.log(`curl -X POST "${backendUrl}/api/mp/webhooks?data.id=${dataId}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "x-signature: ${xSignature}" \\`);
console.log(`  -H "x-request-id: ${xRequestId}" \\`);
console.log(`  -d '${body}'`);
console.log();
console.log('═══════════════════════════════════════════════════════════════');

// ─── Teste de falha (assinatura inválida deve falhar) ─────────────────────
const badHmac = crypto.createHmac('sha256', 'wrong-secret').update(manifest).digest('hex');
let falsePositive = false;
try {
  falsePositive = crypto.timingSafeEqual(
    Buffer.from(recomputed, 'hex'),
    Buffer.from(badHmac, 'hex'),
  );
} catch {
  falsePositive = false;
}
console.log(`Negative test (wrong secret): ${!falsePositive ? '✅ PASS (correctly rejected)' : '❌ FAIL (false positive!)'}`);
console.log();
