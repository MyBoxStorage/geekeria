# BRAVOS BRASIL - E-commerce

E-commerce de roupas patrióticas brasileiras desenvolvido com React + TypeScript + Vite.

## 🚀 Funcionalidades

- ✅ Interface moderna e responsiva
- ✅ Catálogo de produtos com filtros
- ✅ Carrinho de compras funcional
- ✅ Integração com Mercado Pago API
- ✅ Sistema de descontos por quantidade
- ✅ Cálculo de frete

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

### Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:
```bash
cp env.example .env
```

2. Configure o Access Token do Mercado Pago no arquivo `.env`:
```env
VITE_MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
```

Para obter o Access Token:
- Acesse: https://www.mercadopago.com.br/developers/panel/credentials
- Faça login e copie o Access Token da sua aplicação

📖 Veja mais detalhes em [ENV_SETUP.md](./ENV_SETUP.md)

## 🛠️ Desenvolvimento

```bash
npm run dev
```

## Deployment structure

- **Frontend** → Vercel
- **Backend** → Fly (`server/fly.toml`)
- Root `fly.toml` is **NOT** backend

## Go-live check

Quick validation of API health, admin auth, and payment endpoint (optional: frontend). Node 18+.

```bash
node scripts/go-live-check.js https://api.example.com https://example.com
```

Omit the second URL to run only API checks. Exits 0 on pass, 1 on failure.

## Production validation

- **Quick smoke:** use the [Go-live check](#go-live-check) script with your production API and frontend URLs.
- **Full runbook (real PIX + webhook + DB):** [docs/PRODUCTION_PAYMENT_VALIDATION.md](docs/PRODUCTION_PAYMENT_VALIDATION.md) — when to run, pre-checks, real PIX steps, and failure triage.

## Monitoring alerts

This repo runs a scheduled GitHub Action (`.github/workflows/monitor-production.yml`) that calls the internal monitor endpoint every 5 minutes. **Required repository secrets:** `MONITOR_API_URL` (e.g. `https://bravos-backend.fly.dev`) and `ADMIN_TOKEN` (same value as the backend env var). When the monitor returns `ok=false`, the job fails and you get GitHub notifications. To run manually: **Actions** → **Monitor Production** → **Run workflow**.

A separate workflow (`.github/workflows/reconcile-pending-production.yml`) runs every 15 minutes to **reconcile stale PENDING orders** against Mercado Pago: it fetches payment status server-side and updates the DB when it differs (no new env vars; uses the same secrets). Run manually: **Actions** → **Reconcile Pending (Production)** → **Run workflow**, or locally: `node scripts/reconcile-pending.js <API_URL> <ADMIN_TOKEN>`.

For **troubleshooting a single order**, use the audit endpoint (requires `x-admin-token`): `GET /api/admin/orders/:externalReference/audit` — returns order snapshot, last 50 admin events, and last 50 related webhook events (no PII).

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🔧 Integração Mercado Pago

Este projeto usa **APENAS** o Mercado Pago React SDK oficial como biblioteca de pagamento frontend.

### Aplicação Configurada
- **App ID**: 8109795162351103
- **App Name**: Bravos Brasil Real
- **Status**: ✅ Configurada e pronta para integração

### SDK React Oficial

- **Biblioteca**: `@mercadopago/sdk-react`
- **Versão**: 1.0.7
- **Repositório**: https://github.com/mercadopago/sdk-react
- **Componentes Usados**: Payment Brick (oficial)

### Configuração

**Frontend (SDK React)**:
- Usa **Public Key** para inicializar o SDK
- Payment Brick processa pagamentos automaticamente
- Não faz chamadas diretas à API no frontend

**Backend (API)**:
- Usa **Access Token** no header de autorização
- Processa notificações via webhook
- Valida e confirma pagamentos

### Componentes Implementados

- `MercadoPagoProvider` - Inicializa o SDK
- `PaymentBrick` - Componente de pagamento oficial
- `CheckoutWithBrick` - Checkout completo usando Brick

### Variáveis de Ambiente

```env
# Frontend - SDK React
VITE_MERCADOPAGO_PUBLIC_KEY=your_public_key_here

# Backend - API (não usar no frontend)
# VITE_MERCADOPAGO_ACCESS_TOKEN=your_access_token_here

# Webhook (opcional)
VITE_MERCADOPAGO_WEBHOOK_URL=https://api.bravosbrasil.com.br/webhooks/mercadopago
```

### Regras de Implementação

✅ **O que FAZER**:
- Usar apenas componentes oficiais do SDK React
- Seguir documentação oficial do repositório
- Usar Wallet e Bricks conforme documentação

❌ **O que NÃO FAZER**:
- Não fazer chamadas diretas à API no frontend
- Não usar props não documentados
- Não misturar com Checkout Pro iframe
- Não usar Access Token no frontend

### Documentação Adicional

- 📖 [Integração SDK React](./SDK_REACT_INTEGRATION.md)
- 📖 [Configuração de Webhooks](./WEBHOOK_SETUP.md)
- 📖 [Guia de Integração Completo](./src/services/mercadopago-integration-guide.md)

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
