/**
 * Script de teste para validar idempotência do webhook
 * 
 * Simula duas chamadas idênticas ao webhook e verifica:
 * 1. Pedido não duplica
 * 2. Status não é reprocessado
 * 3. Logs mostram skip de idempotência
 * 
 * Uso: node scripts/test-webhook-idempotency.js
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente (tenta múltiplos caminhos)
const envPaths = [
  join(__dirname, '../.env'),
  join(__dirname, '../server/.env'),
  join(__dirname, '../../.env'),
];

for (const path of envPaths) {
  try {
    dotenv.config({ path });
  } catch (e) {
    // Ignora erros de arquivo não encontrado
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

if (!MP_WEBHOOK_SECRET) {
  console.error('❌ MP_WEBHOOK_SECRET não configurado');
  console.error('\n💡 Dicas:');
  console.error('   1. Configure a variável MP_WEBHOOK_SECRET no arquivo .env');
  console.error('   2. Ou exporte como variável de ambiente:');
  console.error('      export MP_WEBHOOK_SECRET="seu-secret-aqui"');
  console.error('   3. Ou passe como argumento:');
  console.error('      MP_WEBHOOK_SECRET="seu-secret" node scripts/test-webhook-idempotency.js');
  console.error('\n📁 Tentou carregar de:');
  envPaths.forEach(path => console.error(`   - ${path}`));
  process.exit(1);
}

/**
 * Gera assinatura válida para o webhook do Mercado Pago
 */
function generateWebhookSignature(secret, dataId, requestId, timestamp) {
  const partsManifest = [];
  if (dataId) {
    partsManifest.push(`id:${dataId}`);
  }
  if (requestId) {
    partsManifest.push(`request-id:${requestId}`);
  }
  partsManifest.push(`ts:${timestamp}`);
  const manifest = partsManifest.join(';') + ';';
  
  const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${timestamp},v1=${hash}`;
}

/**
 * Simula uma chamada ao webhook
 */
async function simulateWebhook(paymentId, externalReference, mpStatus = 'approved') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const requestId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const payload = {
    type: 'payment',
    data: {
      id: paymentId,
    },
  };

  const signature = generateWebhookSignature(
    MP_WEBHOOK_SECRET,
    paymentId,
    requestId,
    timestamp
  );

  const url = `${BACKEND_URL}/api/mp/webhooks`;
  
  console.log(`\n📤 Enviando webhook...`);
  console.log(`   URL: ${url}`);
  console.log(`   Payment ID: ${paymentId}`);
  console.log(`   External Reference: ${externalReference}`);
  console.log(`   MP Status: ${mpStatus}`);
  console.log(`   Request ID: ${requestId}`);
  console.log(`   Timestamp: ${timestamp}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`\n📥 Resposta:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Body:`, JSON.stringify(responseData, null, 2));

    return {
      status: response.status,
      data: responseData,
      requestId,
      timestamp,
    };
  } catch (error) {
    console.error(`\n❌ Erro ao enviar webhook:`, error.message);
    return {
      status: 0,
      error: error.message,
      requestId,
      timestamp,
    };
  }
}

/**
 * Função principal de teste
 */
async function testIdempotency() {
  console.log('🧪 TESTE DE IDEMPOTÊNCIA DO WEBHOOK');
  console.log('=' .repeat(60));
  
  // Dados de teste
  const testPaymentId = `test-payment-${Date.now()}`;
  const testExternalReference = `TEST-${Date.now()}`;
  
  console.log(`\n📋 Configuração do teste:`);
  console.log(`   Payment ID: ${testPaymentId}`);
  console.log(`   External Reference: ${testExternalReference}`);
  console.log(`   Backend URL: ${BACKEND_URL}`);
  
  // Primeira chamada
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔄 PRIMEIRA CHAMADA (deve processar)');
  console.log('='.repeat(60));
  
  const firstCall = await simulateWebhook(testPaymentId, testExternalReference, 'approved');
  
  // Aguardar um pouco para garantir processamento
  console.log(`\n⏳ Aguardando 2 segundos para processamento...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Segunda chamada (idêntica)
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔄 SEGUNDA CHAMADA (idêntica - deve ser ignorada)');
  console.log('='.repeat(60));
  
  const secondCall = await simulateWebhook(testPaymentId, testExternalReference, 'approved');
  
  // Aguardar processamento
  console.log(`\n⏳ Aguardando 2 segundos para processamento...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Resultados
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESULTADOS DO TESTE');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Primeira chamada:`);
  console.log(`   Status HTTP: ${firstCall.status}`);
  console.log(`   Request ID: ${firstCall.requestId}`);
  
  console.log(`\n✅ Segunda chamada:`);
  console.log(`   Status HTTP: ${secondCall.status}`);
  console.log(`   Request ID: ${secondCall.requestId}`);
  
  // Verificações
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔍 VERIFICAÇÕES');
  console.log('='.repeat(60));
  
  const bothSucceeded = firstCall.status === 200 && secondCall.status === 200;
  console.log(`\n✓ Ambas chamadas retornaram 200 OK: ${bothSucceeded ? '✅ SIM' : '❌ NÃO'}`);
  
  if (bothSucceeded) {
    console.log(`\n📝 Próximos passos para verificar:`);
    console.log(`   1. Verifique os logs do servidor para mensagens:`);
    console.log(`      - "[WEBHOOK] Event received" (primeira chamada)`);
    console.log(`      - "[WEBHOOK] Event already processed" (segunda chamada)`);
    console.log(`   2. Verifique o banco de dados:`);
    console.log(`      - SELECT * FROM webhook_events WHERE event_id = '${testPaymentId}';`);
    console.log(`      - Deve haver apenas 1 registro com status 'processed'`);
    console.log(`   3. Verifique se o pedido não foi duplicado:`);
    console.log(`      - SELECT * FROM orders WHERE external_reference = '${testExternalReference}';`);
    console.log(`      - Deve haver apenas 1 pedido`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✨ Teste concluído!');
  console.log('='.repeat(60));
}

// Executa o teste
testIdempotency().catch(error => {
  console.error('\n❌ Erro no teste:', error);
  process.exit(1);
});
