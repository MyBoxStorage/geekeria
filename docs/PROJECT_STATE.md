# Estado do Projeto

## Prisma

**Versão fixada:** 5.22.0 (evitar que `npx prisma` sem versão instale Prisma 7)

### Comando padrão para gerar client

```bash
npx prisma@5.22.0 generate --schema=./prisma/schema.prisma
```

### Scripts npm disponíveis

- `npm run prisma:generate` — gera o Prisma Client (raiz ou `cd server && npm run prisma:generate`)
- `npm run prisma:status` — verifica status das migrations
- `npm run prisma:migrate` — migrations em dev (apenas em server/)
- `npm run prisma:studio` — abre Prisma Studio (apenas em server/)

### Banco de dados (Supabase)

- Projeto: BravosBrasilEcommerce
- Schema: `prisma/schema.prisma`
- Client gerado em: `server/node_modules/.prisma/client`

## Backend Fly.io

**App name real:** `bravosbackend`  
**Host real:** `https://bravosbackend.fly.dev`

### Secrets (GitHub Actions)

- `MONITOR_API_URL`: deve ser `https://bravosbackend.fly.dev` (sem path)
- Usado por: deploy-backend-fly (smoke), monitor-production, reconcile-pending-production

**Passo manual:** GitHub > Settings > Secrets and variables > Actions > `MONITOR_API_URL` = `https://bravosbackend.fly.dev`

## Monitor Production (Monitor Check)

O endpoint `/api/internal/monitor` retorna `ok: true/false` com base em:
- **db**: conectividade do banco
- **pendingTooLong**: pedidos PENDING com `mp_payment_id` há mais de 15 min (bloqueia `ok`)
- **abandonedPending**: pedidos PENDING sem `mp_payment_id` (carrinho abandonado; não bloqueia)
- **failedWebhooks**: webhooks com `status='failed'` nas últimas 24h (bloqueia `ok`)
- **ignoredWebhooksLast24h**: webhooks com `status='ignored'` nas últimas 24h (observabilidade; não bloqueia)
- **countHighRiskLast1h/24h**: pedidos com risco alto

### failed vs ignored

- **failed**: webhook que falhou ao processar (ex.: erro 5xx, timeout). **É alerta** — derruba o monitor.
- **ignored**: webhook intencionalmente ignorado (ex.: pagamento 404 em teste, evento duplicado). **É ruído esperado** — não derruba o monitor.

### Como rodar monitor-selftest.js

O script valida que webhooks 404 (MP_PAYMENT_NOT_FOUND_404) são tratados como `ignored` e **não** como `failed`, garantindo que o monitor não seja derrubado por ruído.

```bash
# Com variáveis de ambiente (não logar ADMIN_TOKEN)
API_URL=https://bravosbackend.fly.dev ADMIN_TOKEN=<seu_token> node scripts/monitor-selftest.js

# Ou com argumentos
node scripts/monitor-selftest.js https://bravosbackend.fly.dev <ADMIN_TOKEN>
```

- Carrega `DATABASE_URL` de `server/.env` se não estiver em env.
- **Não exige** secrets do Mercado Pago.
- **Não roda** automaticamente em cron; apenas manual.

## Cancel Abandoned (cancel-abandoned)

Cancela pedidos **PENDING** abandonados (sem `mp_payment_id` — carrinho sem pagamento iniciado).

### Quando usar

- Limpeza operacional de pedidos antigos sem pagamento (carrinhos abandonados).
- Não afeta pedidos reais: **NÃO cancela** pedidos com `mp_payment_id`.
- Não toca em PAID, CANCELED, REFUNDED.

### Parâmetros recomendados

- `olderThanMinutes`: 60 (mín. 15)
- `limit`: 100 (máx. 200)

### Como rodar scripts/cancel-abandoned.js

```bash
# 1) Dry run (só mostra o que seria cancelado)
node scripts/cancel-abandoned.js https://bravosbackend.fly.dev <ADMIN_TOKEN>

# 2) Aplicar de fato
node scripts/cancel-abandoned.js https://bravosbackend.fly.dev <ADMIN_TOKEN> --apply

# Ou com env: OLDER_THAN_MINUTES=60 LIMIT=100 APPLY=true
API_URL=https://bravosbackend.fly.dev ADMIN_TOKEN=<token> APPLY=true node scripts/cancel-abandoned.js
```

### Política

- Pedidos abandonados sem pagamento são cancelados manualmente (por enquanto).
- Endpoint: `POST /api/internal/cancel-abandoned` com `x-admin-token`.
- Rate limit: 5 req / 5 min.
