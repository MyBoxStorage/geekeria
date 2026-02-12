/**
 * BRAVOS BRASIL - Testes no console do navegador
 *
 * Como usar:
 * 1. Abra www.bravosbrasil.com.br
 * 2. F12 → aba Console
 * 3. Cole este script inteiro e pressione Enter
 *
 * Ou salve como snippet no DevTools (Sources → Snippets) e execute.
 */

(function () {
  const BASE_URL = 'https://bravosbackend.fly.dev';

  function log(name, ok, detail) {
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

  window.runBravosFrontendTests = async function () {
    console.log('%c--- BRAVOS BRASIL - Testes no navegador ---', 'font-weight:bold');
    console.log('Origin:', window.location.origin);
    console.log('Backend (teste):', BASE_URL);
    console.log('');

    let passed = 0,
      failed = 0;

    // 1. Conectividade com a API (health)
    const healthOk = await test('Conectividade API (GET /health)', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.status !== 'ok') throw new Error('Resposta inválida');
    });
    healthOk ? passed++ : failed++;

    // 2. Criação de pedido
    let externalRef = '';
    const createOk = await test('Criar pedido (POST /api/checkout/create-order)', async () => {
      const res = await fetch(`${BASE_URL}/api/checkout/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payer: { name: 'Teste Console', email: 'teste@example.com' },
          shipping: { cep: '01310100' },
          items: [{ productId: '1', quantity: 1, unitPrice: 89.9 }],
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()));
      const data = await res.json();
      if (!data.externalReference) throw new Error('Sem externalReference');
      externalRef = data.externalReference;
    });
    createOk ? passed++ : failed++;

    // 3. Consulta de pedido
    const getOrderOk = await test('Consultar pedido (GET /api/orders/:ref)', async () => {
      const ref = externalRef || 'order_00000000-0000-0000-0000-000000000000';
      const res = await fetch(`${BASE_URL}/api/orders/${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (res.status === 404) return;
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (!data.externalReference && !data.error) throw new Error('Resposta inválida');
    });
    getOrderOk ? passed++ : failed++;

    // 4. Integração Mercado Pago (create-preference)
    const prefOk = await test('Mercado Pago - criar preferência (POST /api/mp/create-preference)', async () => {
      const res = await fetch(`${BASE_URL}/api/mp/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: '1', quantity: 1, unitPrice: 89.9, name: 'Camiseta Teste' }],
          payer: { name: 'Teste Console', email: 'teste@example.com' },
          amount: 89.9,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()));
      const data = await res.json();
      if (!data.preferenceId && !data.init_point) throw new Error('Sem preferenceId/init_point');
    });
    prefOk ? passed++ : failed++;

    console.log('');
    console.log('%c--- Resultado ---', 'font-weight:bold');
    console.log('Passaram: ' + passed + ' | Falharam: ' + failed);
    if (externalRef) console.log('ExternalReference do pedido criado:', externalRef);
  };

  console.log('Testes BRAVOS carregados. Execute: runBravosFrontendTests()');
  runBravosFrontendTests();
})();
