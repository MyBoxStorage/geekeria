# GEEKERIA — PARTE 1 de 3: Identidade Visual + CSS

## Contexto
Este projeto é uma cópia de um e-commerce (BRAVOS BRASIL) sendo transformado
na GEEKERIA — loja de camisetas geek brasileira para o público amplo:
o pai de família que cresceu vendo Dragon Ball, o fã de Marvel, o gamer casual.
Tom: divertido, acolhedor, brasileiro. Não intimidador.

Após concluir esta parte, salve um arquivo `GEEKERIA_IDENTIDADE.md` na raiz
com as decisões tomadas (cores HEX, tipografia, tagline) para as próximas partes usarem.

---

## TAREFA 1 — Criar a identidade visual da GEEKERIA

### Nome fixado: GEEKERIA
Crie e documente:
- Tagline (ex: "Sua paixão virou estampa" — seja criativo, divertido, brasileiro)
- Paleta de 7 cores substituindo as atuais:
  - `#00843D` → nova cor primária (roxo, azul neon, ou cor geek forte)
  - `#FFCC29` → nova cor accent/destaque
  - `#002776` → nova cor secundária
  - `#006633` → variação escura da primária
  - `#00A44D` → variação clara da primária
  - `#E6B800` → variação escura do accent
  - `#001F5C` → variação escura da secundária
- Tipografia: manter Bebas Neue para títulos e Inter para corpo, OU trocar título por fonte geek do Google Fonts

---

## TAREFA 2 — Aplicar em src/index.css

Renomear e recolorir todas as variáveis CSS:
- `--brasil-green` → `--geekeria-primary` com novo HEX
- `--brasil-yellow` → `--geekeria-accent` com novo HEX
- `--brasil-blue` → `--geekeria-secondary` com novo HEX
- `--brasil-dark-green` → `--geekeria-primary-dark`
- `--brasil-light-green` → `--geekeria-primary-light`
- `--brasil-dark-yellow` → `--geekeria-accent-dark`
- `--brasil-dark-blue` → `--geekeria-secondary-dark`
- Renomear `.text-gradient-patriotic` → `.text-gradient-geekeria`
- Renomear `.bg-gradient-patriotic` → `.bg-gradient-geekeria`
- Se trocar fonte, adicionar @import do Google Fonts aqui

---

## TAREFA 3 — Aplicar em src/App.css

Substituir cada cor hardcoded:
- scrollbar-thumb `#00843D` → nova cor primária
- scrollbar-thumb:hover `#006633` → variação escura da primária
- ::selection background `#FFCC29` → novo accent
- ::selection color `#002776` → nova secundária
- focus-visible outline `#00843D` → nova cor primária

---

## TAREFA 4 — Aplicar em src/sections/Hero.tsx

- Badge: `bg-[#FFCC29] text-[#002776]` → novas cores
- Badge texto `"ESTAMPAS NOVAS TODA SEMANA"` → manter ou adaptar para geek
- `<span className="title-line block">VISTA SEU</span>` → novo slogan linha 1
- `<span className="title-line block text-gradient-patriotic">PATRIOTISMO</span>` → novo slogan linha 2 + trocar classe para `.text-gradient-geekeria`
- `alt="BRAVOS BRASIL"` → `alt="GEEKERIA"`
- Parágrafo "Camisetas e acessórios que celebram a tradição brasileira..." → novo texto geek
- `bg-gradient-green-yellow` no botão → nova classe de gradiente
- `hover:text-[#00843D]` → nova cor primária

---

## Restrições
- NUNCA alterar lógica, estrutura JSX, imports ou rotas
- NUNCA instalar dependências
- NUNCA pedir confirmação — executar tudo em sequência
- Ao terminar as 4 tarefas, salvar `GEEKERIA_IDENTIDADE.md` na raiz com as cores HEX escolhidas e a tagline
