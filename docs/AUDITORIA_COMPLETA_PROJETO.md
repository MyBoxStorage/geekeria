# Auditoria Completa — Projeto GeekStore (GEEKERIA)

**Data:** 2025-02-20  
**Escopo:** Frontend em `app/` (monorepo com backend em `app/server/`). Excluídos: `node_modules`, `.git`.

---

## 1. ESTRUTURA DE PASTAS

```
app/
├── .cursor/
├── .github/workflows/
├── .vercel/
├── backups/
├── dist/                    # Build de produção (gerado)
├── docs/
├── prisma/                  # Schema e migrations (compartilhado com server)
├── public/                  # Assets estáticos
├── scripts/                 # Scripts npm (sitemap, check secrets, e2e, etc.)
├── server/                  # Backend Express (ver seção 9)
├── src/
│   ├── components/          # UI reutilizáveis + seções (AuthModal, CheckoutWithBrick, etc.)
│   │   ├── admin/           # ProductAdmin, AdminNav, etc.
│   │   └── ui/              # Radix/shadcn: button, card, sheet, dialog, etc.
│   ├── config/              # api.ts (API_URL)
│   ├── contexts/            # AuthContext
│   ├── data/                # Dados estáticos (ex.: products)
│   ├── hooks/               # useCart, useSEO, useCatalogProducts, useOrderEvents, etc.
│   ├── lib/                 # utils (cn), supabase client
│   ├── pages/               # Uma por rota (HomePage, CatalogPage, Admin*, etc.)
│   ├── sections/            # Header, Footer, Hero, FeaturedProducts, Newsletter, etc.
│   ├── services/            # api.ts, auth.ts, catalog.ts, checkout.ts, orders.ts, admin*, etc.
│   ├── types/               # Tipos TypeScript
│   ├── utils/               # Helpers (productImages, whatsapp, pendingCheckout)
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── .dockerignore, .env, .env.example, .env.local, .env.sitemap, .gitignore
├── components.json          # shadcn
├── index.html
├── package.json, package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── vercel.json
├── vite.config.ts
└── (vários .md de documentação)
```

**public/**
```
public/
├── assets/
│   ├── exemplo-estampa.jpg
│   ├── exemplo-prompt.jpg
│   └── exemplo-upload.jpg
├── products/
│   ├── baby-long.jpg, bone-americano.jpg, moletom-canguru.jpg, moletom-ziper.jpg
│   ├── polo-prime.jpg, regata-sport.jpg
│   ├── tshirt-classic.jpg, tshirt-prime.jpg, tshirt-quality.jpg, tshirt-tech.jpg
├── customization-illustration.png
├── exemplo-estampa.jpg, exemplo-prompt.jpg, exemplo-upload.jpg
├── hero-bg.jpg
├── hero-catalogo-new.webp, hero-catalogo.webp
├── robots.txt
└── sitemap.xml
```

---

## 2. STACK E DEPENDÊNCIAS

### package.json (raiz app/)

```json
{
  "name": "my-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "prebuild": "node scripts/check-no-vite-secrets.js && tsx scripts/generate-sitemap.ts",
    "generate-sitemap": "tsx scripts/generate-sitemap.ts",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "prisma:generate": "npx prisma@5.22.0 generate --schema=./prisma/schema.prisma",
    "prisma:status": "npx prisma@5.22.0 migrate status --schema=./prisma/schema.prisma"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@mercadopago/sdk-react": "^1.0.7",
    "@prisma/client": "^5.22.0",
    "@radix-ui/*": "(accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toggle, toggle-group, tooltip)",
    "@supabase/supabase-js": "^2.95.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "gsap": "^3.14.2",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.562.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.0",
    "react-day-picker": "^9.13.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.70.0",
    "react-resizable-panels": "^4.2.2",
    "react-router-dom": "^7.13.0",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "vaul": "^1.1.2",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^24.10.11",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "kimi-plugin-inspect-react": "^1.0.3",
    "postcss": "^8.5.6",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.19",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.21.0",
    "tw-animate-css": "^1.4.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.4"
  }
}
```

### vite.config.ts

- Plugins: `inspectAttr()`, `react()`
- Alias: `@` → `./src`
- Build: `outDir: 'dist'`, `assetsDir: 'assets'`
- manualChunks: vendor-react, vendor-router, vendor-radix, vendor-gsap, vendor-mercadopago

### tailwind.config.js

- `darkMode: ["class"]`
- `content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']`
- `theme.extend`: colors (border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card, sidebar) — todos referenciando `hsl(var(--*))`; borderRadius (xl, lg, md, sm, xs); boxShadow.xs; keyframes accordion-down/up, caret-blink; animation; plugins: tailwindcss-animate

### tsconfig.json

- References: `tsconfig.app.json`, `tsconfig.node.json`
- `paths`: `@/*` → `./src/*`

### tsconfig.app.json

- target ES2022, lib DOM, module ESNext, jsx react-jsx
- baseUrl ".", paths `@/*` → `./src/*`
- strict, noEmit, include "src"

### tsconfig.node.json

- Inclui `vite.config.ts`

---

## 3. ROTAS EXISTENTES

**Arquivo de rotas:** `src/App.tsx` (React Router: BrowserRouter, Routes, Route).

| path | element |
|------|---------|
| `/` | HomePage |
| `/catalogo` | CatalogPage |
| `/produto/:slug` | ProductPage |
| `/checkout/success` | CheckoutSuccess |
| `/checkout/failure` | CheckoutFailure |
| `/checkout/pending` | CheckoutPending |
| `/minha-conta` | UserDashboard |
| `/order` | OrderTracking |
| `/admin/*` | AdminUnifiedPage (lazy) |
| `/trocas-e-devolucoes` | PoliticaTrocas |
| `/politica-de-privacidade` | PoliticaPrivacidade |
| `/termos-de-uso` | TermosDeUso |
| `/sobre` | Sobre |
| `/contato` | Contato |
| `/minhas-estampas` | MinhasEstampasPage |

Não há Next.js; é SPA com React Router.

---

## 4. SISTEMA DE TEMA / DESIGN TOKENS ATUAL

### 4.1 index.css

- **:root** — Variáveis HSL para Tailwind:
  - `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`
  - Valores atuais: background 0 0% 100%, primary 149 100% 26%, secondary 45 100% 58%, accent 220 100% 23%, etc.
- **Brand (hex):**
  - `--geekeria-primary: #7C3AED`
  - `--geekeria-accent: #F59E0B`
  - `--geekeria-secondary: #2563EB`
  - `--geekeria-primary-dark: #5B21B6`
  - `--geekeria-primary-light: #8B5CF6`
  - `--geekeria-accent-dark: #D97706`
  - `--geekeria-secondary-dark: #1E40AF`
  - `--whatsapp-green: #25D366`
- **body:** `@apply bg-background text-foreground antialiased`; `font-family: 'Inter', sans-serif`
- **h1–h6:** `font-family: 'Bebas Neue', sans-serif`; `letter-spacing: 0.02em`
- **Utilitários:** `.font-display`, `.font-body`, `.text-gradient-geekeria`, `.bg-gradient-geekeria`, `.bg-gradient-green-yellow`, `.bg-gradient-dark`, `.glass-effect`, `.hover-lift`, `.animate-float`, `.animate-pulse-slow`, `.animate-marquee`, `.animate-bounce-slow`, `.line-clamp-2`
- **Scrollbar:** track #f1f1f1; thumb `var(--geekeria-primary)`; hover `var(--geekeria-primary-dark)`
- **::selection:** `var(--geekeria-accent)` / `var(--geekeria-secondary)`

### 4.2 App.css

- Scrollbar (sobrescreve): width 10px; track #f1f1f1; thumb #7C3AED; hover #5B21B6
- ::selection: #F59E0B / #2563EB
- *:focus-visible: outline 2px solid #7C3AED
- img: gradient placeholder #f0f0f0 / #e0e0e0
- button, a: user-select none
- @media (max-width: 640px): html font-size 14px
- prefers-reduced-motion: animações/transições 0.01ms
- @media print: .no-print display none

### 4.3 tailwind.config.js (cores)

- Cores mapeiam para `hsl(var(--border))`, `hsl(var(--background))`, etc. Não define hex de marca; a marca está em index.css como `--geekeria-*`.

### 4.4 Fontes

- Carregadas em `index.html`: Google Fonts — Bebas Neue, Inter (400,500,600,700).

**Resumo tokens:**  
Primário de marca = roxo (#7C3AED), accent = âmbar (#F59E0B), secondary = azul (#2563EB). Fundo/claro vindo de `--background` (branco). Não existe `theme.js`/`theme.ts`; tema é CSS vars + Tailwind.

---

## 5. COMPONENTES PRINCIPAIS

### Header (`src/sections/Header.tsx`)

- Fixo top-0, z-50; transição por scroll: `isScrolled` → `bg-white/90 backdrop-blur-md shadow-lg py-3`, senão `bg-transparent py-5`
- Logo: "GEEKERIA" — scrolled: `text-[#7C3AED]`, não scrolled: `text-white`
- Nav: INÍCIO, COLEÇÃO, CATÁLOGO, SOBRE, CONTATO — scrolled: gray-800 hover #7C3AED; não scrolled: white hover #F59E0B; underline `bg-[#F59E0B]`
- Auth (User/Logout), Search, Cart (Sheet), mobile menu
- Cart = Sheet (Radix); título "SEU CARRINHO" `text-[#7C3AED]`; itens, resumo, botão "FINALIZAR COMPRA" `bg-[#7C3AED] hover:bg-[#5B21B6]`
- Badge carrinho: `bg-[#F59E0B] text-[#2563EB]`
- Integra AuthModal e CheckoutWithBrick (modal checkout)

### Footer (`src/sections/Footer.tsx`)

- `bg-gray-900 text-white`
- Logo "GEEKERIA" `text-[#7C3AED]`
- Colunas: logo/social, links rápidos, atendimento, formas de pagamento
- Links hover `text-[#F59E0B]`; ícones sociais hover `bg-[#7C3AED]`
- GSAP ScrollTrigger para animar colunas

### Hero (`src/sections/Hero.tsx`)

- Section full viewport; background `/hero-bg.jpg` com parallax (GSAP)
- Overlays: `from-black/50 via-black/30 to-black/70`, `from-black/60`
- Badge: `bg-[#F59E0B] text-[#2563EB]` — "ESTAMPAS NOVAS TODA SEMANA"
- Título: "VISTA O QUE" + "VOCÊ AMA" (text-gradient-geekeria)
- Subtitle + 2 CTAs: gradiente (bg-gradient-geekeria) e outline branco hover `hover:text-[#7C3AED]`
- Scroll indicator no rodapé

### ProductCard

- Não existe componente nomeado "ProductCard". O catálogo usa card inline em `CatalogPage.tsx`: card com imagem, nome, preço, badges (roxo/âmbar), botão "Comprar" `bg-[#7C3AED] hover:bg-[#5B21B6]`, classes como `bg-white rounded-xl border border-gray-100 hover-lift`.

### CategoryCard

- Não existe componente "CategoryCard" separado. Filtros de categoria na própria CatalogPage (tabs/botões).

### CartSidebar / CartDrawer

- Carrinho = **Sheet** (Radix) no Header; trigger = ícone ShoppingCart; conteúdo: lista de itens, resumo, "FINALIZAR COMPRA". Não há componente com nome "CartSidebar"; é `Sheet` + `SheetContent` em `Header.tsx`.

### HomePage (`src/pages/HomePage.tsx`)

- Wrapper: `min-h-screen bg-white`
- Providers: MercadoPagoProvider, CartProvider
- Conteúdo: Header, Hero, SocialProof, FeaturedProducts, VideoShowcase, GeradorEstampas, Values, Testimonials, FAQ, Newsletter, Footer, FloatingWhatsApp
- JsonLd (Organization, WebSite, FAQPage)
- useSEO para title/description/canonical

---

## 6. PÁGINAS EXISTENTES

| Página | Arquivo | Conteúdo resumido |
|--------|---------|-------------------|
| Home | HomePage.tsx | Layout acima; seções hero, featured, video, gerador, values, testimonials, FAQ, newsletter |
| Catálogo | CatalogPage.tsx | Filtros (categoria, gênero, ordem), grid de produtos (card inline), paginação |
| Produto (PDP) | ProductPage.tsx | ProductHero, seletor cor/tamanho, preço, botão comprar, TrustBadges, JsonLd |
| Checkout Success | CheckoutSuccess.tsx | Mensagem sucesso, resumo pedido, link rastreamento, WhatsApp |
| Checkout Failure | CheckoutFailure.tsx | Mensagem falha, botão voltar |
| Checkout Pending | CheckoutPending.tsx | Status pendente, polling do pedido, SSE opcional |
| Minha Conta | UserDashboard.tsx | Área logada: créditos, pedidos, gerações (chamadas à API com token) |
| Rastreamento | OrderTracking.tsx | Form email + externalReference; exibe status e resumo do pedido |
| Admin | AdminUnifiedPage.tsx | Lazy; abas: Pedidos, Dashboard, Estampas, Prompts, Cupons, Produtos; login por token (AdminLogin) |
| Admin (sub) | AdminDashboard, AdminDashboardPage, AdminGenerationsPage, AdminPromptsPage, AdminCouponsPage, ProductAdmin (produtos) | CRUD e listagens conforme aba |
| Trocas e devoluções | PoliticaTrocas.tsx | Página estática |
| Política de privacidade | PoliticaPrivacidade.tsx | Página estática |
| Termos de uso | TermosDeUso.tsx | Página estática |
| Sobre | Sobre.tsx | Página estática |
| Contato | Contato.tsx | Página estática |
| Minhas Estampas | MinhasEstampasPage.tsx | Lista de gerações do usuário (API /api/user/my-generations) |

---

## 7. ASSETS E IMAGENS

### public/ (raiz)

- **Imagens de fundo/hero:** hero-bg.jpg, hero-catalogo.webp, hero-catalogo-new.webp
- **Ilustração:** customization-illustration.png
- **Exemplos gerador:** exemplo-estampa.jpg, exemplo-prompt.jpg, exemplo-upload.jpg
- **SEO:** robots.txt, sitemap.xml

### public/assets/

- exemplo-estampa.jpg, exemplo-prompt.jpg, exemplo-upload.jpg

### public/products/

- baby-long.jpg, bone-americano.jpg, moletom-canguru.jpg, moletom-ziper.jpg, polo-prime.jpg, regata-sport.jpg, tshirt-classic.jpg, tshirt-prime.jpg, tshirt-quality.jpg, tshirt-tech.jpg

### Favicons (referenciados em index.html)

- /favicon.ico, /favicon-32x32.png, /apple-touch-icon.png (existência não verificada na lista)

### Fontes

- Apenas Google Fonts (Bebas Neue, Inter); sem fontes locais em /public ou /assets.

### Logos

- Nenhum arquivo de logo em public; marca é texto "GEEKERIA" no Header e Footer.

---

## 8. CONTEXTOS E ESTADO GLOBAL

### AuthContext (`src/contexts/AuthContext.tsx`)

- createContext: user, token, isLoading, login, signup, verifyEmail, logout, refreshUser
- AuthProvider: chama authService (login, signup, getMe, getToken, saveToken, removeToken)
- Estado: useState(user, token, isLoading); persistência do token (localStorage via authService)

### Cart (useCart / CartProvider)

- **Arquivo:** `src/hooks/useCart.tsx`
- createContext: cart, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, totalItems
- Persistência: localStorage key `bb_cart_v1` (version + items + updatedAt)
- Desconto por quantidade: 3 itens 5%, 4 itens 10%, 5+ 15%
- CartProvider usado na HomePage (e onde mais o carrinho for necessário)

Não há Redux nem Zustand; apenas Context API (Auth + Cart).

---

## 9. BACKEND / API

### Configuração de API

- **Arquivo:** `src/config/api.ts`
- `API_URL`: `VITE_API_URL` se definida; senão dev → `http://localhost:3001`, prod → `https://bravosbackend.fly.dev`
- `apiConfig = { baseURL: API_URL }`

### Cliente HTTP

- **Arquivo:** `src/services/api.ts`
- `getJSON<T>(path, options?)`, `postJSON<T>(path, body, options?)`, `putJSON`, etc.; base `API_URL` + path
- Headers: Content-Type application/json; opcional Authorization / x-admin-token via options.headers

### Endpoints consumidos pelo frontend

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | /api/catalog/products | Listagem catálogo (catalog.ts) |
| GET | /api/catalog/products/:slug | Detalhe produto (catalog.ts) |
| POST | /api/checkout/create-order | Criar pedido (checkout.ts) |
| GET | /api/orders/:externalReference | Detalhe pedido (orders.ts) |
| GET | /api/orders/:externalReference/events | SSE status pedido (useOrderEvents) |
| POST | /api/mp/create-preference | Preferência MP (mercadopago-preference.ts) |
| POST | /api/mp/create-payment | Pagamento PIX/Boleto (CheckoutWithBrick) |
| POST | /api/mp/process-card-payment | Pagamento cartão (CheckoutWithBrick) |
| GET | /api/mp/payment/:id | Status pagamento (mp-payment.ts) |
| POST | /api/auth/signup, login, verify-email, resend-verification | Auth (auth.ts) |
| GET | /api/auth/me | Usuário logado (auth.ts) |
| POST | /api/newsletter/subscribe | Newsletter (Newsletter.tsx) |
| POST | /api/coupons/validate | Validar cupom (ProductSelector, CheckoutWithBrick) |
| POST | /api/generate-stamp | Gerar estampa (GeradorEstampas) |
| GET | /api/user/my-generations | Minhas estampas (MinhasEstampasPage, UserDashboard) |
| GET | /api/user/my-orders | Meus pedidos (UserDashboard) |
| GET/POST/PUT/DELETE | /api/admin/* | Pedidos, produtos, cupons, prompts, analytics, storage upload, catalog-health (adminProducts, admin.ts, páginas admin) |
| POST | /api/orders/:ref/mark-montink | Marcar Montink (admin) |

### Variáveis de ambiente (.env.example — sem valores reais)

- **Frontend (Vite):** VITE_API_URL (opcional), VITE_MERCADOPAGO_PUBLIC_KEY, VITE_MERCADOPAGO_WEBHOOK_URL (opcional), VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- **Backend (server/.env.example):** DATABASE_URL, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, FRONTEND_URL, BACKEND_URL, ADMIN_TOKEN, JWT_SECRET, PORT, NODE_ENV, GMAIL_*, TELEGRAM_*

---

## 10. DESCRIÇÃO VISUAL ATUAL

- **Cores principais:** Roxo #7C3AED (primário, CTAs, links ativos), âmbar #F59E0B (destaque, badge, hover hero), azul #2563EB (secundário, títulos de bloco, carrinho vazio). Fundo geral claro (branco / gray-50 em catálogo).
- **Fontes:** Bebas Neue (títulos, logo, preços, botões de impacto), Inter (corpo, labels, navegação).
- **Hero:** Imagem de fundo full-screen com overlay escuro; título branco + gradiente roxo/âmbar/azul em "VOCÊ AMA"; badge âmbar/azul; botões: um com gradiente marca, outro outline branco.
- **Cards (catálogo/produto):** Fundo branco, borda gray-100, sombra leve, hover com “lift” (translateY -8px); badges roxo ou âmbar; preço em Bebas em roxo; botão "Comprar" roxo sólido.
- **Header:** Transparente no topo; após scroll vira branco semitransparente com blur (glass); logo e links trocam de branco para roxo/cinza; underline dos links em âmbar.
- **Footer:** Fundo gray-900; logo roxo; links e ícones em cinza com hover âmbar/roxo.
- **Botões:** Primário usa bg-primary (Tailwind) ou classes como bg-[#7C3AED]; outline com borda; tamanhos sm/default/lg/icon; focus ring.
- **Admin:** Tema escuro (#0a0a0a, #161616, #222); sidebar com aba ativa em roxo; botões e bordas em roxo/âmbar.

Com essa auditoria você tem o mapeamento completo para refatorar identidade visual sem quebrar rotas ou funcionalidades.
