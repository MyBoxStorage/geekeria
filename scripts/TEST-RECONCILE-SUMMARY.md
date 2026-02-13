# Resumo do Teste de Reconciliação

## ✅ Implementações Realizadas

### 1. Endpoint `/api/internal/reconcile-pending` Modificado

**Mudanças:**
- ✅ `DEFAULT_OLDER_THAN_MINUTES` alterado de `15` para `5` minutos
- ✅ Função `mapMpStatusForReconcile()` criada:
  - `approved` → `PAID` (diferente do webhook)
  - `cancelled`/`rejected` → `CANCELED`
  - `pending`/`in_process` → `PENDING` (não altera)
- ✅ Logs estruturados sem PII implementados
- ✅ Validação de status antes de atualizar

### 2. Script de Teste Criado

**Arquivo:** `scripts/test-reconcile-pending-pix.js`

**Funcionalidades:**
- Cria pedido PIX
- Verifica status inicial
- Executa reconcile
- Valida que status não foi alterado indevidamente

### 3. Correção no create-payment

**Mudança:** Adicionado header `X-Idempotency-Key` (requerido pelo Mercado Pago)

## 🧪 Como Testar Manualmente

### Passo 1: Criar Pedido PIX

```bash
curl -X POST https://seu-backend.com/api/mp/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "1", "quantity": 1, "unitPrice": 50.00}],
    "payer": {"name": "Teste", "email": "teste@example.com"},
    "amount": 50.00,
    "paymentMethod": "pix"
  }'
```

**Anotar:**
- `orderId`
- `paymentId` 
- `externalReference`

### Passo 2: Verificar Status Inicial

```sql
SELECT 
  id,
  external_reference,
  status,
  mp_status,
  mp_payment_id,
  created_at
FROM orders 
WHERE external_reference = 'BRAVOS-XXXXX';
```

**Esperado:**
- `status`: `PENDING`
- `mp_status`: `pending` ou `in_process`

### Passo 3: Aguardar > 5 minutos

**OU** ajustar `created_at` no banco:

```sql
UPDATE orders 
SET created_at = NOW() - INTERVAL '6 minutes'
WHERE external_reference = 'BRAVOS-XXXXX';
```

### Passo 4: Executar Reconcile

```bash
curl -X POST https://seu-backend.com/api/internal/reconcile-pending \
  -H "x-admin-token: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-monitor-source: manual" \
  -d '{"olderThanMinutes": 5, "limit": 25}'
```

### Passo 5: Verificar Status Final

```sql
SELECT 
  id,
  external_reference,
  status,
  mp_status,
  mp_payment_id,
  updated_at
FROM orders 
WHERE external_reference = 'BRAVOS-XXXXX';
```

**Verificar eventos de auditoria:**
```sql
SELECT 
  action,
  external_reference,
  metadata
FROM admin_events 
WHERE external_reference = 'BRAVOS-XXXXX'
ORDER BY created_at DESC;
```

## ✅ Validações Esperadas

### Cenário 1: PIX Não Pago (Status `pending` no MP)

**Resultado Esperado:**
- ✅ Status do pedido: `PENDING` (não muda)
- ✅ `mp_status`: `pending` ou `in_process` (não muda)
- ✅ Reconcile mostra: `unchanged: 1`
- ✅ Log mostra: `[RECONCILE] Status unchanged`
- ✅ AdminEvent: Nenhum evento `RECONCILE_UPDATED_STATUS`

**Se isso acontecer:** ✅ **TESTE PASSOU** - Reconcile não altera status indevidamente

### Cenário 2: PIX Não Pago mas Status Mudou

**Resultado Problemático:**
- ❌ Status do pedido: `PAID` (mudou indevidamente)
- ❌ `mp_status`: `approved` (mas pagamento ainda está `pending`)
- ❌ Reconcile mostra: `updated: 1`
- ❌ Log mostra: `[RECONCILE] Order status updated`

**Se isso acontecer:** ❌ **PROBLEMA DETECTADO** - Reconcile alterou status indevidamente

### Cenário 3: PIX Pago (Status `approved` no MP)

**Resultado Esperado:**
- ✅ Status do pedido: `PAID` (atualizado corretamente)
- ✅ `mp_status`: `approved` (atualizado corretamente)
- ✅ Reconcile mostra: `updated: 1`
- ✅ Log mostra: `[RECONCILE] Order status updated`
- ✅ AdminEvent: `RECONCILE_UPDATED_STATUS` criado

**Se isso acontecer:** ✅ **TESTE PASSOU** - Reconcile atualiza corretamente quando há mudança

## 📋 Checklist de Validação

- [ ] Pedido PIX criado com sucesso
- [ ] Status inicial: `PENDING`
- [ ] MP Status inicial: `pending` ou `in_process`
- [ ] Aguardado > 5 minutos (ou ajustado `created_at`)
- [ ] Reconcile executado
- [ ] Status final: `PENDING` (não mudou) ✅
- [ ] MP Status final: `pending` ou `in_process` (não mudou) ✅
- [ ] Logs mostram `Status unchanged` ✅
- [ ] Nenhum AdminEvent `RECONCILE_UPDATED_STATUS` criado ✅

## 🔍 Verificar Logs do Servidor

Procure por:

```
[RECONCILE] Starting reconciliation
[RECONCILE] Checking payment status
[RECONCILE] Status unchanged  ← Deve aparecer se PIX não foi pago
[RECONCILE] Reconciliation completed
```

## 📝 Notas Importantes

1. **Tempo de espera**: Para teste completo, aguarde > 5 minutos OU ajuste `created_at` no banco
2. **Status no MP**: Verifique diretamente no Mercado Pago se o pagamento ainda está `pending`
3. **Idempotência**: O reconcile só atualiza se o status realmente mudou
4. **Logs estruturados**: Todos os logs são em JSON sem dados sensíveis

## 🐛 Troubleshooting

### Pedido não aparece no reconcile
- Verifique se `created_at` é > 5 minutos atrás
- Verifique se `status` é `PENDING`
- Verifique se `mpPaymentId` está preenchido

### Status foi alterado indevidamente
- Verifique logs do reconcile
- Verifique status atual no Mercado Pago
- Verifique se há webhook simultâneo processando

### Erro ao criar pedido PIX
- Verifique se `MP_ACCESS_TOKEN` está configurado
- Verifique se produto existe no banco
- Verifique se header `X-Idempotency-Key` está sendo enviado (já corrigido)
