# 📋 Guia Completo de Variáveis de Ambiente

## 🎯 Visão Geral

Este projeto usa **duas** configurações de `.env`:

1. **`.env`** (raiz do projeto) - Para o **Frontend** (React/Vite)
2. **`server/.env`** - Para o **Backend** (Express/Node.js)

## 📁 Estrutura de Arquivos .env

```
bravos-real/app/
├── .env                    ← Frontend (React/Vite)
└── server/
    └── .env               ← Backend (Express)
```

## 🔑 Variáveis por Ambiente

### 🌐 FRONTEND (`.env` na raiz)

| Variável | Onde é Usada | Obrigatório | Como Obter |
|----------|--------------|-------------|------------|
| `VITE_MERCADOPAGO_PUBLIC_KEY` | `src/components/MercadoPagoProvider.tsx:21` | ✅ Sim | Painel MP → Credentials → Public Key |
| `VITE_MERCADOPAGO_WEBHOOK_URL` | `src/components/PaymentBrick.tsx:66`<br>`src/config/mercadopago.config.ts:26` | ⚠️ Opcional | URL do seu backend: `https://api.bravosbrasil.com.br/api/mp/webhooks` |

### 🖥️ BACKEND (`server/.env`)

| Variável | Onde é Usada | Obrigatório | Como Obter |
|----------|--------------|-------------|------------|
| `DATABASE_URL` | `prisma/schema.prisma:11`<br>`server/routes/mp/create-payment.ts`<br>`server/routes/mp/webhooks.ts` | ✅ Sim | Supabase Dashboard → Settings → Database → Connection string |
| `MP_ACCESS_TOKEN` | `server/routes/mp/create-payment.ts:56`<br>`server/routes/mp/webhooks.ts:49` | ✅ Sim | Painel MP → Credentials → Access Token |
| `MP_WEBHOOK_SECRET` | `server/routes/mp/webhooks.ts` (validação x-signature) | ✅ Sim | Painel MP → Your integrations → Webhooks → Reveal secret |
| `MONTINK_API_TOKEN` | `server/integrations/montink/client.ts:10` | ⚠️ Opcional | Token da API Montink (quando integrar) |
| `MONTINK_BASE_URL` | `server/integrations/montink/client.ts:9` | ⚠️ Opcional | URL base da API Montink (padrão: `https://api.montink.com.br`) |
| `MONTINK_CREATE_ORDER_ENABLED` | `server/services/montinkFulfillment.ts:12` | ⚠️ Opcional | Feature flag para criação automática de pedidos (padrão: `false`) |
| `ADMIN_TOKEN` | `server/index.ts` (validação produção)<br>`server/routes/orders/mark-montink.ts`<br>`server/routes/admin/orders.ts`<br>`/api/internal/monitor` | ✅ **Obrigatório em produção** | Token para rotas administrativas (header `x-admin-token`). Reutilizado pelo workflow de monitoramento (GitHub Actions); use o mesmo valor. Gere um token longo e aleatório (ex: `openssl rand -hex 32`). |
| `FRONTEND_URL` | `server/index.ts:23` (CORS) | ✅ Sim | URL do frontend: `http://localhost:5173` ou `https://bravosbrasil.com.br` |
| `BACKEND_URL` | `server/routes/mp/create-payment.ts:93` (webhook URL) | ✅ Sim | URL do backend: `http://localhost:3001` ou `https://api.bravosbrasil.com.br` |
| `PORT` | `server/index.ts:19` | ⚠️ Opcional | Porta do servidor (padrão: 3001) |
| `NODE_ENV` | `server/index.ts:48` | ⚠️ Opcional | `development` ou `production` |

### 🤖 GitHub Actions (monitoramento)

O workflow **Monitor Production** usa **secrets do repositório** (Settings → Secrets and variables → Actions). **Não** são variáveis de ambiente da aplicação:

| Secret | Uso | Como definir |
|--------|-----|--------------|
| `MONITOR_API_URL` | URL base da API chamada pelo script de monitor | Ex.: `https://bravos-backend.fly.dev` (mesma URL do backend em produção) |
| `ADMIN_TOKEN` | Autenticação do endpoint `/api/internal/monitor` | **Reutilize o mesmo valor** de `ADMIN_TOKEN` do backend |

## 📝 Exemplo Completo de Arquivos .env

### `.env` (Raiz - Frontend)

```env
# Mercado Pago - Public Key (pode ser exposto; use a chave real do painel MP)
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# API do backend (desenvolvimento: http://localhost:3001; produção: sua URL)
VITE_API_URL=http://localhost:3001

# Webhook URL (opcional; produção: https://sua-api.com/api/mp/webhooks)
VITE_MERCADOPAGO_WEBHOOK_URL=https://sua-api.com/api/mp/webhooks
```

### `server/.env` (Backend)

**Nota:** Em produção, `ADMIN_TOKEN` é **obrigatório** (server falha na inicialização se estiver ausente). Use apenas placeholders abaixo; nunca commite credenciais reais.

```env
# Supabase Database (substitua [YOUR-PASSWORD] pela senha real)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.joagnmqivhyxbkhskkjp.supabase.co:5432/postgres?schema=public"

# Mercado Pago - Access Token (NUNCA expor no frontend!)
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Mercado Pago - Webhook Secret (valida assinatura x-signature; obrigatório para receber webhooks)
MP_WEBHOOK_SECRET=your-webhook-secret

# Montink (opcional)
MONTINK_API_TOKEN=your_token_here
MONTINK_BASE_URL=https://api.montink.com.br
MONTINK_CREATE_ORDER_ENABLED=false

# Admin - OBRIGATÓRIO EM PRODUÇÃO. Gere um token longo (ex: openssl rand -hex 32)
ADMIN_TOKEN=change-me-to-a-long-random-token

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Server
PORT=3001
NODE_ENV=development
```

## 🔍 Onde Cada Variável é Usada no Código

### Frontend (React/Vite)

#### `VITE_MERCADOPAGO_PUBLIC_KEY`
```typescript
// src/components/MercadoPagoProvider.tsx:21
const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
initMercadoPago(publicKey, { locale: 'pt-BR' });
```

#### `VITE_MERCADOPAGO_WEBHOOK_URL`
```typescript
// src/components/PaymentBrick.tsx:66
...(import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL && {
  notification_url: import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL,
})

// src/config/mercadopago.config.ts:26
WEBHOOK_URL: import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL || '',
```

### Backend (Express/Node.js)

#### `DATABASE_URL`
```typescript
// prisma/schema.prisma:11
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Usado automaticamente pelo Prisma Client
const prisma = new PrismaClient(); // Lê DATABASE_URL automaticamente
```

#### `MP_ACCESS_TOKEN`
```typescript
// server/routes/mp/create-payment.ts:56
const accessToken = process.env.MP_ACCESS_TOKEN;

// server/routes/mp/webhooks.ts:49
const accessToken = process.env.MP_ACCESS_TOKEN;
```

#### `MP_WEBHOOK_SECRET`
```typescript
// server/routes/mp/webhooks.ts - validação de assinatura do webhook (HMAC SHA256)
// Se não configurado ou assinatura inválida, o webhook retorna 401 e não processa o evento
const webhookSecret = process.env.MP_WEBHOOK_SECRET;
```

#### `FRONTEND_URL`
```typescript
// server/index.ts:23
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

#### `BACKEND_URL`
```typescript
// server/routes/mp/create-payment.ts:93
notification_url: process.env.BACKEND_URL 
  ? `${process.env.BACKEND_URL}/api/mp/webhooks`
  : undefined,
```

#### `ADMIN_TOKEN`
```typescript
// server/index.ts - em produção, a aplicação não inicia se ADMIN_TOKEN estiver ausente
// server/routes/orders/mark-montink.ts - header x-admin-token
// server/routes/admin/orders.ts - header x-admin-token
// server/routes/internal/monitor.ts - GET /api/internal/monitor (header x-admin-token)
```

#### `PORT`
```typescript
// server/index.ts:19
const PORT = process.env.PORT || 3001;
```

#### `NODE_ENV`
```typescript
// server/index.ts:48
message: process.env.NODE_ENV === 'development' ? err.message : undefined,
```

## 🔐 Como Obter Cada Chave

### 1. Mercado Pago - Public Key e Access Token

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Selecione sua aplicação (ou crie uma nova)
3. Copie:
   - **Public Key** → `VITE_MERCADOPAGO_PUBLIC_KEY` (frontend)
   - **Access Token** → `MP_ACCESS_TOKEN` (backend)

4. **Webhook Secret:** Em **Your integrations** → sua aplicação → **Webhooks** → **Configure notifications** → após salvar a URL, clique em **Reveal** ao lado da assinatura secreta → use como `MP_WEBHOOK_SECRET`. Sem ele, o backend rejeita todas as notificações (401).

**⚠️ IMPORTANTE:**
- Public Key pode ser exposta no frontend
- Access Token **NUNCA** deve ser exposto no frontend!

### 2. Supabase - DATABASE_URL

1. Acesse: https://supabase.com/dashboard/project/joagnmqivhyxbkhskkjp/settings/database
2. Role até **Connection string** → **URI**
3. Copie a URL completa
4. Se não souber a senha:
   - Clique em **Reset database password**
   - Copie a nova senha (ela só aparece uma vez!)
   - Substitua `[YOUR-PASSWORD]` na URL

**Formato:**
```
postgresql://postgres:[PASSWORD]@db.joagnmqivhyxbkhskkjp.supabase.co:5432/postgres?schema=public
```

### 3. URLs (FRONTEND_URL e BACKEND_URL)

**Desenvolvimento:**
```env
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

**Produção:**
```env
FRONTEND_URL=https://bravosbrasil.com.br
BACKEND_URL=https://api.bravosbrasil.com.br
```

## ✅ Checklist de Configuração

### Frontend (`.env` na raiz)
- [ ] `VITE_MERCADOPAGO_PUBLIC_KEY` configurado
- [ ] `VITE_MERCADOPAGO_WEBHOOK_URL` configurado (opcional)

### Backend (`server/.env`)
- [ ] `DATABASE_URL` configurado (Supabase)
- [ ] `MP_ACCESS_TOKEN` configurado
- [ ] `MP_WEBHOOK_SECRET` configurado (obrigatório para webhooks)
- [ ] `FRONTEND_URL` configurado
- [ ] `BACKEND_URL` configurado
- [ ] `ADMIN_TOKEN` configurado (**obrigatório em produção**)
- [ ] `PORT` configurado (opcional)
- [ ] `NODE_ENV` configurado (opcional)

## 🚨 Segurança

### ✅ Pode ser exposto no frontend:
- `VITE_MERCADOPAGO_PUBLIC_KEY` (é público por design)

### ❌ NUNCA exponha no frontend:
- `MP_ACCESS_TOKEN` (Access Token)
- `MP_WEBHOOK_SECRET` (secret do webhook)
- `ADMIN_TOKEN` (token administrativo)
- `DATABASE_URL` (senha do banco)
- Qualquer chave secreta do backend

### 🔒 Boas Práticas:
1. ✅ Use `.env.example` como template
2. ✅ Adicione `.env` ao `.gitignore`
3. ✅ NUNCA commite arquivos `.env`
4. ✅ Use diferentes chaves para desenvolvimento e produção
5. ✅ Rotacione chaves regularmente em produção

## 📚 Links Úteis

- **Mercado Pago Credentials:** https://www.mercadopago.com.br/developers/panel/credentials
- **Supabase Database Settings:** https://supabase.com/dashboard/project/joagnmqivhyxbkhskkjp/settings/database
- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html
