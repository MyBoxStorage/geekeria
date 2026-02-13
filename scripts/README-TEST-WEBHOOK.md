# Teste de Idempotência do Webhook

Este script testa a idempotência do webhook do Mercado Pago, garantindo que chamadas duplicadas não processem o mesmo pagamento duas vezes.

## Pré-requisitos

1. Servidor backend rodando (`npm run dev` no diretório `server/`)
2. Variável de ambiente `MP_WEBHOOK_SECRET` configurada
3. Variável de ambiente `BACKEND_URL` configurada (ou usa `http://localhost:3001` por padrão)

## Como executar

```bash
# No diretório raiz do projeto
node scripts/test-webhook-idempotency.js
```

## O que o teste faz

1. **Primeira chamada**: Envia um webhook de pagamento
   - Deve processar normalmente
   - Cria registro na tabela `webhook_events`
   - Atualiza o pedido (se existir)

2. **Segunda chamada**: Envia o MESMO webhook (idêntico)
   - Deve ser ignorado por idempotência
   - NÃO cria novo registro em `webhook_events` (unique constraint)
   - NÃO atualiza o pedido novamente

## O que verificar

### 1. Logs do servidor

Primeira chamada deve mostrar:
```
[WEBHOOK] Event received { eventType: 'payment', eventId: 'test-payment-...' }
[WEBHOOK] Order updated successfully { ... }
```

Segunda chamada deve mostrar:
```
[WEBHOOK] Event already processed { eventType: 'payment', eventId: 'test-payment-...' }
```

### 2. Banco de dados

```sql
-- Verificar eventos de webhook
SELECT * FROM webhook_events 
WHERE event_id LIKE 'test-payment-%' 
ORDER BY received_at DESC;

-- Deve haver apenas 1 registro com status 'processed'
-- O segundo evento não deve ser criado (unique constraint)
```

### 3. Pedidos

```sql
-- Verificar se pedidos não foram duplicados
SELECT * FROM orders 
WHERE external_reference LIKE 'TEST-%' 
ORDER BY created_at DESC;

-- Deve haver apenas 1 pedido por external_reference
```

## Cenários de teste

### Cenário 1: Webhook duplicado (mesmo eventId)
- ✅ Primeira chamada: processa
- ✅ Segunda chamada: ignora (unique constraint)

### Cenário 2: Payment ID já processado para outro pedido
- ✅ Verifica se `mpPaymentId` já existe em outro pedido
- ✅ Ignora se encontrar duplicata

### Cenário 3: Status não mudou
- ✅ Verifica se status atual === novo status
- ✅ Ignora atualização se não houver mudança

## Troubleshooting

### Erro: "MP_WEBHOOK_SECRET não configurado"
- Verifique se a variável está no `.env` ou `.env.local`
- Certifique-se de que o script está carregando o arquivo correto

### Erro: "Connection refused"
- Certifique-se de que o servidor backend está rodando
- Verifique se `BACKEND_URL` está correto

### Webhook não está sendo ignorado
- Verifique os logs do servidor
- Confirme que a constraint `@@unique([provider, eventId])` está ativa
- Verifique se o `eventId` é exatamente o mesmo nas duas chamadas
