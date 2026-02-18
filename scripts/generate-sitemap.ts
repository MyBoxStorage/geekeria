/**
 * Script de geração de sitemap dinâmico
 * Executado automaticamente no build via package.json
 * Busca slugs de produtos ativos do Supabase e gera public/sitemap.xml
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
const DOMAIN = 'https://bravosbrasil.com.br';
const TODAY = new Date().toISOString().split('T')[0];

// Rotas estáticas indexáveis
const STATIC_ROUTES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/catalogo', priority: '0.9', changefreq: 'daily' },
];

async function getProductSlugs(): Promise<string[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Variáveis do Supabase não encontradas. Gerando sitemap apenas com rotas estáticas.');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('products')
    .select('slug')
    .not('category', 'eq', 'TESTES')
    .not('slug', 'is', null);

  if (error) {
    console.warn('⚠️  Erro ao buscar produtos:', error.message);
    return [];
  }

  return data?.map((p: { slug: string }) => p.slug).filter(Boolean) ?? [];
}

function generateXml(productSlugs: string[]): string {
  const staticEntries = STATIC_ROUTES.map(
    (route) => `
  <url>
    <loc>${DOMAIN}${route.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  ).join('');

  const productEntries = productSlugs.map(
    (slug) => `
  <url>
    <loc>${DOMAIN}/produto/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${productEntries}
</urlset>`;
}

async function main() {
  console.log('🗺️  Gerando sitemap...');

  const slugs = await getProductSlugs();
  console.log(`✅ ${slugs.length} produtos encontrados`);

  const xml = generateXml(slugs);

  const outputPath = resolve(process.cwd(), 'public/sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ sitemap.xml gerado em public/sitemap.xml`);
  console.log(`   Total de URLs: ${STATIC_ROUTES.length + slugs.length}`);
}

main().catch((err) => {
  console.error('❌ Erro ao gerar sitemap:', err);
  process.exit(1);
});
