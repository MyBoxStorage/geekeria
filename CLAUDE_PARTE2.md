# GEEKERIA — PARTE 2 de 3: Componentes + Produtos

## Contexto
Nome da marca: GEEKERIA
Leia o arquivo `GEEKERIA_IDENTIDADE.md` na raiz para saber as cores HEX
e tipografia definidas na Parte 1 antes de aplicar qualquer mudança.

---

## TAREFA 1 — src/sections/Header.tsx

- `<span className="font-display text-3xl text-[#00843D]">BRAVOS</span>` → `<span className="font-display text-3xl text-[--geekeria-primary]">GEEKERIA</span>`
- Remover o segundo span ` BRASIL` (o nome agora é uma palavra só)
- Todas as ocorrências de `text-[#00843D]`, `text-[#FFCC29]`, `text-[#002776]` → novas cores do GEEKERIA_IDENTIDADE.md
- Todas as ocorrências de `bg-[#00843D]`, `bg-[#FFCC29]`, `bg-[#002776]` → novas cores

---

## TAREFA 2 — src/sections/Footer.tsx

- Logo: substituir spans `BRAVOS` + ` BRASIL` por `GEEKERIA` com nova cor primária
- `"Vista seu patriotismo. Roupas e acessórios que celebram a tradição brasileira."` → novo texto geek acolhedor
- `href: 'https://www.instagram.com/bravosbrasilco/'` → `'https://www.instagram.com/geekeria/'`
- `hover:bg-[#00843D]` → nova cor primária
- `hover:text-[#FFCC29]` → nova cor accent
- `"© 2025 BRAVOS BRASIL. Todos os direitos reservados."` → `"© 2025 GEEKERIA. Todos os direitos reservados."`
- `"CNPJ: 65.125.279/0001-85"` → `"CNPJ: [A DEFINIR]"`
- Todas as demais cores hardcoded → novas cores

---

## TAREFA 3 — src/sections/Customization.tsx

- `features` array: `"Tema patriótico de sua escolha"` → `"Personagem ou universo favorito"`
- Mensagem WhatsApp: `'Olá! Vim do site BRAVOS BRASIL e quero personalizar uma peça.'` → `'Olá! Vim do site GEEKERIA e quero personalizar uma peça.'`
- `bg-[#FFCC29]` decorativo → nova cor accent
- `bg-[#00843D]` decorativo e checks → nova cor primária

---

## TAREFA 4 — src/pages/Sobre.tsx

Reescrever textos mantendo estrutura JSX intacta:
- Subtítulo: `"Uma marca nascida do orgulho de ser brasileiro..."` → versão geek acolhedora
- Card PROPÓSITO: adaptar para contexto geek
- Card COMUNIDADE: `"Mais de 2.500 brasileiros..."` → `"Mais de 2.500 fãs..."`
- Seção "COMO TUDO COMEÇOU": nova história da Geekeria — nasceu da paixão por cultura pop brasileira
- Seção "NOSSA MISSÃO": reescrever para geek
- Manifesto: novo manifesto geek divertido e acolhedor
- Ícone `<Flag>` → `<Gamepad2>` (já disponível no lucide-react)
- Todas as cores → novas cores do GEEKERIA_IDENTIDADE.md
- Substituir todo texto "Bravos Brasil" → "Geekeria"

---

## TAREFA 5 — src/data/products.ts

Substituir TODOS os produtos mantendo estrutura TypeScript exata (mesmos campos).

`featuredProducts` (8 produtos):
1. T-Shirt Classic - GOKU SUPER SAIYAJIN (categoria: animes, unissex)
2. T-Shirt Gaming - RETRO PIXEL ART (categoria: games, unissex)
3. T-Shirt Marvel - HOMEM DE FERRO (categoria: filmes, unissex)
4. Moletom Canguru - STRANGER THINGS (categoria: series, unissex)
5. Boné Bordado - GEEKERIA (categoria: acessorios, unissex)
6. T-Shirt Feminina - SAILOR MOON (categoria: animes, feminino)
7. Camiseta Infantil - PIKACHU (categoria: infantil, unissex)
8. Caneca - DARTH VADER (categoria: acessorios, unissex)

`allProducts` (20 produtos total) — adicionar mais 12:
9. T-Shirt - NARUTO UZUMAKI
10. T-Shirt - BATMAN MINIMAL
11. Moletom - THE LAST OF US
12. T-Shirt - LINK ZELDA RETRO
13. Polo - DUNGEONS & DRAGONS
14. T-Shirt Feminina - HERMIONE GRANGER
15. Baby Long - BABY YODA
16. T-Shirt - SPIDER-MAN MILES MORALES
17. Moletom com Zíper - EVANGELION
18. T-Shirt Plus Size - HULK
19. Regata Sport - SONIC THE HEDGEHOG
20. Copo Térmico - PORTAL GEEK

Atualizar:
- `categories`: `[{id:'all',name:'Todos',count:40}, {id:'animes',name:'Animes',count:12}, {id:'games',name:'Games',count:8}, {id:'series',name:'Séries',count:6}, {id:'filmes',name:'Filmes',count:8}, {id:'infantil',name:'Infantil',count:4}, {id:'acessorios',name:'Acessórios',count:6}]`
- `colors`: substituir hex de verde/azul/amarelo pelas novas cores do GEEKERIA_IDENTIDADE.md
- `testimonials`: reescrever 6 depoimentos — fãs falando das estampas geek, mesmo formato, cidades brasileiras reais
- `faqs`: substituir apenas as que mencionam "patriótico" ou "valores" — manter todas as operacionais

---

## Restrições
- NUNCA alterar lógica, estrutura JSX, imports ou rotas
- NUNCA instalar dependências
- NUNCA pedir confirmação — executar tudo em sequência
