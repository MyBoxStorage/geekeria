/**
 * Configuração do Mercado Pago para GEEKERIA
 * 
 * Este arquivo centraliza todas as configurações relacionadas ao Mercado Pago
 * baseado nas recomendações da checklist de qualidade.
 */

export const MERCADOPAGO_CONFIG = {
  // App ID da aplicação
  APP_ID: '8109795162351103',
  APP_NAME: 'GEEKERIA Real',

  // Statement Descriptor (aparece na fatura do cartão)
  // Máximo 22 caracteres
  STATEMENT_DESCRIPTOR: 'GEEKERIA',

  // URLs de redirecionamento após pagamento
  BACK_URLS: {
    success: `${window.location.origin}/checkout/success`,
    failure: `${window.location.origin}/checkout/failure`,
    pending: `${window.location.origin}/checkout/pending`,
  },

  // URL do webhook (deve ser configurada no backend)
  // Exemplo: 'https://api.bravosbrasil.com.br/webhooks/mercadopago'
  WEBHOOK_URL: import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL || '',

  // Configurações de pagamento
  PAYMENT: {
    // Modo binário: aprovação instantânea (aprovado ou rejeitado)
    // Use true se seu negócio requer aprovação imediata
    binaryMode: false,

    // Número máximo de parcelas
    maxInstallments: 12,

    // Meios de pagamento excluídos (opcional)
    // Exemplo: [{ id: 'amex' }] para excluir American Express
    excludedPaymentMethods: [] as Array<{ id: string }>,

    // Tipos de pagamento excluídos (opcional)
    // Exemplo: [{ id: 'ticket' }] para excluir boletos
    excludedPaymentTypes: [] as Array<{ id: string }>,

    // Data de vencimento para pagamentos offline (boletos)
    // Formato: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
    // Exemplo: 3 dias a partir de agora
    getDateOfExpiration: (days: number = 3): string => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString();
    },
  },

  // Categorias de produtos (melhora taxa de aprovação)
  PRODUCT_CATEGORIES: {
    camisetas: 'apparel',
    bone: 'accessories',
    moletom: 'apparel',
    polo: 'apparel',
    infantil: 'apparel',
    acessorios: 'accessories',
  } as Record<string, string>,

  // Tipos de identificação aceitos (Brasil)
  IDENTIFICATION_TYPES: {
    CPF: 'CPF',
    CNPJ: 'CNPJ',
  },
} as const;

/**
 * Gera uma referência externa única para o pedido
 */
export function generateExternalReference(orderId?: string): string {
  if (orderId) {
    return `GEEKERIA-${orderId}`;
  }
  return `GEEKERIA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Valida se o statement descriptor está dentro do limite
 */
export function validateStatementDescriptor(descriptor: string): string {
  const maxLength = 22;
  if (descriptor.length > maxLength) {
    if (import.meta.env.DEV) {
      console.warn(
        `Statement descriptor excede ${maxLength} caracteres. Será truncado.`
      );
    }
    return descriptor.substring(0, maxLength);
  }
  return descriptor;
}

/**
 * Obtém a categoria do Mercado Pago baseada na categoria do produto
 */
export function getMercadoPagoCategory(productCategory: string): string {
  return MERCADOPAGO_CONFIG.PRODUCT_CATEGORIES[productCategory] || 'others';
}
