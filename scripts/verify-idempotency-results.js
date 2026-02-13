/**
 * Script para verificar resultados do teste de idempotência
 * 
 * Consulta o banco de dados para confirmar que:
 * 1. Apenas 1 webhook event foi criado (mesmo com 2 chamadas)
 * 2. Pedidos não foram duplicados
 */

import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

async function verifyIdempotency(testPaymentId, testExternalReference) {
  console.log('🔍 VERIFICAÇÃO DE IDEMPOTÊNCIA');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar webhook events
    console.log(`\n1️⃣ Verificando webhook events para paymentId: ${testPaymentId}`);
    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        eventId: testPaymentId,
        provider: 'mercadopago',
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });

    console.log(`   📊 Total de eventos encontrados: ${webhookEvents.length}`);
    
    if (webhookEvents.length === 0) {
      console.log('   ⚠️  Nenhum evento encontrado. O webhook pode não ter sido processado ainda.');
    } else if (webhookEvents.length === 1) {
      console.log('   ✅ CORRETO: Apenas 1 evento criado (idempotência funcionando!)');
      console.log(`   📝 Status: ${webhookEvents[0].status}`);
      console.log(`   📅 Recebido em: ${webhookEvents[0].receivedAt}`);
      if (webhookEvents[0].processedAt) {
        console.log(`   ✅ Processado em: ${webhookEvents[0].processedAt}`);
      }
    } else {
      console.log(`   ❌ PROBLEMA: ${webhookEvents.length} eventos encontrados (deveria ser 1)`);
      webhookEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ID: ${event.id}, Status: ${event.status}, Recebido: ${event.receivedAt}`);
      });
    }

    // 2. Verificar pedidos
    console.log(`\n2️⃣ Verificando pedidos para externalReference: ${testExternalReference}`);
    const orders = await prisma.order.findMany({
      where: {
        externalReference: testExternalReference,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        externalReference: true,
        status: true,
        mpPaymentId: true,
        mpStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`   📊 Total de pedidos encontrados: ${orders.length}`);
    
    if (orders.length === 0) {
      console.log('   ⚠️  Nenhum pedido encontrado. O webhook pode não ter criado/atualizado o pedido.');
    } else if (orders.length === 1) {
      console.log('   ✅ CORRETO: Apenas 1 pedido encontrado (sem duplicação!)');
      const order = orders[0];
      console.log(`   📝 ID: ${order.id}`);
      console.log(`   📝 Status: ${order.status}`);
      console.log(`   📝 MP Payment ID: ${order.mpPaymentId || 'não definido'}`);
      console.log(`   📝 MP Status: ${order.mpStatus || 'não definido'}`);
      console.log(`   📅 Criado em: ${order.createdAt}`);
      console.log(`   📅 Atualizado em: ${order.updatedAt}`);
    } else {
      console.log(`   ❌ PROBLEMA: ${orders.length} pedidos encontrados (deveria ser 1)`);
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: ${order.id}, Status: ${order.status}, Criado: ${order.createdAt}`);
      });
    }

    // 3. Verificar se paymentId está duplicado em múltiplos pedidos
    if (testPaymentId) {
      console.log(`\n3️⃣ Verificando se paymentId está duplicado em múltiplos pedidos`);
      const ordersWithPaymentId = await prisma.order.findMany({
        where: {
          mpPaymentId: testPaymentId,
        },
        select: {
          id: true,
          externalReference: true,
          mpPaymentId: true,
        },
      });

      console.log(`   📊 Pedidos com este paymentId: ${ordersWithPaymentId.length}`);
      
      if (ordersWithPaymentId.length === 0) {
        console.log('   ⚠️  Nenhum pedido com este paymentId encontrado.');
      } else if (ordersWithPaymentId.length === 1) {
        console.log('   ✅ CORRETO: PaymentId associado a apenas 1 pedido');
        console.log(`   📝 Pedido: ${ordersWithPaymentId[0].externalReference}`);
      } else {
        console.log(`   ❌ PROBLEMA: PaymentId associado a ${ordersWithPaymentId.length} pedidos diferentes:`);
        ordersWithPaymentId.forEach((order, index) => {
          console.log(`   ${index + 1}. External Reference: ${order.externalReference}`);
        });
      }
    }

    // Resumo
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(60));
    
    const allChecksPassed = 
      webhookEvents.length <= 1 &&
      orders.length <= 1 &&
      (!testPaymentId || ordersWithPaymentId.length <= 1);

    if (allChecksPassed) {
      console.log('\n✅ TODAS AS VERIFICAÇÕES PASSARAM!');
      console.log('   ✓ Idempotência está funcionando corretamente');
      console.log('   ✓ Webhooks duplicados não estão criando registros duplicados');
      console.log('   ✓ Pedidos não estão sendo duplicados');
    } else {
      console.log('\n⚠️  ALGUMAS VERIFICAÇÕES FALHARAM');
      console.log('   Verifique os detalhes acima');
    }

  } catch (error) {
    console.error('\n❌ Erro ao verificar:', error.message);
    if (error.message.includes('DATABASE_URL')) {
      console.error('\n💡 Certifique-se de que DATABASE_URL está configurado no .env');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Pega argumentos da linha de comando
const testPaymentId = process.argv[2];
const testExternalReference = process.argv[3];

if (!testPaymentId || !testExternalReference) {
  console.error('❌ Uso: node scripts/verify-idempotency-results.js <paymentId> <externalReference>');
  console.error('\nExemplo:');
  console.error('   node scripts/verify-idempotency-results.js test-payment-1234567890 TEST-1234567890');
  process.exit(1);
}

verifyIdempotency(testPaymentId, testExternalReference).catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});
