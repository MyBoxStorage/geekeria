import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TEMPLATE_CONTENT = `TAREFA: Criar arte PROFISSIONAL para estampa de camiseta (impressão DTF, 300 DPI, PNG transparente, 3:4).

ESTILO: Ilustração digital vibrante inspirada em arte de camiseta premium.

IMAGEM ENVIADA: {{UPLOADED_IMAGE}}
Se {{UPLOADED_IMAGE}} = SIM, siga:
IMAGEM ENVIADA - ANÁLISE E ADAPTAÇÃO:
1. ANALISE o conteúdo: pessoa, família, pet, objeto, paisagem, etc.
2. TRANSFORME em arte de estampa mantendo o TEMA CENTRAL reconhecível
3. ADAPTE a composição para camiseta:
   - Se pessoa sozinha: formato busto/retrato (ombros para cima)
   - Se família/grupo: enquadre todos dentro da composição
   - Se pet/animal: centralize o animal, composição fechada
   - Se objeto: destaque o objeto centralizado
   - Se paisagem: adapte para formato vertical/quadrado

IMPORTANTE:
- NÃO deixe elementos saindo da composição (braços, pernas cortadas)
- Composição FECHADA e equilibrada
- Arte deve caber perfeitamente em uma camiseta
- Mantenha características reconhecíveis do conteúdo original
- Cores naturais preservadas (só altere se pedido)

ELEMENTOS BRASILEIROS (sutis):
- Bandeira do Brasil desfocada ao fundo
- Respingos de tinta verde (#00843D) e amarelo (#FFCC29)
- Efeitos de luz dourada
- Elementos decorativos discretos

Se {{UPLOADED_IMAGE}} = NÃO:
SEM FOTO:
- Criar ilustração original relacionada ao tema brasileiro
- Estilo: arte de camiseta profissional
- Composição equilibrada para impressão

BANDEIRAS E ELEMENTOS VISUAIS:
- Se o usuário pedir "bandeira do Brasil E Estados Unidos" ou similar: mostrar AMBAS as bandeiras
- Se pedir "bandeira do Brasil" apenas: mostrar só bandeira do Brasil
- Se pedir elementos de múltiplos países: incluir TODOS os elementos pedidos

PEDIDO DO USUÁRIO: "{{USER_PROMPT}}"

TEXTO SOLICITADO: {{HAS_TEXT}}
Se {{HAS_TEXT}} = SIM:
- Texto em dourado 3D com contorno
- Fonte bold, impactante
- Posição: embaixo ou conforme pedido
- Efeito: relevo, sombra, brilho metálico
- IMPORTANTE: Incluir exatamente o texto que o usuário pediu

Se {{HAS_TEXT}} = NÃO:
- Não adicione textos, palavras ou frases (usuário não pediu).

OBRIGATÓRIO:
- Fundo 100% transparente (PNG com canal alfa)
- Sem mockups, modelos ou marcas d'água
- Qualidade profissional de impressão
- Proporção adequada para camiseta`;

async function main() {
  const existing = await prisma.promptTemplate.findFirst({
    where: { isActive: true },
  });

  if (existing) {
    console.log('✅ Já existe um template ativo. Nenhum seed necessário.');
    return;
  }

  const defaultTemplate = await prisma.promptTemplate.create({
    data: {
      name: 'Template Padrão v1',
      isActive: true,
      content: DEFAULT_TEMPLATE_CONTENT,
    },
  });

  console.log('✅ Template padrão criado:', defaultTemplate.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
