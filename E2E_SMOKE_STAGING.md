# E2E Smoke — Staging (3 fluxos + validação Admin/Tracking)

Valida criação de pedidos nos três fluxos e checagem em Admin e tracking público. **Somente leitura no DB via API; nenhuma alteração de schema.**

---

## Requisitos

- **Ambiente staging** com `DATABASE_URL` acessível (backend rodando).
- **ADMIN_TOKEN** em env (nunca logar).
- **PRODUCT_ID**: id de um produto existente no banco (obrigatório para create-order / create-preference / create-payment). Se não houver, criar um produto em staging ou usar um id existente.
- Credenciais/sandbox do Mercado Pago configuradas (create-preference e create-payment chamam a API do MP; opcional se usar mock ou pular esses fluxos).

---

## Passos

### 1) Checkout frontend (manual ou via script)

**Opção A — Manual (frontend)**  
- Acessar o staging no browser.
- Fazer checkout completo (carrinho → checkout → email `test@exemplo.com` → pagamento).
- Na tela de sucesso, anotar o **externalReference** (número do pedido).
- Seguir para a validação abaixo (admin list, export, tracking).

**Opção B — Via script (só backend)**  
- O script `e2e-smoke-staging.js` chama `POST /api/checkout/create-order` (equivalente ao que o frontend chama ao criar o pedido).
- Não completa o pagamento no MP; o pedido fica PENDING.
- Anotar o `externalReference` impresso pelo script.

**Validação (para o pedido obtido em 1):**  
- `GET /api/admin/orders?status=PENDING&limit=50` com header `x-admin-token: <ADMIN_TOKEN>`.  
- Localizar o pedido pelo `externalReference` e verificar: `riskScore`, `riskFlag`, `riskReasons`, `ipAddress`, `userAgent` (present/null).  
- `GET /api/admin/orders/:externalReference/export` com `x-admin-token` → verificar `export.risk` (score, flag, reasons, ipAddress, userAgent).  
- `GET /api/orders/:externalReference?email=test@exemplo.com` → 200, payload com `payerEmailMasked` (não email em claro).

---

### 2) MP create-preference (script)

- O script chama `POST /api/mp/create-preference` com payload de teste.
- Se a API retornar 201 e `externalReference`, o script repete os mesmos checks do passo 1 (admin list, export, tracking).
- Se MP_ACCESS_TOKEN não estiver configurado ou o MP retornar erro, o script falha nesse passo e registra o erro.

---

### 3) MP create-payment (script)

- O script chama `POST /api/mp/create-payment` com payload de teste (PIX).
- Valida admin list, export e tracking da mesma forma.

---

### 4) Adversarial (rate limit 429)

- O script envia **65 requisições** rápidas a `GET /api/orders/:ref?email=...` (mesmo ref/email de um dos pedidos criados).
- Limite do backend: **60 requests / 5 min** por IP para `GET /api/orders`.
- Esperado: várias respostas **429** após ultrapassar o limite.
- Objetivo: validar que o rate limit responde 429 e que a UI trata (mensagem “Muitas tentativas…”).

---

## PRODUCT_ID real (staging)

Foi obtido um `id` existente na tabela `products` do projeto Supabase (staging):

- **PRODUCT_ID** = `1`

Para obter outro no futuro (Supabase SQL): `SELECT id FROM products LIMIT 1;`  
Ou via Prisma (com DATABASE_URL):  
`npx tsx -e "import { PrismaClient } from '@prisma/client'; const p=new PrismaClient(); p.product.findFirst({select:{id:true}}).then(x=>{console.log(x?.id);}).finally(()=>p.\$disconnect());"`

---

## Como rodar o script

```bash
# Na raiz do repo (app). Defina BACKEND_STAGING_URL e ADMIN_TOKEN (não colar no chat).
export BASE_URL=<BACKEND_STAGING_URL>   # ou BACKEND_URL
export ADMIN_TOKEN=<seu_token>
export PRODUCT_ID=1

node scripts/e2e-smoke-staging.js
```

Exemplo (PowerShell) e salvar evidência:

```powershell
# 1) Setar variáveis (substituir pelos valores reais de staging)
$env:BASE_URL="https://<BACKEND_STAGING_URL>"
$env:ADMIN_TOKEN="<ADMIN_TOKEN>"
$env:PRODUCT_ID="1"

# 2) Rodar e salvar log para auditoria (raiz do repo)
node scripts/e2e-smoke-staging.js | Tee-Object -FilePath "e2e-smoke-staging-output.txt"
```

O arquivo `e2e-smoke-staging-output.txt` na raiz do repo conterá o output completo para auditoria. Se `ADMIN_TOKEN` não estiver definido, o script falha antes de chamar a API e o arquivo conterá apenas a mensagem de erro.

Saída esperada (exemplo):

- Para cada fluxo: `externalReference`, resultado do admin list (risk*, ipAddress, userAgent), `export.risk`, status do tracking (200 e email mascarado).
- No final: resumo e, no bloco adversarial, contagem de 200 vs 429.

---

## Template de anotação (por case)

Para cada fluxo (create-order, create-preference, create-payment), preencher:

| Campo              | Valor |
|--------------------|--------|
| externalReference  | ...    |
| riskScore          | ...    |
| riskFlag           | true / false |
| riskReasons        | ... (sem PII) |
| ipAddress          | present / null |
| userAgent          | present / null |
| export.risk ok     | sim / não |
| tracking 200       | sim / não |
| tracking 404 (email errado) | N/A ou sim/não |
| email mascarado    | sim / não |

**Adversarial (rate limit):**

| Campo     | Valor |
|-----------|--------|
| 200 count | ...    |
| 429 count | ...    |

---

## Registro de resultados (evidência)

Preencher após executar o script e conferir `e2e-smoke-staging-output.txt`. Data da execução: \_\_\_\_\_\_\_\_\_\_\_\_.

### Fluxo 1 — create-order

| Campo              | Valor |
|--------------------|--------|
| externalReference  | |
| riskScore          | |
| riskFlag           | |
| riskReasons        | |
| ipAddress          | present / null |
| userAgent          | present / null |
| export.risk OK     | sim / não |
| tracking 200       | sim / não |
| tracking 404       | N/A ou sim/não |
| email mascarado    | sim / não |

### Fluxo 2 — create-preference

| Campo              | Valor |
|--------------------|--------|
| externalReference  | |
| riskScore          | |
| riskFlag           | |
| riskReasons        | |
| ipAddress          | present / null |
| userAgent          | present / null |
| export.risk OK     | sim / não |
| tracking 200       | sim / não |
| tracking 404       | N/A ou sim/não |
| email mascarado    | sim / não |

### Fluxo 3 — create-payment

| Campo              | Valor |
|--------------------|--------|
| externalReference  | |
| riskScore          | |
| riskFlag           | |
| riskReasons        | |
| ipAddress          | present / null |
| userAgent          | present / null |
| export.risk OK     | sim / não |
| tracking 200       | sim / não |
| tracking 404       | N/A ou sim/não |
| email mascarado    | sim / não |

### Adversarial (rate limit)

| Campo     | Valor |
|-----------|--------|
| 200 count | |
| 429 count | |

**Arquivo de evidência:** `e2e-smoke-staging-output.txt`

---

## Se algo falhar

- **Arquivo:** indicar o script (e2e-smoke-staging.js) e o passo (create-order, create-preference, create-payment, adversarial).
- **Stack trace:** copiar a saída de erro do script (stack completo).
- **Request:** método, URL, body (sem tokens).
- **Response:** status e body (sem dados sensíveis).

Não alterar schema; apenas reportar para correção.

---

## Resumo

| Passo | Ação | Validação |
|-------|------|-----------|
| 1 | Checkout frontend (manual) ou create-order (script) | Admin list + export.risk + tracking |
| 2 | POST create-preference | Idem |
| 3 | POST create-payment | Idem |
| 4 | 65× GET /api/orders/:ref?email=... | Esperar 429 após o limite |

Nenhuma alteração de código/DB além do que a API já faz (criar pedidos e ler dados).
