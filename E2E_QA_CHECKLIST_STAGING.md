# E2E QA Checklist — Staging (Block 1 + Block 2)

Validação ponta-a-ponta com **1 pedido real de teste**. Confirma: risco/ip/ua persistem, success carrega resumo, /order (auto-busca + manual), admin list/export com risco, tracking 200/404, e fluxo 429.

**Não alterar código nem configs.** Apenas executar e preencher o relatório ao final.

---

## Pré-requisitos

- [ ] URL do **frontend** staging (ex.: `https://staging.xxx.com`)
- [ ] URL do **backend** staging (ex.: `https://api-staging.xxx.com`)
- [ ] **ADMIN_TOKEN** disponível no ambiente (nunca colar no chat nem em logs)
- [ ] Navegador e ferramenta para chamadas HTTP (curl, Insomnia, Postman, etc.)

---

## PASSO A — Criar 1 pedido de teste (fluxo principal)

### 1) Compra no staging

- [ ] Acessar o frontend staging e fazer **uma compra completa** (carrinho → checkout → pagamento).
- [ ] Usar email: **`qa+pedido1@seu-dominio.com`** (ou similar, e anotar o email exato usado).
- [ ] Anotar o **externalReference** exibido na tela de sucesso (ou na pending, se aplicável).

**Anotação:**  
`externalReference` = _____________________

---

### 2) Tela de sucesso e /order

- [ ] Na tela **/checkout/success**:
  - [ ] Confirmar se o **resumo do pedido carregou** (quando `bb_order_pending` tinha email antes de limpar).
- [ ] Clicar em **“Acompanhar meu pedido”**.
- [ ] Confirmar que **/order** abriu com:
  - [ ] **ref** preenchido (número do pedido).
  - [ ] **email** preenchido (via state; não aparece na URL).
- [ ] Escolher uma das opções:
  - [ ] Clicar **“Buscar agora”** no banner (auto-busca opcional), **ou**
  - [ ] Clicar **“Buscar”** (busca manual) com ref e email já preenchidos.
- [ ] Após carregar o pedido, confirmar:
  - [ ] **Status** traduzido (sem “Montink” em texto).
  - [ ] **Timeline** (4 etapas) exibida corretamente.
  - [ ] Botão **“Copiar”** (número do pedido) funciona e dá feedback (ex.: “Copiado!” ou toast).

**Problemas?** _________________________________________________

---

## PASSO B — Validar no Admin (API)

Usar **backend staging** + header:  
`x-admin-token: <ADMIN_TOKEN>`

### 3) Admin list

- [ ] Chamar:  
  **GET** `/api/admin/orders?status=PENDING&limit=50`
- [ ] Localizar o pedido pelo **externalReference** anotado.
- [ ] Confirmar presença dos campos:
  - [ ] `riskScore`
  - [ ] `riskFlag`
  - [ ] `riskReasons`
  - [ ] `ipAddress`
  - [ ] `userAgent`

**Anotação:**  
`riskScore` = _____ | `riskFlag` = _____ | `ipAddress` = present/null | `userAgent` = present/null

---

### 4) Export

- [ ] Chamar:  
  **GET** `/api/admin/orders/:externalReference/export`  
  (substituir `:externalReference` pelo valor anotado)
- [ ] Confirmar que a resposta inclui:  
  **`export.risk`** = `{ score, flag, reasons, ipAddress, userAgent }`

**Anotação:**  
`export.risk` presente? sim / não

---

## PASSO C — Tracking público

### 5) Email correto

- [ ] Chamar:  
  **GET** `/api/orders/:externalReference?email=<email_do_pedido>`  
  (usar o mesmo email da compra, ex.: `qa+pedido1@seu-dominio.com`)
- [ ] Esperado: **200** e corpo com **`payerEmailMasked`** (email mascarado, não em claro).

**Resultado:** status _____ | payerEmailMasked presente? sim / não

---

### 6) Email errado

- [ ] Chamar:  
  **GET** `/api/orders/:externalReference?email=errado@exemplo.com`
- [ ] Esperado: **404** (não revelar se o problema é email ou ref).

**Resultado:** status _____

---

## PASSO D — Rate limit (429)

### 7) Muitas chamadas + mensagem na UI

- [ ] Fazer **várias chamadas seguidas** do tracking público (ex.: 15–20 ou mais), mesmo ref + email correto:  
  **GET** `/api/orders/:externalReference?email=<email_do_pedido>`
- [ ] Se vier **429** em alguma resposta:
  - [ ] Abrir **/order** no frontend (ref + email preenchidos).
  - [ ] Clicar **“Buscar”** (ou “Atualizar status” se já tiver pedido carregado) e provocar novo 429.
  - [ ] Confirmar que a UI exibe mensagem do tipo:  
    **“Muitas tentativas. Aguarde um minuto e tente novamente.”**

**Resultado:** 429 recebido? sim / não | Mensagem na UI conferida? sim / não / N/A

---

## OUTPUT — Relatório final

Preencher e relatar (sem colar IP completo nem ADMIN_TOKEN):

| Item | Valor |
|------|--------|
| **externalReference** | |
| **Status do pedido** (ex.: PENDING, PAID) | |
| **riskScore** | |
| **riskFlag** | true / false |
| **riskReasons** (resumo, sem PII) | |
| **ipAddress** | present / null |
| **userAgent** | present / null |
| **Success: resumo carregou?** | sim / não |
| **/order: ref+email preenchidos?** | sim / não |
| **/order: Buscar agora ou Buscar ok?** | sim / não |
| **Admin list: campos de risco ok?** | sim / não |
| **Export: export.risk ok?** | sim / não |
| **Tracking email certo: 200 + mascarado?** | sim / não |
| **Tracking email errado: 404?** | sim / não |
| **429: mensagem UI ok?** | sim / não / N/A |

**Prints ou erros (descrever ou anexar):**  
_________________________________________________________________  
_________________________________________________________________

---

*Checklist E2E Staging — Block 1 (risk/telemetry) + Block 2 (área do cliente).*
