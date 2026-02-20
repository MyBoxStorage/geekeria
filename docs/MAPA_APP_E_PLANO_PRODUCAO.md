# Geekstore (GEEKERIA) — Mapa do App e Plano de Produção

**Data:** 2025-02-19  
**Objetivo:** Fase de descoberta (somente leitura). Mapear funcionamento atual, integrações, env vars e deploy; produzir checklist e plano prompt-por-prompt para colocar online (Vercel + Fly) com checkout e imagens no Supabase Storage.

---

## 1) MAPA DO APP

### 1.1 Estrutura do repositório

- **Raiz do projeto:** `c:\Users\pc\Desktop\geekstore`
- **Frontend + monorepo:** `app/`
  - **Build/UI:** `app/` — Vite + React (TypeScript), React Router, Radix UI, Tailwind
  - **Backend:** `app/server/` — Express (Node), Prisma, roda em porta separada
  - **Prisma:** schema em `app/prisma/schema.prisma`; client gerado em `app/server/node_modules/.prisma/client`
- **Outros:** `app/docs/`, `app/scripts/`, `app/public/`, `app/.vercel/`, `app/.github/workflows/`

Não existe pasta `bravosbackend/` na raiz do geekstore; o backend é `app/server/` (nome do package: `bravos-brasil-backend`).

### 1.2 Stack

| Camada    | Tecnologia |
|----------|------------|
| Frontend | Vite 7, React 19, React Router 7, TypeScript, Tailwind, Radix UI, `@mercadopago/sdk-react`, `@supabase/supabase-js` |
| Backend  | Node 20, Express 4, TypeScript, Prisma 5.22, Zod |
| DB       | PostgreSQL (Supabase) — connection string em `DATABASE_URL` |
| Build FE | `npm run build` → `tsc -b && vite build` → saída em `app/dist` |
| Build BE | `cd server && npm run build` → `tsc` → saída em `server/dist` |

### 1.3 Scripts package.json relevantes

**Raiz `app/package.json`:**
- `dev` — `vite` (frontend apenas)
- `build` — `tsc -b && vite build` (frontend)
- `preview` — `vite preview`
- `prebuild` — checagem de secrets + `generate-sitemap.ts`
- `prisma:generate` / `prisma:status` — Prisma (schema em `./prisma`)

**`app/server/package.json`:**
- `dev` — `tsx watch index.ts`
- `build` — `tsc`
- `start` — `node dist/index.js`
- `prisma:generate` / `prisma:migrate` / `prisma:studio` / `prisma:seed` — referem schema `../prisma/schema.prisma`

### 1.4 Backend — Endpoints (Express)

Resumo por grupo (arquivo fonte: `app/server/index.ts`).

| Método + Rota | Handler | Descrição |
|---------------|---------|-----------|
| GET /health | healthCheck | Liveness |
| GET /health/ready | — | Readiness (testa DB) |
| POST /api/mp/create-payment | createPayment | Cria pagamento MP (PIX/Boleto), usa BACKEND_URL para notification_url |
| POST /api/mp/process-card-payment | processCardPayment | Pagamento com cartão |
| POST /api/mp/create-preference | createPreference | Cria preferência MP para pedido existente; back_urls e notification_url com FRONTEND_URL/BACKEND_URL |
| GET /api/mp/payment/:paymentId | getPayment | Consulta status pagamento MP |
| GET /api/mp/webhooks | — | Resposta fixa "Webhook endpoint OK" |
| POST /api/mp/webhooks | webhookHandler | Recebe notificações MP (valida x-signature com MP_WEBHOOK_SECRET) |
| POST /api/shipping/quote | shippingQuote | Cotação de frete |
| GET /api/catalog/products | listCatalogProducts | Lista produtos (filtros, paginação) |
| GET /api/catalog/products/:slug | getCatalogProduct | Produto por slug |
| POST /api/checkout/create-order | createOrder | Cria Order + OrderItems (recalcula totais, cupom, risco) |
| GET /api/orders/:externalReference | getOrder | Detalhes do pedido |
| GET /api/orders/:externalReference/events | orderEventsHandler | SSE para atualização de status |
| POST /api/orders/:externalReference/update-payment | updateOrderPayment | Atualiza dados de pagamento do pedido |
| POST /api/orders/link | linkOrder | Requer auth JWT; associa pedido ao usuário |
| POST /api/orders/:externalReference/mark-montink | markMontink | Admin; marca pedido Montink |
| GET/POST/PUT/DELETE /api/admin/* | vários | Pedidos, export, audit, generations, prompt-templates, coupons, analytics, **storage/upload**, products, catalog-health; todos com validateAdminToken + rate limit |
| POST /api/coupons/validate | validateCoupon | Valida cupom (optionalAuth) |
| GET /api/internal/monitor | monitorStatus | Admin; status para monitoramento |
| POST /api/internal/reconcile-pending | reconcilePending | Admin |
| POST /api/internal/cancel-abandoned | cancelAbandoned | Admin |
| POST /api/internal/abandoned-cart-email | sendAbandonedCartEmails | Admin |
| POST /api/internal/cleanup-expired-generations | cleanupExpiredGenerations | Admin |
| POST /api/newsletter/subscribe | subscribeNewsletter | Newsletter |
| POST /api/auth/signup, login, verify-email, resend-verification | auth | Auth própria (JWT, não Supabase Auth) |
| GET /api/auth/me | me | Requer auth |
| POST /api/generate-stamp | generateStamp | Gera estampa (Gemini + GCS); requer auth + créditos |
| GET /api/my-generations, /api/user/my-generations | list / getMyGenerations | Requer auth |
| GET /api/user/my-orders | getMyOrders | Requer auth |

**Upload de imagens de produtos:** `POST /api/admin/storage/upload` — multipart, campo `file`; envia para Supabase Storage bucket `products`; retorna `publicUrl`. Usa `getSupabaseAdmin()` (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).

### 1.5 Frontend — Rotas e fluxo do usuário

**Router:** React Router (`app/src/App.tsx`), BrowserRouter + Routes.

| Rota | Componente | Descrição |
|------|------------|-----------|
| / | HomePage | Home |
| /catalogo | CatalogPage | Catálogo (lista produtos via API) |
| /produto/:slug | ProductPage | Página do produto |
| /checkout/success | CheckoutSuccess | Sucesso pagamento |
| /checkout/failure | CheckoutFailure | Falha pagamento |
| /checkout/pending | CheckoutPending | Pagamento pendente |
| /minha-conta | UserDashboard | Área do usuário (auth própria) |
| /order | OrderTracking | Rastreamento por referência |
| /admin/* | AdminUnifiedPage | Painel admin (lazy); sub-rotas: orders, dashboard, generations, prompts, coupons, products |
| /trocas-e-devolucoes, /politica-de-privacidade, /termos-de-uso, /sobre, /contato | Páginas estáticas | |
| /minhas-estampas | MinhasEstampasPage | Estampas do usuário |

**Fluxo de compra (resumido):**  
Catálogo → Produto → (carrinho implícito no checkout) → Checkout (create-order no backend, depois create-preference ou create-payment MP) → Redirecionamento MP → success/failure/pending. Pedido é criado em `POST /api/checkout/create-order`; pagamento pode ser Preference (Checkout Pro) ou PIX/Boleto via `create-payment`.

**API no frontend:** `src/config/api.ts` — `API_URL` = `VITE_API_URL` ou em dev `http://localhost:3001`, em prod fallback `https://bravosbackend.fly.dev`. Nenhum proxy no Vite para a API; chamadas diretas ao backend.

### 1.6 Admin

- **Login:** Não é Supabase Auth. Tela `AdminLogin`: usuário informa o **ADMIN_TOKEN**; o token é guardado em memória/localStorage (useAdminAuth) e enviado no header `x-admin-token` em todas as chamadas a `/api/admin/*` e `/api/internal/*`.
- **Painel:** Pedidos, Dashboard, Estampas, Prompts, Cupons, Produtos (CRUD). Upload de imagens de produtos via `POST /api/admin/storage/upload` (backend sobe para Supabase Storage bucket `products`).
- **Supabase no frontend:** `src/lib/supabase.ts` cria cliente com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Esse cliente **não é importado por nenhum componente** atualmente; o .env.example menciona “Admin Panel” para Supabase — hoje o admin usa apenas `x-admin-token`.

### 1.7 Dados — Catálogo, pedidos, usuários

- **Catálogo:** Produtos vêm do **PostgreSQL (Supabase)** via Prisma. Tabelas: `products`, `orders`, `order_items`, `users`, `generations`, `coupons`, `webhook_events`, etc. Listagem pública: `GET /api/catalog/products` e `GET /api/catalog/products/:slug` (filtros, slug, categoria TESTES excluída).
- **Pedidos:** Criados em `create-order`; atualizados por webhook MP e por `update-payment`; status mapeado em `server/services/mp/statusMapper.ts`.
- **Usuários/Admin:** Usuários da loja em `users` (auth própria com JWT, `JWT_SECRET`). Admin não usa tabela de usuários Supabase; acesso por `ADMIN_TOKEN` no header.

### 1.8 Integrações

| Integração | Onde | Observação |
|------------|------|------------|
| **Mercado Pago** | Backend: create-payment, create-preference, webhooks, get-payment, process-card-payment. Frontend: SDK React (Payment Brick), preference via API. | notification_url = BACKEND_URL + `/api/mp/webhooks`; back_urls success/failure/pending = FRONTEND_URL + `/checkout/*`. Webhook valida assinatura com MP_WEBHOOK_SECRET. |
| **Supabase** | **DB:** Prisma usa DATABASE_URL (Postgres Supabase). **Storage:** Backend usa bucket `products` (upload admin) via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Frontend: cliente em `lib/supabase.ts` (não usado por componentes). | Bucket esperado: nome `products`, público (getPublicUrl). |
| **Email** | Nodemailer (GMAIL_USER, GMAIL_APP_PASSWORD). Envio em webhook (confirmação de pedido, status). | Opcional. |
| **Telegram** | Notificações de novas gerações (estampas). | Opcional. |
| **Google Cloud Storage** | Estampas geradas (generate-stamp): bucket `bravos-estampas-geradas`, GCS_KEY_BASE64. | Opcional; sem GCS a geração retorna 503. |
| **Gemini** | Geração de estampas (GEMINI_API_KEY). | Opcional. |
| **Montink** | Fulfillment (envio de pedidos); disparado no webhook quando status READY_FOR_MONTINK. | Integração específica do projeto. |

---

## 2) LISTA DE ENV VARS

Tabela: **nome** | **Onde** (Vercel / Fly / local) | **Obrigatório?** | **Descrição** (fonte no código/docs).

| Nome | Onde | Obrigatório? | Descrição |
|-----|------|--------------|-----------|
| VITE_API_URL | Vercel (frontend) | Sim (prod) | URL do backend. Dev: ex. http://localhost:3001; prod: https://bravosbackend.fly.dev. Usado em `src/config/api.ts`. |
| VITE_MERCADOPAGO_PUBLIC_KEY | Vercel | Sim | Chave pública MP (Payment Brick). `.env.example` / MercadoPagoProvider. |
| VITE_MERCADOPAGO_WEBHOOK_URL | Vercel | Opcional | URL do webhook; se vazio, frontend pode não enviar; backend usa BACKEND_URL. `mercadopago.config.ts`, PaymentBrick. |
| VITE_SUPABASE_URL | Vercel | Opcional* | Supabase URL. *Cliente em `lib/supabase.ts` não usado por componentes; .env.example diz "Admin Panel". |
| VITE_SUPABASE_ANON_KEY | Vercel | Opcional* | Supabase anon key. *Idem. |
| DATABASE_URL | Fly (backend) | Sim | Connection string Postgres (Supabase). `server/.env.example`, Prisma, env.ts CORE. |
| MP_ACCESS_TOKEN | Fly | Sim | Access token MP (server-side). create-payment, create-preference, webhooks, get-payment. env.ts CORE. |
| MP_WEBHOOK_SECRET | Fly | Sim | Secret para validar x-signature do webhook. webhooks.ts; sem ele webhook retorna 401. env.ts CORE. |
| FRONTEND_URL | Fly | Sim | URL do frontend (CORS, back_urls da preference). env.ts CORE. |
| BACKEND_URL | Fly | Sim | URL do backend (notification_url MP). create-payment.ts linha 182; create-preference.ts linha 104. env.ts CORE. |
| ADMIN_TOKEN | Fly | Sim | Token para rotas /api/admin/* e /api/internal/*. validateAdminToken. env.ts CORE. |
| JWT_SECRET | Fly | Sim | Assinatura JWT (auth loja: login, me, create-order link). authMiddleware, create-order. env.ts CORE; placeholder CHANGE_ME_IN_PRODUCTION faz exit(1) em prod. **Não está em server/.env.example.** |
| PORT | Fly | Sim (implícito) | Backend. fly.toml server: [env] PORT="8080". Dockerfile ENV PORT=8080. |
| NODE_ENV | Fly | Sim (prod) | production para validação CORE. fly.toml [env]. |
| SUPABASE_URL | Fly | Para upload admin | Usado por getSupabaseAdmin (storage upload). Não está em CORE; sem elas upload quebra. |
| SUPABASE_SERVICE_ROLE_KEY | Fly | Para upload admin | Idem. |
| GEMINI_API_KEY | Fly | Opcional | Geração de estampas. OPTIONAL_ENV_KEYS. |
| GCS_KEY_BASE64 | Fly | Opcional | Upload estampas geradas (GCS). generate.ts, storage.ts. OPTIONAL_ENV_KEYS. |
| GMAIL_USER, GMAIL_APP_PASSWORD | Fly | Opcional | Email (confirmação pedido, etc.). server/.env.example. |
| TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID | Fly | Opcional | Notificações. server/.env.example. |

Não invente valores; preencher conforme painéis (Vercel, Fly, Supabase, Mercado Pago).

---

## 3) CHECKLIST PRODUÇÃO

- [ ] **Build:** `npm run build` na raiz do app (frontend) conclui sem erro; `cd server && npm run build` conclui sem erro.
- [ ] **Backend sobe:** Com CORE env vars (incl. JWT_SECRET), `cd server && npm start` sobe na porta configurada (ex.: 8080) e `/health` e `/health/ready` retornam 200.
- [ ] **Frontend dev:** Com VITE_API_URL apontando para backend local, fluxo catálogo → produto → checkout (create-order + preference ou payment) funciona em local.
- [ ] **Supabase DB:** DATABASE_URL aponta para o projeto correto (ex.: BravosBrasilEcommerce); migrations aplicadas; Prisma conecta.
- [ ] **Supabase Storage:** Bucket `products` existe no projeto Supabase; políticas permitem upload com service_role e leitura pública para imagens; backend com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sobe e upload em /api/admin/storage/upload retorna publicUrl.
- [ ] **Mercado Pago:** MP_ACCESS_TOKEN (produção) e MP_WEBHOOK_SECRET configurados no Fly; no painel MP a URL de notificação é BACKEND_URL + `/api/mp/webhooks`; webhook responde 200 e assinatura válida; create-preference usa FRONTEND_URL/BACKEND_URL corretos.
- [ ] **Vercel:** Root Directory = `app` (ou o path onde está o frontend); Build Command = `npm run build`; Output = `dist`; env VITE_API_URL, VITE_MERCADOPAGO_PUBLIC_KEY (e opcionalmente VITE_MERCADOPAGO_WEBHOOK_URL) definidos; rewrites/headers conforme `vercel.json` (ex.: SPA fallback).
- [ ] **Fly:** Deploy a partir do contexto que inclui `server/` e `prisma/` (conforme Dockerfile); PORT=8080; secrets/env: DATABASE_URL, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, FRONTEND_URL, BACKEND_URL, ADMIN_TOKEN, JWT_SECRET (e SUPABASE_* se usar upload admin); release_command Prisma migrate; health check em /health/ready.
- [ ] **CORS:** FRONTEND_URL no backend inclui o domínio exato do frontend (ex.: https://bravosbrasil.com.br); múltiplas origens separadas por vírgula se necessário.
- [ ] **JWT_SECRET:** Definido no Fly, forte e diferente de CHANGE_ME_IN_PRODUCTION.
- [ ] **ADMIN_TOKEN:** Forte e único; só em backend e em quem acessa o painel.
- [ ] **E2E mínimo:** Uma compra de teste (preference ou PIX) até redirecionamento para success/pending; webhook recebido e pedido atualizado para PAID (ou estado esperado).

---

## 4) PLANO PROMPT-POR-PROMPT

Cada etapa abaixo é **um prompt** para você aplicar no Cursor (uma por vez). Não executar todas de uma vez.

---

### Etapa 0 — Validação local (build + run)

**Prompt sugerido:**

> No projeto Geekstore (pasta app): (1) Garantir que existe `server/.env` com as variáveis mínimas para rodar o backend (DATABASE_URL, PORT=3001, JWT_SECRET com valor seguro, e opcionalmente MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, FRONTEND_URL, BACKEND_URL, ADMIN_TOKEN para testar rotas admin). (2) Adicionar JWT_SECRET ao arquivo `server/.env.example` com comentário de que é obrigatório em produção. (3) Rodar `npm run build` na raiz do app e `cd server && npm run build` e corrigir erros de build se houver. (4) Rodar o backend com `cd server && npm start` e o frontend com `npm run dev`; verificar que a home e o catálogo carregam e que uma chamada a GET /health e GET /health/ready retorna 200.

---

### Etapa 1 — Preparar Supabase (via MCP)

**Prompt sugerido:**

> Usar o MCP Supabase para o projeto que será usado em produção (confirmar project_id: BravosBrasilEcommerce ou o que estiver em DATABASE_URL). (1) Verificar se existe bucket de Storage chamado `products`; se não existir, criar bucket público para imagens de produtos (leitura pública). (2) Garantir que as políticas do bucket permitam: upload via service_role (backend) e leitura pública para os objetos. (3) Documentar em uma linha no README ou em ENV_SETUP onde obter SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY e que o bucket se chama `products`. Não alterar código nesta etapa; apenas infra e documentação.

---

### Etapa 2 — Preparar Mercado Pago (via MCP)

**Prompt sugerido:**

> Usar o mercadopago-mcp-server para a aplicação deste projeto. (1) Confirmar ou criar a URL de webhook de notificação para pagamentos: deve ser BACKEND_URL + `/api/mp/webhooks` (ex.: https://bravosbackend.fly.dev/api/mp/webhooks). (2) Obter ou confirmar o Webhook Secret e documentar que ele deve ser configurado no Fly como MP_WEBHOOK_SECRET. (3) Listar no doc do projeto as env vars obrigatórias para MP no backend (MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET) e no frontend (VITE_MERCADOPAGO_PUBLIC_KEY) e a URL de redirect success/failure/pending (FRONTEND_URL + /checkout/success, etc.). Não alterar código; apenas configuração e documentação.

---

### Etapa 3 — Configurar Vercel

**Prompt sugerido:**

> Com base no mapa do app Geekstore: (1) Definir no projeto Vercel o Root Directory (ex.: `app` se o repositório tiver a pasta app na raiz). (2) Build Command: `npm run build`; Output Directory: `dist`. (3) Configurar as variáveis de ambiente de produção: VITE_API_URL (URL do backend Fly), VITE_MERCADOPAGO_PUBLIC_KEY; opcionalmente VITE_MERCADOPAGO_WEBHOOK_URL. (4) Se o frontend usar Supabase no futuro, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY podem ficar opcionais. (5) Garantir que vercel.json (rewrites para SPA, headers de segurança) está aplicado. Fazer um deploy de teste e verificar se a home e o catálogo carregam e se as chamadas à API vão para o backend correto.

---

### Etapa 4 — Configurar Fly

**Prompt sugerido:**

> Com base no fly.toml em app/server e no Dockerfile do backend: (1) Confirmar que o deploy do Fly usa o contexto de build que inclui prisma/ e server/ (conforme Dockerfile). (2) Configurar no Fly todos os secrets/env de produção listados no mapa: DATABASE_URL, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, FRONTEND_URL, BACKEND_URL, ADMIN_TOKEN, JWT_SECRET; e, para upload de imagens no admin, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. (3) Garantir PORT=8080 (já em fly.toml [env] e Dockerfile). (4) Confirmar que o release_command do Prisma (migrate deploy) roda e que o health check usa /health/ready. (5) Após deploy, testar GET /health e GET /health/ready e POST /api/mp/webhooks com assinatura válida (ou GET para mensagem OK).

---

### Etapa 5 — Testes E2E (checkout e webhooks)

**Prompt sugerido:**

> No Geekstore em produção (Vercel + Fly): (1) Executar um fluxo de checkout mínimo: acessar o site, escolher um produto, ir ao checkout, criar pedido (create-order) e preferência ou pagamento MP, completar no ambiente de teste do MP e ser redirecionado para /checkout/success ou /checkout/pending. (2) Verificar no backend (logs ou DB) que o webhook do MP foi recebido e que o pedido foi atualizado (ex.: status PAID ou pendente conforme o caso). (3) Se houver painel admin, testar login com ADMIN_TOKEN e um upload em /api/admin/storage/upload e confirmar que a imagem aparece em publicUrl (Supabase Storage bucket products). Documentar qualquer falha ou ajuste necessário (CORS, URLs, env).

---

## 5) Lacunas e perguntas objetivas

- **Projeto Supabase:** Na documentação aparece o ID `joagnmqivhyxbkhskkjp` (SUPABASE_SETUP.md); no MCP o projeto ativo listado é BravosBrasilEcommerce com ID `thntrxrqxupaajovnepy`. Qual projeto Supabase é o de produção (DATABASE_URL e Storage)?
- **JWT_SECRET:** Obrigatório em produção (env.ts) mas não está em `server/.env.example`. Fica documentado na Etapa 0 adicionar ao .env.example.
- **Supabase no frontend:** `lib/supabase.ts` existe e usa VITE_SUPABASE_*; nenhum componente importa. Manter como opcional até haver feature que use (ex.: auth ou storage no client)?
- **Fly app name:** fly.toml na raiz do app usa `app = 'bravos'`; em app/server/fly.toml usa `app = "bravosbackend"`. O deploy real é feito a partir de qual pasta e qual fly.toml (raiz vs server)?
- **Mercado Pago:** Confirmar no painel MP se a aplicação em produção usa as mesmas credenciais (produção vs teste) e se a URL de webhook cadastrada é exatamente BACKEND_URL + `/api/mp/webhooks`.

---

*Fim do documento. Nenhum arquivo do projeto foi alterado na fase de descoberta; apenas leitura e geração deste mapa e plano.*
