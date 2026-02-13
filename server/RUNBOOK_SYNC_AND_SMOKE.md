# Runbook: Sync Prisma migrations (Supabase) + smoke test

## Pré-requisitos
- `server/.env` com `DATABASE_URL` (e demais vars; não logar secrets).
- Em ambiente que consiga alcançar o Supabase (rede/firewall).
- `ADMIN_TOKEN` disponível para testes admin (não imprimir).

---

## Passo 0 — Ambiente
- Confirmar que `server/.env` existe e contém `DATABASE_URL`.
- Não logar `DATABASE_URL` nem `ADMIN_TOKEN`.

---

## Passo 1 — Prisma migrate (a partir de ambiente com acesso ao DB)

Na **raiz do repo** (`app/`):

```bash
npx prisma migrate status --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma
npx prisma migrate status --schema=./prisma/schema.prisma
```

Esperado no último comando: **"Database schema is up to date!"** e nenhuma migration pendente.

Nota: A migration `20260212000000_add_order_risk_telemetry` já foi marcada como aplicada em `_prisma_migrations` no Supabase (via MCP). Em ambientes onde o Prisma não alcança o DB (ex.: P1001), o deploy fica para quando rodar de uma máquina/CI com acesso.

---

## Passo 2 — Build e start do backend

```bash
cd server
npm run build
npx prisma generate --schema=../prisma/schema.prisma
npm run start
```

(O generator está configurado para gerar o client em `server/node_modules/.prisma/client`.)

---

## Passo 3 — Smoke tests HTTP

Base URL: `http://localhost:3000` (ou a do deploy). Usar header `x-admin-token: <ADMIN_TOKEN>` onde indicado.

| Teste | Request | Esperado |
|-------|--------|--------|
| Health | `GET /health` | 200, `{"status":"ok",...}` |
| Monitor | `GET /api/internal/monitor` + header `x-admin-token` | 200 (shape do monitor) |
| Admin list PENDING | `GET /api/admin/orders?status=PENDING&limit=10` + header `x-admin-token` | 200, `{ status, count, orders }`. Em pelo menos um pedido: `riskScore`, `riskFlag`, `riskReasons`, `ipAddress`, `userAgent` (podem ser null em pedidos antigos). |
| Export | `GET /api/admin/orders/:externalReference/export` + header `x-admin-token` | 200, payload com `risk = { score, flag, reasons, ipAddress, userAgent }` |
| Tracking público | `GET /api/orders/:externalReference?email=<email_do_pedido>` | 200 quando email bate; 404 quando não bate; não retornar email em claro (somente mascarado) |

Exemplo (PowerShell, definindo o token na sessão):

```powershell
$base = "http://localhost:3000"
$headers = @{ "x-admin-token" = $env:ADMIN_TOKEN }
Invoke-WebRequest -Uri "$base/health" -UseBasicParsing
Invoke-WebRequest -Uri "$base/api/internal/monitor" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "$base/api/admin/orders?status=PENDING&limit=10" -Headers $headers -UseBasicParsing
```

---

## Passo 4 — Validar persistência do risco (opcional)
Criar um pedido de teste (ex.: `POST /api/checkout/create-order` ou fluxo MP), guardar `externalReference`, depois:
- Listar em admin e localizar o pedido.
- Confirmar `ipAddress`, `userAgent`, `riskScore`, `riskReasons` condizentes.
- Chamar export e tracking como no passo 3.

---

## Rollback
Se algo falhar: reverter o commit do Prompt B (scoring/captura). Não remover colunas do banco (mudança aditiva).
