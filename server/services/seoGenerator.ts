/**
 * Automatic SEO generation for products.
 * Uses OpenAI GPT-4o mini with smart template fallback.
 */

import { logger } from '../utils/logger.js';

interface ProductSEOInput {
  name: string;
  description: string;
  category: string;
  gender: string;
  badge?: string | null;
  price: number;
}

interface ProductSEOOutput {
  metaTitle: string;
  metaDescription: string;
  seoTags: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  animes: 'Anime',
  games: 'Gamer',
  series: 'Séries',
  filmes: 'Filmes',
  infantil: 'Infantil',
  acessorios: 'Acessório',
};

function generateSEOFromTemplate(product: ProductSEOInput): ProductSEOOutput {
  const categoryLabel = CATEGORY_LABELS[product.category] ?? 'Peça';
  const genderLabel =
    product.gender === 'feminino'
      ? 'Feminina'
      : product.gender === 'masculino'
        ? 'Masculina'
        : '';

  const metaTitle = `${product.name} | GEEKERIA`.substring(0, 60).trim();

  const desc = product.description
    ? `${categoryLabel} geek ${genderLabel} - ${product.description}`
    : `${categoryLabel} geek ${genderLabel} ${product.name}. Qualidade premium, estampas exclusivas. Compre na GEEKERIA.`;
  const metaDescription = desc.substring(0, 160).trim();

  const seoTags = [
    'geekeria',
    'camiseta geek',
    `${categoryLabel.toLowerCase()} geek`,
    'cultura pop',
    'anime games filmes',
    product.category,
    product.gender !== 'unissex' ? product.gender : 'unissex',
    'camiseta estampa exclusiva',
  ]
    .filter(Boolean)
    .slice(0, 8);

  return { metaTitle, metaDescription, seoTags };
}

export async function generateProductSEO(
  product: ProductSEOInput,
): Promise<ProductSEOOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn('OPENAI_API_KEY not set — using template fallback for SEO generation.');
    return generateSEOFromTemplate(product);
  }

  try {
    const prompt = `Você é um especialista em SEO para e-commerce brasileiro de moda geek e cultura pop.

Gere SEO otimizado para este produto da marca GEEKERIA:
- Nome do produto: ${product.name}
- Categoria: ${product.category}
- Gênero: ${product.gender}
- Preço: R$ ${product.price.toFixed(2)}
- Descrição: ${product.description}
${product.badge ? `- Badge: ${product.badge}` : ''}

INSTRUÇÕES CRÍTICAS:
1. O NOME DO PRODUTO é a palavra-chave principal. Use-o como base do metaTitle.
2. Extraia da descrição a PAIXÃO GEEK — anime, games, filmes, séries, cultura pop, nostalgia. Essa emoção deve estar presente no metaTitle e metaDescription.
3. O metaDescription deve conectar a paixão do fã com a intenção de compra. Use linguagem que ressoe com quem ama cultura geek. Termine com call-to-action direto.
4. As seoTags devem misturar: (a) termos de busca do nicho — como "camiseta anime", "camiseta gamer", "camiseta geek brasil"; (b) termos específicos do tema do produto — extraídos do nome e da descrição; (c) termos de intenção de compra — como "comprar camiseta geek", "presente geek".
5. NUNCA use termos técnicos (gramatura, fio, DTG) nas tags ou description — esses são diferenciais de conversão, não de busca.
6. Escreva como um fã brasileiro fala e busca — informal, direto, apaixonado.

Retorne APENAS um JSON válido (sem markdown, sem explicações) neste formato exato:
{
  "metaTitle": "título com máximo 60 caracteres terminando com | GEEKERIA",
  "metaDescription": "máximo 160 caracteres, emocional, com call-to-action",
  "seoTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}

Regras absolutas:
- metaTitle: máximo 60 caracteres, termine com " | GEEKERIA"
- metaDescription: máximo 160 caracteres
- seoTags: 6 a 8 tags, todas em português, foco emocional e de intenção de compra`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty OpenAI response');

    const parsed = JSON.parse(content) as ProductSEOOutput;
    const fallback = generateSEOFromTemplate(product);

    return {
      metaTitle: parsed.metaTitle?.substring(0, 60) ?? fallback.metaTitle,
      metaDescription:
        parsed.metaDescription?.substring(0, 160) ?? fallback.metaDescription,
      seoTags: Array.isArray(parsed.seoTags)
        ? parsed.seoTags.slice(0, 8)
        : fallback.seoTags,
    };
  } catch (error) {
    logger.error(`SEO generation via OpenAI failed, using fallback: ${error}`);
    return generateSEOFromTemplate(product);
  }
}
