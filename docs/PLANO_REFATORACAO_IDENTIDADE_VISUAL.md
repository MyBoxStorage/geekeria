# Plano Cirúrgico — Refatoração Identidade Visual Geekstore (GEEKERIA)

**Objetivo:** Aplicar a nova identidade "Geek Pop Contemporâneo" sem alterar estrutura ou funcionamento.  
**Status:** SOMENTE PROPOSTA — Nenhuma alteração será aplicada antes de confirmação explícita.

---

## Nova Identidade (Contexto)

| Elemento | Especificação |
|----------|---------------|
| Base | Clara (clear) |
| Paleta | Azul elétrico + Laranja vibrante |
| Gradiente | Azul → Roxo leve (uso controlado) |
| Fundo global | Espacial com pontos tipo estrelas (fixo, site inteiro) |
| Header | Translúcido com blur (glassmorphism) |
| Marca | Divertida, moderna, tecnológica |

---

## A) ARQUIVOS QUE SERÃO ALTERADOS

| Arquivo | Motivo |
|---------|--------|
| `app/src/index.css` | Adicionar fundo espacial (estrelas), atualizar vars `--geekeria-*`, novo gradiente azul→roxo, utilitários |
| `app/src/App.css` | Substituir cores hardcoded (scrollbar, selection, focus) por vars ou nova paleta |
| `app/tailwind.config.js` | Estender cores com novos tokens (opcional, se houver novas vars) |
| `app/src/sections/Header.tsx` | Ajustar header para glassmorphism consistente (translúcido + blur) e novas cores |
| `app/src/pages/HomePage.tsx` | Trocar `bg-white` por fundo que integre espacial (ou remover se body tiver o fundo) |
| `app/src/pages/CatalogPage.tsx` | Substituir `#7C3AED`, `#F59E0B`, `#2563EB` por vars; ajustar backgrounds |
| `app/src/pages/ProductPage.tsx` | Idem — cores hardcoded → vars |
| `app/src/pages/OrderTracking.tsx` | Atualizar gradientes e cores hardcoded |
| `app/src/pages/CheckoutSuccess.tsx` | Atualizar cores hardcoded |
| `app/src/pages/CheckoutFailure.tsx` | Atualizar cores hardcoded |
| `app/src/pages/CheckoutPending.tsx` | Atualizar cores hardcoded |
| `app/src/sections/Footer.tsx` | Ajustar cores para nova paleta (azul/laranja) |
| `app/src/sections/Hero.tsx` | Manter estrutura; ajustar overlays/cores se necessário |
| `app/src/sections/FeaturedProducts.tsx` | Substituir cores hardcoded |
| `app/src/sections/Newsletter.tsx` | Substituir cores hardcoded |
| `app/src/sections/VideoShowcase.tsx` | Ajustar gradiente para azul→roxo |
| `app/src/sections/Values.tsx` | Ajustar cores e gradientes |
| `app/src/sections/Testimonials.tsx` | Ajustar gradientes e cores |
| `app/src/sections/SocialProof.tsx` | Ajustar gradiente para azul→roxo |
| `app/src/sections/FAQ.tsx` | Substituir cores hardcoded |
| `app/src/sections/Catalog.tsx` | Substituir cores hardcoded |
| `app/src/sections/CatalogHero.tsx` | Se existir — ajustar cores |
| `app/src/sections/Customization.tsx` | Substituir cores hardcoded |
| `app/src/components/CheckoutWithBrick.tsx` | Atualizar cores |
| `app/src/components/AuthModal.tsx` | Atualizar cores |
| `app/src/components/TrustBadges.tsx` | Atualizar cores |
| `app/src/components/GeradorEstampas.tsx` | Atualizar cores |
| `app/src/components/ProductSelector.tsx` | Atualizar cores |
| `app/src/components/FloatingWhatsApp.tsx` | Se tiver cores de marca — ajustar |
| `app/src/pages/UserDashboard.tsx` | Atualizar cores |
| `app/src/pages/Sobre.tsx` | Atualizar cores |
| `app/src/pages/Contato.tsx` | Atualizar cores |
| `app/src/pages/PoliticaTrocas.tsx` | Atualizar cores |
| `app/src/pages/PoliticaPrivacidade.tsx` | Atualizar cores |
| `app/src/pages/TermosDeUso.tsx` | Atualizar cores |
| `app/src/components/ui/select.tsx` | Se houver accent hardcoded — ajustar |
| `app/src/utils/productStock.tsx` | Se houver hex de cor — manter ou migrar para vars |
| `app/IDENTIDADE_VISUAL.md` | Documentar nova paleta e tokens |
| `app/App.tsx` | Se optar por layout wrapper para fundo espacial (excluir Admin) — adicionar wrapper |

**Admin (decisão do usuário):**
- `app/src/pages/AdminUnifiedPage.tsx` — fallback Suspense: manter `#0a0a0a` ou aplicar nova identidade?
- `app/src/pages/AdminLogin.tsx` — manter tema escuro ou aplicar nova identidade?
- `app/src/components/admin/ProductAdmin.tsx` — muitas cores hardcoded; manter escuro ou alinhar?

---

## B) O QUE VAI MUDAR EM CADA ARQUIVO

### `app/src/index.css`
- Adicionar vars: `--geekeria-primary` (azul elétrico), `--geekeria-accent` (laranja vibrante), `--geekeria-gradient-start`, `--geekeria-gradient-end` (azul→roxo leve)
- Adicionar `.bg-spatial` ou similar: fundo fixo com pseudo-elemento/pattern de estrelas (CSS ou SVG)
- Atualizar `.text-gradient-geekeria`, `.bg-gradient-geekeria` para usar novo gradiente azul→roxo
- Opcional: adicionar `--geekeria-background-spatial` para controle
- Manter vars existentes; renomear/mapear conforme nova paleta

### `app/src/App.css`
- Scrollbar thumb: `#7C3AED` → `var(--geekeria-primary)` ou novo azul
- Scrollbar thumb hover: `#5B21B6` → `var(--geekeria-primary-dark)` ou equivalente
- Selection: `#F59E0B` / `#2563EB` → vars nova paleta
- Focus outline: `#7C3AED` → `var(--geekeria-primary)`

### `app/tailwind.config.js`
- Se novas vars forem criadas em index.css, estender `theme.extend.colors` para expor (opcional)

### `app/src/sections/Header.tsx`
- Trocar `bg-white/90 backdrop-blur-md` por `bg-white/70 backdrop-blur-xl` ou similar (mais “glass”)
- Cores: `text-[#7C3AED]` → `text-[var(--geekeria-primary)]` ou Tailwind token
- Hover: `hover:text-[#7C3AED]`, `hover:text-[#F59E0B]` → vars nova paleta
- Badge carrinho: `bg-[#F59E0B] text-[#2563EB]` → vars

### `app/src/pages/HomePage.tsx`
- Wrapper: `min-h-screen bg-white` — remover ou trocar por classe que integre fundo espacial (ex.: `bg-spatial` ou `bg-background` com body já com fundo)
- Se fundo espacial for em body: remover bg duplicado ou usar overlay semitransparente

### `app/src/pages/CatalogPage.tsx`
- Substituir todas as ocorrências de `#7C3AED`, `#5B21B6`, `#F59E0B`, `#2563EB` por classes Tailwind ou vars
- Background: `bg-gray-50` → manter ou ajustar para combinar com fundo espacial
- Borders/accents: `data-[state=checked]:bg-[#7C3AED]` → token

### `app/src/pages/ProductPage.tsx`
- Idem: hex → vars / classes

### `app/src/pages/OrderTracking.tsx`
- Gradiente: `from-[#2563EB]/5 via-[#2563EB]/3 to-[#7C3AED]/5` → novo gradiente azul→roxo (opacidades)
- Bordes, textos, botões: hex → vars

### `app/src/pages/CheckoutSuccess.tsx`, `CheckoutFailure.tsx`, `CheckoutPending.tsx`
- Cores de destaque, bordes, botões: hex → vars

### `app/src/sections/Footer.tsx`
- `bg-gray-900` → manter escuro ou trocar por azul escuro da paleta
- Links, ícones: cores de marca → vars

### Demais seções e componentes
- Padrão: `#7C3AED` → primary, `#F59E0B` → accent, `#2563EB` → secondary
- Gradientes: `from-[#7C3AED] via-[#5B21B6] to-[#2563EB]` → `from-[azul] to-[roxo-leve]`

---

## C) O QUE NÃO SERÁ TOCADO

- Rotas (App.tsx Routes)
- Lógica de checkout (CheckoutWithBrick, Mercado Pago)
- Backend (server/)
- Prisma, Mercado Pago, Supabase
- Hooks (useCart, useAuth, useCatalogProducts, etc.)
- Estrutura de componentes (JSX, props, estados)
- Animações GSAP (apenas cores dentro delas, se houver)
- `index.html` (exceto se fundo espacial exigir classe no body)
- Scripts de build, Vite, Tailwind (exceto tailwind.config.js para novas cores)

---

## D) CHECKLIST DE TESTE

Após aplicar as alterações:

| Página | O que verificar |
|--------|------------------|
| **Home** (`/`) | Fundo espacial visível; Header com glass; Hero legível; CTA com nova paleta |
| **Catálogo** (`/catalogo`) | Filtros, cards, badges; cores consistentes; botões com nova paleta |
| **PDP** (`/produto/:slug`) | Hero do produto; seletor de cor/tamanho; botão comprar; cores corretas |
| **Checkout** (CheckoutWithBrick) | Modal/página; botões e bordas; sem quebra de layout |
| **Checkout Success** (`/checkout/success`) | Mensagem de sucesso; botões e links; legibilidade |
| **Checkout Failure** (`/checkout/failure`) | Mensagem de erro; botões; legibilidade |
| **Checkout Pending** (`/checkout/pending`) | Status pendente; botões; legibilidade |
| **Order Tracking** (`/order`) | Formulário; card de resultado; gradientes e cores |
| **Admin** (`/admin`) | Login; painel; se mantiver tema escuro, confirmar que não recebeu fundo espacial |
| **Responsivo** | Mobile e tablet: Header, hero, cards, modais sem quebra |
| **Reduced motion** | `prefers-reduced-motion` em App.css — animações respeitadas |
| **Build** | `npm run build` sem erros |

---

## E) DECISÕES NECESSÁRIAS (antes de implementar)

1. **Fundo espacial (estrelas) — onde aplicar?**
   - **Opção A:** No `body` em `index.css` — afeta todo o site (incluindo Admin)
   - **Opção B:** Em um layout wrapper em `App.tsx` envolvendo apenas rotas públicas (excluir `/admin/*`) — Admin mantém fundo escuro
   - **Escolha:** _________

2. **Admin (painel e login):**
   - **Opção A:** Manter tema escuro (#0a0a0a, #161616) — contraste com loja
   - **Opção B:** Aplicar nova identidade (base clara + azul/laranja) em Admin também
   - **Escolha:** _________

3. **Paleta exata — hex sugeridos (confirmar):**
   - Azul elétrico (primary): `#2563EB` (atual secondary) ou outro? Ex.: `#0EA5E9`, `#3B82F6`
   - Laranja vibrante (accent): `#F59E0B` (manter) ou `#FB923C`, `#F97316`?
   - Roxo leve (gradiente): `#8B5CF6` (atual primary-light) ou `#A78BFA`?
   - **Escolha:** _________

4. **Header glassmorphism:**
   - Manter `bg-white/90 backdrop-blur-md` e só trocar cores, ou
   - Usar `bg-white/60 backdrop-blur-xl` (mais translúcido)?
   - **Escolha:** _________

---

## RISCOS E ROLLBACK

| Risco | Mitigação |
|-------|-----------|
| Fundo espacial prejudicar legibilidade | Usar opacidade baixa nas estrelas; garantir contraste de texto |
| Header muito translúcido em fundos claros | Testar em Home (hero escuro) e Catálogo (fundo claro); ajustar opacidade |
| Cores hardcoded esquecidas | Busca por `#7C3AED`, `#F59E0B`, `#2563EB`, `#5B21B6` antes e depois |
| Tailwind purge removendo classes dinâmicas | Usar apenas classes completas (evitar concatenação) |
| Admin quebrado se fundo espacial for em body | Preferir Opção B (wrapper) para fundo espacial |

**Rollback:**
- Todas as alterações são em CSS e classes Tailwind — reversíveis por git
- Sugestão: criar branch `feat/identidade-geek-pop` antes de aplicar
- Verificação rápida: `npm run build` + smoke test nas páginas do checklist

---

## CONFIRMAÇÃO OBRIGATÓRIA

**Você aprova aplicar essas alterações exatamente como descritas?**  
Responda **SIM** ou **NÃO**.

Se **SIM**, confirme também:
1. Opção de fundo espacial (A ou B)
2. Opção para Admin (A ou B)
3. Hex da paleta (ou “usar sugeridos”)
4. Opção de header (manter atual ou mais translúcido)

Se **NÃO**, indique o que deseja alterar no plano antes de prosseguir.
