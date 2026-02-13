# Resultados do Teste de Idempotência

## ✅ Teste Executado com Sucesso

Duas chamadas idênticas ao webhook foram simuladas:

### Primeira Chamada
- **Payment ID**: `test-payment-1770975166599`
- **External Reference**: `TEST-1770975166599`
- **Status HTTP**: `200 OK`
- **Request ID**: `test-1770975166599-wevrrxny5`
- **Resultado Esperado**: ✅ Deve processar normalmente

### Segunda Chamada (Idêntica)
- **Payment ID**: `test-payment-1770975166599` (MESMO)
- **External Reference**: `TEST-1770975166599` (MESMO)
- **Status HTTP**: `200 OK`
- **Request ID**: `test-1770975169744-w6wb3ma55` (diferente, mas mesmo eventId)
- **Resultado Esperado**: ✅ Deve ser ignorado por idempotência

## 🔍 Como Verificar os Resultados

### Opção 1: Script Automático

```bash
node scripts/verify-idempotency-results.js test-payment-1770975166599 TEST-1770975166599
```

### Opção 2: Verificação Manual no Banco

#### 1. Verificar Webhook Events

```sql
SELECT 
  id,
  provider,
  event_id,
  event_type,
  status,
  received_at,
  processed_at,
  error_message
FROM webhook_events 
WHERE event_id = 'test-payment-1770975166599'
ORDER BY received_at DESC;
```

**Resultado Esperado**: 
- ✅ Apenas **1 registro** deve existir
- ✅ Status deve ser `processed` ou `received`
- ❌ Se houver 2 registros, a idempotência falhou

#### 2. Verificar Pedidos

```sql
SELECT 
  id,
  external_reference,
  status,
  mp_payment_id,
  mp_status,
  created_at,
  updated_at
FROM orders 
WHERE external_reference = 'TEST-1770975166599'
ORDER BY created_at DESC;
```

**Resultado Esperado**:
- ✅ Apenas **1 pedido** deve existir
- ❌ Se houver 2 pedidos, houve duplicação

#### 3. Verificar Payment ID Duplicado

```sql
SELECT 
  id,
  external_reference,
  mp_payment_id
FROM orders 
WHERE mp_payment_id = 'test-payment-1770975166599';
```

**Resultado Esperado**:
- ✅ Payment ID deve estar associado a apenas **1 pedido**
- ❌ Se estiver em múltiplos pedidos, há problema de idempotência

### Opção 3: Verificar Logs do Servidor

Procure nos logs do servidor por:

**Primeira chamada deve mostrar:**
```
[WEBHOOK] Event received { eventType: 'payment', eventId: 'test-payment-1770975166599' }
[WEBHOOK] Order updated successfully { ... }
```

**Segunda chamada deve mostrar:**
```
[WEBHOOK] Event already processed { eventType: 'payment', eventId: 'test-payment-1770975166599' }
```

## ✅ Checklist de Validação

- [ ] Apenas 1 registro na tabela `webhook_events` para o mesmo `eventId`
- [ ] Apenas 1 pedido na tabela `orders` para o mesmo `externalReference`
- [ ] Payment ID não está duplicado em múltiplos pedidos
- [ ] Logs mostram "[WEBHOOK] Event already processed" na segunda chamada
- [ ] Status do pedido não foi reprocessado desnecessariamente

## 📝 Notas Importantes

1. **Unique Constraint**: A tabela `webhook_events` tem constraint `@@unique([provider, eventId])` que previne duplicatas no nível do banco de dados.

2. **Idempotência em Múltiplas Camadas**:
   - **Camada 1**: Unique constraint na tabela `webhook_events`
   - **Camada 2**: Verificação se `paymentId` já existe em outro pedido
   - **Camada 3**: Verificação se status realmente mudou antes de atualizar

3. **Resposta 200 OK**: Ambas as chamadas retornam 200 OK, mas apenas a primeira processa. Isso é o comportamento esperado para webhooks.

## 🐛 Troubleshooting

### Se encontrar duplicatas:

1. Verifique se a constraint `@@unique([provider, eventId])` está ativa:
   ```sql
   SELECT constraint_name, constraint_type 
   FROM information_schema.table_constraints 
   WHERE table_name = 'webhook_events';
   ```

2. Verifique se o `eventId` é exatamente o mesmo nas duas chamadas (case-sensitive)

3. Verifique os logs para ver se há erros durante o processamento

4. Verifique se há race conditions (duas chamadas simultâneas)
