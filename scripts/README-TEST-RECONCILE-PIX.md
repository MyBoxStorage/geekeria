# Teste de Reconciliação - Pedido PIX Não Pago

Este script testa o fluxo completo de reconciliação para garantir que pedidos PIX não pagos não tenham seu status alterado indevidamente.

## Objetivo

Validar que o endpoint `/api/internal/reconcile-pending`:
1. ✅ Não altera status de pedidos PENDING que ainda estão pendentes no Mercado Pago
2. ✅ Apenas atualiza status quando há mudança real no Mercado Pago
3. ✅ Respeita o status atual do pagamento antes de atualizar

## Pré-requisitos

1. Servidor backend rodando (`npm run dev` no diretório `server/`)
2. Variáveis de ambiente configuradas:
   - `BACKEND_URL` (ou usa `http://localhost:3001` por padrão)
   - `ADMIN_TOKEN` (para autenticação)
   - `MP_ACCESS_TOKEN` (para consultar status no MP)

## Como executar

```bash
# No diretório raiz do projeto
node scripts/test-reconcile-pending-pix.js
```

## Fluxo do teste

### Passo 1: Criar pedido PIX
- Cria um pedido PIX via `/api/mp/create-payment`
- Obtém `paymentId` e `orderId`
- Status inicial: `PENDING`

### Passo 2: Verificar status inicial
- Consulta status do pedido no banco
- Consulta status do pagamento no Mercado Pago
- Confirma que está `pending` no MP

### Passo 3: Executar reconcile
- Chama `/api/internal/reconcile-pending`
- Com `olderThanMinutes: 5`
- **NOTA**: Para teste completo, aguarde > 5 minutos ou ajuste `created_at` no banco

### Passo 4: Verificar status final
- Consulta status do pedido novamente
- Compara com status inicial
- Valida que não foi alterado indevidamente

## Validações

### ✅ Cenário Correto (PIX não pago)
- Status no MP: `pending` ou `in_process`
- Status do pedido: `PENDING` (não muda)
- Resultado: ✅ Status não foi alterado indevidamente

### ❌ Cenário Problemático (se ocorrer)
- Status no MP: `pending` ou `in_process`
- Status do pedido: `PAID` (mudou indevidamente)
- Resultado: ❌ Problema detectado - reconcile alterou status indevidamente

### ✅ Cenário Correto (PIX pago)
- Status no MP: `approved`
- Status do pedido: `PAID` (atualizado corretamente)
- Resultado: ✅ Status foi atualizado corretamente

## Teste Manual Completo

Para um teste completo que simula o tempo real:

### Opção 1: Aguardar 5+ minutos
```bash
# 1. Criar pedido
node scripts/test-reconcile-pending-pix.js

# 2. Aguardar 5+ minutos (não pagar o PIX)

# 3. Executar reconcile manualmente
curl -X POST https://seu-backend.com/api/internal/reconcile-pending \
  -H "x-admin-token: SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"olderThanMinutes": 5, "limit": 25}'

# 4. Verificar status do pedido
curl https://seu-backend.com/api/orders/EXTERNAL_REFERENCE
```

### Opção 2: Ajustar created_at no banco (mais rápido)

```sql
-- Ajustar created_at para 6 minutos atrás
UPDATE orders 
SET created_at = NOW() - INTERVAL '6 minutes'
WHERE external_reference = 'BRAVOS-XXXXX';

-- Executar reconcile
-- Verificar que status não mudou se pagamento ainda está pending
```

## O que verificar

### 1. Logs do servidor

Procure por logs estruturados:
```json
{
  "[RECONCILE] Starting reconciliation": {
    "source": "manual",
    "olderThanMinutes": 5,
    "ordersFound": 1
  },
  "[RECONCILE] Checking payment status": {
    "orderId": "...",
    "mpStatus": "pending",
    "mappedStatus": "PENDING"
  },
  "[RECONCILE] Status unchanged": {
    "orderId": "...",
    "status": "PENDING"
  }
}
```

### 2. Banco de dados

```sql
-- Verificar pedido
SELECT 
  id,
  external_reference,
  status,
  mp_status,
  mp_payment_id,
  created_at,
  updated_at
FROM orders 
WHERE external_reference = 'BRAVOS-XXXXX';

-- Verificar eventos de reconciliação
SELECT 
  action,
  external_reference,
  metadata
FROM admin_events 
WHERE external_reference = 'BRAVOS-XXXXX'
ORDER BY created_at DESC;
```

### 3. Status no Mercado Pago

O pagamento deve estar com status `pending` ou `in_process` se não foi pago.

## Resultado Esperado

### Se PIX não foi pago:
- ✅ Status do pedido permanece `PENDING`
- ✅ `mpStatus` permanece `pending` ou `in_process`
- ✅ Reconcile não atualiza o pedido (status unchanged)
- ✅ Log mostra `[RECONCILE] Status unchanged`

### Se PIX foi pago:
- ✅ Status do pedido muda para `PAID`
- ✅ `mpStatus` muda para `approved`
- ✅ Reconcile atualiza o pedido corretamente
- ✅ Log mostra `[RECONCILE] Order status updated`

## Troubleshooting

### Erro: "ADMIN_TOKEN não configurado"
- Configure `ADMIN_TOKEN` no `.env` ou exporte como variável de ambiente

### Erro: "Connection refused"
- Certifique-se de que o servidor backend está rodando
- Verifique se `BACKEND_URL` está correto

### Pedido não aparece no reconcile
- Verifique se `created_at` é > 5 minutos atrás
- Verifique se status é `PENDING`
- Verifique se `mpPaymentId` está preenchido

### Status foi alterado indevidamente
- Verifique logs do reconcile
- Verifique status no Mercado Pago
- Verifique se há race condition (webhook + reconcile simultâneos)
