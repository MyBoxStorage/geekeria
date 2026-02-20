# GEEKERIA — PARTE 3 de 3: Backend + Prompt IA + Entrega Final

## Contexto
Nome da marca: GEEKERIA
Leia o arquivo `GEEKERIA_IDENTIDADE.md` na raiz para saber as cores HEX
e tipografia definidas na Parte 1 antes de aplicar qualquer mudança.

---

## TAREFA 1 — server/routes/generate-stamp/generate.ts

Localizar o bloco do prompt padrão e substituir APENAS o conteúdo textual.
Manter as variáveis `{{UPLOADED_IMAGE}}`, `{{USER_PROMPT}}`, `{{HAS_TEXT}}` intactas.
Não alterar nenhuma lógica, imports ou estrutura do arquivo.

Novo prompt:
```
TAREFA: Criar arte PROFISSIONAL para estampa de camiseta (impressão DTF, 300 DPI, PNG transparente, 3:4).
ESTILO: Ilustração digital vibrante inspirada em arte de camiseta geek premium — anime, games, cultura pop brasileira.
IMAGEM ENVIADA: {{UPLOADED_IMAGE}} → SIM: usar instruções com foto; NÃO: ilustração original tema geek/cultura pop.
Se SIM: analisar conteúdo (pessoa/família/pet/objeto), transformar em arte estilo geek — pode virar personagem de anime, herói, guerreiro pixel art, etc.
Se NÃO: ilustração original tema geek/cultura pop, estilo camiseta premium — animes, games, filmes, séries, HQs.
PEDIDO DO USUÁRIO: "{{USER_PROMPT}}"
TEXTO: {{HAS_TEXT}} → SIM: texto em estilo geek/neon/pixel art, exatamente o que o usuário pediu; NÃO: não adicionar texto.
OBRIGATÓRIO: Fundo 100% transparente (PNG), sem mockups/marcas d'água, qualidade profissional, proporção para camiseta.
```

---

## TAREFA 2 — bravosbackend/mp/create-payment.ts

Alterar APENAS estas linhas — nunca tocar na lógica de pagamento:
- Linha 66: `BRAVOS-${Date.now()}` → `GEEKERIA-${Date.now()}`
- Linha 71: texto `Pedido BRAVOS BRASIL` → `Pedido GEEKERIA`
- Linha 92: `statement_descriptor: 'BRAVOS BRASIL'` → `statement_descriptor: 'GEEKERIA'`

---

## TAREFA 3 — bravosbackend/mp/create-preference.ts

Alterar APENAS estas linhas:
- Linha 73: `BRAVOS-${Date.now()}` → `GEEKERIA-${Date.now()}`
- Linha 116: `statement_descriptor: 'BRAVOS BRASIL'` → `statement_descriptor: 'GEEKERIA'`
- Linha 141: `platform: 'BRAVOS_BRASIL'` → `platform: 'GEEKERIA'`

---

## TAREFA 4 — bravosbackend/health.ts

- Linha 7: `service: 'BRAVOS BRASIL API'` → `service: 'GEEKERIA API'`

---

## TAREFA 5 — bravosbackend/prisma/seed.ts

- Linha 60: `'Boné Americano - Escudo Patriota'` → `'Boné Americano - Escudo Geek'`

---

## TAREFA 6 — Busca final por resíduos (nos dois projetos)

Busca global em `app/` E `bravosbackend/` por cada termo e substituir:
- `"BRAVOS BRASIL"` → `"GEEKERIA"`
- `"BRAVOS_BRASIL"` → `"GEEKERIA"`
- `"BRAVOS-"` → `"GEEKERIA-"`
- `"bravosbrasilco"` → `"geekeria"`
- `"patriot"` → verificar — substituir apenas onde for texto visível ao usuário
- `"brasil-green"`, `"brasil-yellow"`, `"brasil-blue"` → nomes novos das variáveis CSS
- `"#00843D"`, `"#FFCC29"`, `"#002776"` → novas cores

---

## TAREFA 7 — Gerar IDENTIDADE_VISUAL.md na raiz do projeto app/

Criar arquivo completo com:
- Nome: GEEKERIA + tagline definida na Parte 1
- Conceito e posicionamento (2 parágrafos — foco no público amplo, pai de família fã de anime, não só jovens)
- Paleta completa: cada cor com HEX, nome da variável CSS e papel na identidade
- Tipografia: fonte título + fonte corpo + onde usar cada uma
- Tom de voz: 5 características + 3 exemplos de copy prontos para usar
- Username Instagram sugerido: @geekeria ou variação disponível
- Bio Instagram (até 150 caracteres)
- Primeiros 9 posts: tema + legenda + hashtags de cada
- Prompt para gerar foto de perfil com IA (Midjourney ou DALL-E) — detalhado
- 20 hashtags principais do nicho geek brasileiro

---

## Restrições absolutas
- NUNCA alterar lógica de pagamento, checkout, orders ou autenticação
- NUNCA alterar: `prisma/schema.prisma`, `package.json`, `vite.config.ts`, `tsconfig*`, `.env*`
- NUNCA instalar dependências
- CNPJ no Footer → manter como `[A DEFINIR]`
- Número de WhatsApp → manter o existente
- NUNCA pedir confirmação — só parar ao concluir a TAREFA 7
