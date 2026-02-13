# Auditoria — Distribuição Frontend vs Backend

**Data:** 2025-02-12  
**Repositórios:** `app` (monorepo frontend + backend local) | `bravosbackend` (backend deployável — [MyBoxStorage/bravosbackend](https://github.com/MyBoxStorage/bravosbackend))

---

## 1. Onde cada coisa vive

| Tipo | Repo / Pasta | Descrição |
|------|----------------|-----------|
| **Frontend** | `app/` | React, Vite, páginas, componentes, `src/`, `public/`, `index.html`, `vite.config.ts`, etc. |
| **Backend (dev/local)** | `app/server/` | Express no monorepo: rotas, serviços, Prisma (schema em `app/prisma/`). Usado para desenvolvimento fullstack. |
| **Backend (deploy)** | `bravosbackend/` | Backend standalone para deploy (Fly.io). Estrutura plana: `admin/`, `checkout/`, `mp/`, `orders/`, `shipping/`, `integrations/`, `services/`, `utils/`, `prisma/`. |

---

## 2. Estrutura atual

### 2.1 App (monorepo)

```
app/
├── .github/workflows/          ← workflows estavam aqui (deploy referencia server/ e frontend)
│   ├── deploy-backend-fly.yml  → deveria rodar no repo bravosbackend
│   ├── monitor-production.yml
│   └── reconcile-pending-production.yml
├── prisma/                     ← schema + migrations (compartilhado conceito com backend)
├── server/                     ← backend no monorepo
│   ├── index.ts
│   ├── routes/admin/orders.ts, audit.ts
│   ├── routes/internal/monitor.ts, reconcile-pending.ts
│   ├── routes/mp/create-payment.ts, create-preference.ts, webhooks.ts, get-payment.ts
│   ├── routes/checkout/create-order.ts
│   ├── routes/orders/get-order.ts, mark-montink.ts
│   ├── routes/shipping/quote.ts
│   ├── routes/health.ts
│   ├── services/mp/, services/risk/, montinkFulfillment.ts
│   ├── integrations/montink/, config/, utils/, types/
│   ├── fly.toml, Dockerfile
│   └── .env
├── scripts/                    ← scripts que chamam a API (E2E, monitor, reconcile)
│   ├── e2e-smoke-staging.js
│   ├── monitor-check.js
│   └── reconcile-pending.js
├── src/                        ← FRONTEND (páginas, serviços, tipos)
└── ...
```

### 2.2 Bravosbackend (repo backend)

```
bravosbackend/
├── .github/workflows/          ← CRIADO: deploy, monitor, reconcile (para rodar no GitHub deste repo)
├── admin/orders.ts             ← sem riskScore/riskFlag/ipAddress/userAgent no list (schema sem esses campos)
├── checkout/create-order.ts
├── mp/create-payment.ts, create-preference.ts, webhooks.ts
├── orders/get-order.ts, mark-montink.ts
├── shipping/quote.ts
├── health.ts
├── integrations/montink/, config/, services/, types/, utils/
├── prisma/schema.prisma        ← sem campos de risk/telemetria no Order
└── (index.ts / package.json podem estar no remoto; clone local pode estar parcial)
```

---

## 3. Diferenças app/server vs bravosbackend (últimas alterações)

| Recurso | app/server | bravosbackend |
|---------|------------|----------------|
| Admin list orders | Inclui riskScore, riskFlag, riskReasons, ipAddress, userAgent | Só campos básicos |
| GET /api/admin/orders/:ref/audit | ✅ audit.ts | ❌ não existe |
| GET /api/internal/monitor | ✅ monitor.ts | ❌ não existe |
| POST /api/internal/reconcile-pending | ✅ reconcile-pending.ts | ❌ não existe |
| GET /api/mp/payment/:id | ✅ get-payment.ts | ❌ não existe |
| Risk scoring (create-order, etc.) | ✅ services/risk/riskScoring.ts | ❌ não existe |
| Rate limiting | ✅ utils/rateLimiter.ts | ❌ não existe |
| Prisma Order | ipAddress, userAgent, riskScore, riskFlag, riskReasons | Sem esses campos |
| WebhookEvents / AdminEvent (audit) | ✅ schema + audit | bravosbackend tem AdminEvent; sem audit route |

---

## 4. Distribuição aplicada

### 4.1 O que fica no app (frontend + backend local)

- **Tudo em `app/src/`** — frontend (OrderTracking, CheckoutSuccess, CheckoutPending, AdminDashboard, api, types, etc.).
- **`app/server/`** — mantido como está; backend completo para desenvolvimento e testes no monorepo.
- **`app/prisma/`** — schema e migrations que o server usa (output para `server/node_modules/.prisma/client`).
- **`app/scripts/`** — E2E smoke, monitor-check, reconcile-pending (chamam a API; podem rodar contra app/server ou bravosbackend deployado).
- **`app/.github/workflows/`** — podem permanecer para CI do monorepo (ex.: build frontend, testes). O **deploy do backend** para Fly passa a ser feito pelo repo **bravosbackend** (workflows criados em bravosbackend).

### 4.2 O que foi colocado no bravosbackend

- **`bravosbackend/.github/workflows/`** (criado)
  - **`deploy-backend-fly.yml`** — deploy Fly a partir da raiz do repo (sem frontend, sem pasta `server/`). Trigger: `workflow_dispatch` + push na `main` (paths: `**.ts`, `prisma/**`, workflow, package.json, tsconfig, fly.toml, Dockerfile). Steps: checkout, npm ci + build, prisma migrate status/deploy, flyctl deploy, smoke GET /health.
  - **`monitor-production.yml`** — cron a cada 5 min + `workflow_dispatch`. Chama GET /api/internal/monitor via curl (requer endpoint no backend).
  - **`reconcile-pending-production.yml`** — cron a cada 15 min + `workflow_dispatch`. Chama POST /api/internal/reconcile-pending via curl (requer endpoint no backend).

**Nota:** Os workflows de monitor e reconcile passam a funcionar quando o bravosbackend tiver as rotas `/api/internal/monitor` e `/api/internal/reconcile-pending` (hoje existem só no `app/server`). Até lá, esses jobs podem falhar ou ser desativados.

Não foi alterada a estrutura de pastas/arquivos do bravosbackend (admin/, checkout/, mp/, etc.). A inclusão das rotas audit, internal/monitor, internal/reconcile-pending, get-payment, risk e rate limiting no bravosbackend pode ser feita em um próximo passo, adaptando paths ao layout do repo (ex.: no GitHub o bravosbackend usa `routes/`; o clone local pode usar pastas no topo).

---

## 5. Resumo

| Ação | Onde |
|------|------|
| Frontend (React, Vite, páginas) | **app** — sem mudança |
| Backend de desenvolvimento (Express no monorepo) | **app/server** — sem mudança |
| Deploy do backend (Fly.io) e workflows de monitor/reconcile | **bravosbackend** — workflows adicionados em `.github/workflows/` |
| Scripts (E2E, monitor-check, reconcile) | **app/scripts** — continuam no app; workflows do bravosbackend podem usar curl ou, no futuro, cópia desses scripts para bravosbackend |

Nenhuma alteração que quebre a estrutura atual do app ou do bravosbackend foi feita além da criação dos workflows no bravosbackend.
