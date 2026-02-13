#!/usr/bin/env node
/**
 * Teste de reconciliação para pedido PIX não pago
 * 
 * Fluxo:
 * 1. Criar pedido PIX
 * 2. Não pagar (deixar pendente)
 * 3. Aguardar > 5 minutos (ou simular)
 * 4. Rodar reconcile
 * 5. Confirmar que status não foi alterado indevidamente
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
const envPaths = [
  join(__dirname, '../.env'),
  join(__dirname, '../server/.env'),
  join(__dirname, '../../.env'),
];

for (const path of envPaths) {
  try {
    dotenv.config({ path });
  } catch (e) {
    // Ignora erros
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN não configurado');
  process.exit(1);
}

/**
 * Criar pedido PIX
 */
async function createPixOrder() {
  console.log('\n📦 PASSO 1: Criando pedido PIX...');
  
  // Usar produto existente do banco (ID "1" - T-Shirt Classic)
  const productId = process.env.TEST_PRODUCT_ID || '1';
  
  const orderData = {
    items: [
      {
        productId: productId,
        quantity: 1,
        unitPrice: 50.00,
      },
    ],
    payer: {
      name: 'Teste Reconcile',
      email: `teste-reconcile-${Date.now()}@example.com`,
      cpf: '12345678901',
    },
    amount: 50.00,
    paymentMethod: 'pix',
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/mp/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao criar pedido:', data);
      return null;
    }

    console.log('✅ Pedido criado com sucesso!');
    console.log(`   Order ID: ${data.orderId}`);
    console.log(`   Payment ID: ${data.paymentId}`);
    console.log(`   Status inicial: ${data.status}`);
    console.log(`   PIX QR Code: ${data.pix ? 'Gerado' : 'Não gerado'}`);

    // Armazenar email para consultas futuras
    orderEmail = orderData.payer.email;

    return {
      orderId: data.orderId,
      paymentId: data.paymentId,
      status: data.status,
      externalReference: data.externalReference || `BRAVOS-${Date.now()}`,
      email: orderEmail,
    };
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error.message);
    return null;
  }
}

/**
 * Verificar status do pedido no banco
 * Nota: O endpoint público requer email, então vamos armazenar o email usado
 */
let orderEmail = null;

async function checkOrderStatus(externalReference, email) {
  console.log('\n🔍 Verificando status do pedido no banco...');

  if (!email) {
    console.warn('⚠️  Email não fornecido, não é possível buscar via endpoint público');
    console.warn('   Verifique manualmente no banco de dados');
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/orders/${externalReference}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️  Não foi possível buscar pedido (status: ${response.status})`);
      console.warn('   Verifique manualmente no banco de dados');
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error.message);
    return null;
  }
}

/**
 * Executar reconcile
 */
async function runReconcile() {
  console.log('\n🔄 PASSO 2: Executando reconcile...');

  try {
    const response = await fetch(`${BACKEND_URL}/api/internal/reconcile-pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
        'x-monitor-source': 'manual',
      },
      body: JSON.stringify({
        olderThanMinutes: 5,
        limit: 25,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao executar reconcile:', data);
      return null;
    }

    console.log('✅ Reconcile executado!');
    console.log(`   Pedidos verificados: ${data.checked}`);
    console.log(`   Pedidos atualizados: ${data.updated}`);
    console.log(`   Pedidos sem mudança: ${data.unchanged}`);
    console.log(`   Pedidos sem payment ID: ${data.skippedMissingPaymentId}`);
    console.log(`   Erros: ${data.errors}`);

    if (data.examples && data.examples.updated && data.examples.updated.length > 0) {
      console.log(`   Exemplos atualizados: ${data.examples.updated.join(', ')}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao executar reconcile:', error.message);
    return null;
  }
}

/**
 * Verificar status do pagamento no Mercado Pago
 */
async function checkMpPaymentStatus(paymentId) {
  console.log('\n🔍 Verificando status do pagamento no Mercado Pago...');

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn('⚠️  MP_ACCESS_TOKEN não configurado, pulando verificação');
    return null;
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar pagamento no MP:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar pagamento no MP:', error.message);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🧪 TESTE DE RECONCILIAÇÃO - PEDIDO PIX NÃO PAGO');
  console.log('='.repeat(60));

  // Passo 1: Criar pedido PIX
  const order = await createPixOrder();
  if (!order) {
    console.error('\n❌ Falha ao criar pedido. Abortando teste.');
    process.exit(1);
  }

  // Aguardar um pouco para garantir que o pedido foi criado
  console.log('\n⏳ Aguardando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verificar status inicial
  const initialStatus = await checkOrderStatus(order.externalReference, order.email);
  if (initialStatus) {
    console.log('\n📊 Status inicial do pedido:');
    console.log(`   Status: ${initialStatus.status}`);
    console.log(`   MP Status: ${initialStatus.mpStatus || 'não definido'}`);
    console.log(`   MP Payment ID: ${initialStatus.mpPaymentId || 'não definido'}`);
  }

  // Verificar status no Mercado Pago
  if (order.paymentId) {
    const mpPayment = await checkMpPaymentStatus(order.paymentId);
    if (mpPayment) {
      console.log('\n📊 Status no Mercado Pago:');
      console.log(`   Status: ${mpPayment.status}`);
      console.log(`   Status Detail: ${mpPayment.status_detail || 'não definido'}`);
    }
  }

  // Passo 2: Executar reconcile
  // NOTA: Para um teste real, você precisaria aguardar > 5 minutos
  // ou ajustar o created_at do pedido no banco para simular
  console.log('\n⚠️  NOTA: Para teste completo, aguarde > 5 minutos ou ajuste created_at no banco');
  console.log('   Executando reconcile agora (pode não processar se pedido for muito recente)...');

  const reconcileResult = await runReconcile();

  // Aguardar processamento
  console.log('\n⏳ Aguardando 2 segundos para processamento...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verificar status final
  const finalStatus = await checkOrderStatus(order.externalReference, order.email);
  if (finalStatus) {
    console.log('\n📊 Status final do pedido:');
    console.log(`   Status: ${finalStatus.status}`);
    console.log(`   MP Status: ${finalStatus.mpStatus || 'não definido'}`);
  }

  // Verificar status no Mercado Pago novamente
  if (order.paymentId) {
    const mpPaymentFinal = await checkMpPaymentStatus(order.paymentId);
    if (mpPaymentFinal) {
      console.log('\n📊 Status final no Mercado Pago:');
      console.log(`   Status: ${mpPaymentFinal.status}`);
    }
  }

  // Validação
  console.log('\n' + '='.repeat(60));
  console.log('✅ VALIDAÇÃO DO TESTE');
  console.log('='.repeat(60));

  if (initialStatus && finalStatus) {
    const statusChanged = initialStatus.status !== finalStatus.status;
    const mpStatusChanged = initialStatus.mpStatus !== finalStatus.mpStatus;

    console.log(`\n📝 Status do pedido mudou: ${statusChanged ? 'SIM ⚠️' : 'NÃO ✅'}`);
    console.log(`📝 MP Status mudou: ${mpStatusChanged ? 'SIM' : 'NÃO'}`);

    if (order.paymentId) {
      const mpPayment = await checkMpPaymentStatus(order.paymentId);
      if (mpPayment) {
        const mpStatus = mpPayment.status?.toLowerCase();
        const isPending = mpStatus === 'pending' || mpStatus === 'in_process';
        
        console.log(`\n🔍 Status no Mercado Pago: ${mpPayment.status}`);
        
        if (isPending && statusChanged && finalStatus.status === 'PAID') {
          console.log('\n❌ PROBLEMA DETECTADO:');
          console.log('   Pedido foi marcado como PAID mesmo estando pendente no MP!');
          console.log('   Isso indica que o reconcile está alterando status indevidamente.');
        } else if (isPending && !statusChanged) {
          console.log('\n✅ CORRETO:');
          console.log('   Pedido permaneceu PENDING (status não foi alterado indevidamente)');
          console.log('   O reconcile respeitou o status pendente no Mercado Pago.');
        } else if (!isPending && statusChanged) {
          console.log('\n✅ CORRETO:');
          console.log('   Status foi atualizado corretamente baseado no status do MP.');
        }
      }
    }

    console.log('\n📋 Resumo:');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Payment ID: ${order.paymentId}`);
    console.log(`   External Reference: ${order.externalReference}`);
    console.log(`   Status inicial: ${initialStatus.status}`);
    console.log(`   Status final: ${finalStatus.status}`);
    console.log(`   MP Status inicial: ${initialStatus.mpStatus || 'não definido'}`);
    console.log(`   MP Status final: ${finalStatus.mpStatus || 'não definido'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Teste concluído!');
  console.log('='.repeat(60));
}

// Executa o teste
main().catch(error => {
  console.error('\n❌ Erro no teste:', error);
  process.exit(1);
});
