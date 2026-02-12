# BRAVOS BRASIL E-commerce – Plano de Testes

Backend: https://bravosbackend.fly.dev  
Frontend: https://www.bravosbrasil.com.br

---

## 1. Scripts de teste

### Backend (Node.js)

```bash
# Na raiz do projeto
node scripts/test-backend.js
# Ou com URL customizada:
node scripts/test-backend.js https://bravosbackend.fly.dev
```

### Backend (curl / Bash)

```bash
chmod +x scripts/test-backend.sh
./scripts/test-backend.sh
# Ou: ./scripts/test-backend.sh https://bravosbackend.fly.dev
```

### Frontend (console do navegador)

1. Abra **www.bravosbrasil.com.br**
2. F12 → aba **Console**
3. Copie e cole o conteúdo de **scripts/test-frontend.js**
4. Pressione Enter (os testes rodam automaticamente)

Ou execute apenas: `runBravosFrontendTests()`

---

## 2. Checklist de verificação manual

Use no navegador em **www.bravosbrasil.com.br**:

### Página e catálogo

- [ ] Página inicial carrega sem erro em branco
- [ ] Produtos aparecem na tela (catálogo/lista)
- [ ] Imagens dos produtos carregam (ou placeholder)
- [ ] Clicar em um produto abre detalhes ou adiciona ao carrinho (conforme o fluxo do site)

### Carrinho e frete

- [ ] Adicionar produto ao carrinho funciona
- [ ] Carrinho mostra itens e totais
- [ ] Calcular frete funciona (campo CEP e botão/opção de frete)
- [ ] Valor do frete ou “frete grátis” aparece corretamente

### Checkout e pagamento

- [ ] Iniciar checkout / “Finalizar compra” abre o fluxo de checkout
- [ ] Preenchimento de dados (nome, e-mail, endereço) é aceito
- [ ] Criar pedido no backend funciona (não dá erro de rede/CORS)
- [ ] Redirecionamento para o Mercado Pago (checkout ou Payment Brick) funciona
- [ ] Retorno do checkout funciona nas três rotas:
  - [ ] `/checkout/success` (pagamento aprovado)
  - [ ] `/checkout/failure` (pagamento recusado/falhou)
  - [ ] `/checkout/pending` (pagamento pendente)

### Rastreamento e admin

- [ ] Rastreamento de pedido funciona (página/rota de pedido com código ou referência)
- [ ] Consulta por código/referência retorna dados do pedido
- [ ] Painel admin acessível em `/admin`
- [ ] Login/admin com ADMIN_TOKEN funciona (lista de pedidos e/ou ações protegidas)

---

## 3. O que procurar no console (F12)

### Erros de CORS

- **Mensagem típica:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
- **O que fazer:** Verificar se no Fly.io o secret `FRONTEND_URL` inclui exatamente a origem do site (ex.: `https://www.bravosbrasil.com.br`).

### Erros 404

- **Mensagem:** `GET/POST ... 404 (Not Found)`
- **O que fazer:** Confirmar URL do backend (ex.: `https://bravosbackend.fly.dev`) e o path (ex.: `/api/orders/...`). Verificar se a rota existe no backend.

### Erros 500

- **Mensagem:** `500 (Internal Server Error)` ou resposta JSON com `error: "Internal server error"`
- **O que fazer:** Ver logs do Fly.io (`fly logs -a bravosbackend`). Geralmente é falha no backend (banco, env, integração MP).

### Erros de autenticação

- **Mensagem:** `401 Unauthorized` ou `403 Forbidden` em rotas admin
- **O que fazer:** Confirmar que o header `x-admin-token` está sendo enviado com o valor correto do `ADMIN_TOKEN` configurado no Fly.io.

### Mixed content (HTTP/HTTPS)

- **Mensagem:** `Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://...'`
- **O que fazer:** Garantir que todas as URLs da API e do MP sejam **HTTPS** (ex.: `VITE_API_URL=https://bravosbackend.fly.dev`).

### Outros

- **Network error / Failed to fetch:** Backend inacessível (URL errada, app Fly parado, rede/firewall).
- **Resposta não é JSON:** Backend retornando HTML de erro ou timeout; checar URL e logs do backend.

---

## 4. Guia de troubleshooting

### Frontend não carrega produtos / lista vazia

| Causa provável | Como diagnosticar | Como corrigir |
|----------------|-------------------|----------------|
| API URL vazia ou errada | No console, verificar chamadas de rede: a URL da requisição deve ser `https://bravosbackend.fly.dev/...` | Na Vercel, definir `VITE_API_URL=https://bravosbackend.fly.dev` e fazer redeploy |
| Backend fora do ar | Abrir `https://bravosbackend.fly.dev/health` no navegador | Ver status no Fly.io e logs; conferir secrets e reiniciar o app |
| Produtos não existem no banco | Rodar no Supabase: `SELECT COUNT(*) FROM products;` | Executar seed: `npx prisma db seed` (com DATABASE_URL de produção) |

### CORS bloqueando requisições

| Causa provável | Como diagnosticar | Como corrigir |
|----------------|-------------------|----------------|
| FRONTEND_URL não inclui a origem do site | Console: mensagem de CORS com a origem bloqueada | No Fly.io (app bravosbackend), setar `FRONTEND_URL=https://www.bravosbrasil.com.br,https://bravosbrasil.com.br` |
| Múltiplos domínios (www vs sem www) | Ver no erro de CORS qual origem está sendo enviada | Incluir as duas origens em `FRONTEND_URL`, separadas por vírgula |

### Checkout não redireciona para o Mercado Pago

| Causa provável | Como diagnosticar | Como corrigir |
|----------------|-------------------|----------------|
| create-preference falha (4xx/5xx) | Aba Network: ver resposta do POST para `/api/mp/create-preference` | Ver corpo da resposta e logs do backend; conferir `MP_ACCESS_TOKEN` e payload (items, payer, amount) |
| init_point / preferenceId não usados no front | Ver no código se o redirect usa `init_point` ou `preferenceId` retornado pela API | Garantir que o front chama create-preference e redireciona para a URL retornada (init_point ou equivalente) |

### Webhook não atualiza o pedido

| Causa provável | Como diagnosticar | Como corrigir |
|----------------|-------------------|----------------|
| URL do webhook errada no MP | No painel do Mercado Pago, conferir a URL cadastrada | Deve ser `https://bravosbackend.fly.dev/api/mp/webhooks` |
| BACKEND_URL errado no Fly | Logs do Fly: ver se as notificações chegam | Secret `BACKEND_URL=https://bravosbackend.fly.dev` (sem barra final) |
| Pedido não encontrado (external_reference) | Tabela `webhook_events`: status `failed`, errorMessage “Order not found” | Garantir que o pagamento no MP foi criado com a mesma `external_reference` do pedido no banco |

### Painel admin retorna 401/403

| Causa provável | Como diagnosticar | Como corrigir |
|----------------|-------------------|----------------|
| ADMIN_TOKEN não enviado ou errado | Aba Network: requisições para `/api/admin/orders` ou `/api/orders/.../mark-montink` devem ter header `x-admin-token` | Usar o mesmo valor configurado no Fly.io (secret `ADMIN_TOKEN`) no campo do painel |
| ADMIN_TOKEN não configurado no Fly | Backend sobe mas rotas admin falham | Setar secret `ADMIN_TOKEN` no app bravosbackend |

### Health OK mas outras rotas falham

| Causa provável | Como diagnosticar | Como corrigir |
|----------------|-------------------|----------------|
| Falta de variáveis obrigatórias em produção | Logs do Fly na subida do app: “Missing required env vars” | Configurar todos os secrets obrigatórios: DATABASE_URL, MP_ACCESS_TOKEN, FRONTEND_URL, BACKEND_URL, ADMIN_TOKEN |
| Banco inacessível (DATABASE_URL) | Logs com erro de conexão Prisma/Postgres | Conferir connection string do Supabase (projeto correto, SSL se necessário) |

---

## 5. Resumo dos scripts

| Arquivo | Uso |
|--------|-----|
| `scripts/test-backend.js` | `node scripts/test-backend.js [BASE_URL]` – testa health, shipping, create-order, get order, create-preference |
| `scripts/test-backend.sh` | `./scripts/test-backend.sh [BASE_URL]` – mesmo fluxo via curl (Bash) |
| `scripts/test-frontend.js` | Colar no console em www.bravosbrasil.com.br – testa conectividade, criar pedido, consultar pedido, create-preference |

Todos os scripts usam por padrão `https://bravosbackend.fly.dev`. Para outro ambiente, passe a URL como argumento (backend) ou edite a constante `BASE_URL` no script de frontend.
