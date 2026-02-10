/**
 * Serviço para criar preferências de pagamento do Mercado Pago
 * 
 * Usa o backend para criar preferências de forma segura
 * (Access Token não deve estar no frontend)
 */

import type { CartItem } from '@/types';

export interface CreatePreferenceRequest {
  items: CartItem[];
  payer: {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    zipCode?: string;
    address?: string;
  };
  amount: number;
  shipping?: number;
  externalReference?: string;
}

export interface CreatePreferenceResponse {
  preferenceId: string;
  initPoint: string; // URL para redirecionamento web
  sandboxInitPoint?: string;
  orderId: string;
  externalReference: string;
  mobile: {
    android: string;
    ios: string;
  };
}

// Use VITE_API_URL as single source of truth (no localhost fallback in production)
const BACKEND_URL = import.meta.env.VITE_API_URL || '';

/**
 * Cria uma preferência de pagamento no Mercado Pago via backend
 */
export async function createPreference(
  data: CreatePreferenceRequest
): Promise<CreatePreferenceResponse> {
  try {
    // Converter itens do carrinho para o formato esperado pelo backend
    const requestBody = {
      items: data.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
        name: item.product.name,
        description: item.product.description,
        image: item.product.image,
        size: item.size,
        color: item.color,
      })),
      payer: data.payer,
      amount: data.amount,
      shipping: data.shipping,
      externalReference: data.externalReference,
    };

    const response = await fetch(`${BACKEND_URL}/api/mp/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar preferência de pagamento');
    }

    const result = await response.json();
    return result as CreatePreferenceResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao criar preferência de pagamento');
  }
}

/**
 * Redireciona para o checkout do Mercado Pago (web)
 */
export function redirectToCheckout(initPoint: string) {
  window.location.href = initPoint;
}

/**
 * Abre o checkout do Mercado Pago em nova aba (web)
 */
export function openCheckoutInNewTab(initPoint: string) {
  window.open(initPoint, '_blank');
}

/**
 * Retorna a URL do checkout para mobile (deep link)
 */
export function getMobileCheckoutUrl(initPoint: string, platform: 'android' | 'ios'): string {
  // O Mercado Pago detecta automaticamente o dispositivo
  // Mas podemos customizar se necessário
  
  // Para iOS, podemos usar deep link se necessário
  if (platform === 'ios') {
    // O initPoint já funciona, mas podemos adicionar parâmetros se necessário
    return initPoint;
  }
  
  // Para Android, funciona da mesma forma
  return initPoint;
}

/**
 * Abre o checkout no app do Mercado Pago (mobile)
 * Tenta abrir o app, se não estiver instalado, abre no navegador
 */
export function openMobileCheckout(initPoint: string, platform: 'android' | 'ios') {
  if (platform === 'ios') {
    // Para iOS, tenta abrir no app primeiro
    const appUrl = `mercadopago://checkout?preference_id=${initPoint.split('pref_id=')[1]?.split('&')[0] || ''}`;
    
    // Tenta abrir no app
    window.location.href = appUrl;
    
    // Fallback: se o app não abrir em 2 segundos, abre no navegador
    setTimeout(() => {
      if (document.hasFocus()) {
        window.location.href = initPoint;
      }
    }, 2000);
  } else {
    // Para Android, usa intent
    const intentUrl = `intent://checkout#Intent;scheme=mercadopago;package=com.mercadopago.wallet;S.preference_id=${initPoint.split('pref_id=')[1]?.split('&')[0] || ''};end`;
    
    // Tenta abrir no app
    window.location.href = intentUrl;
    
    // Fallback: se o app não abrir, abre no navegador
    setTimeout(() => {
      if (document.hasFocus()) {
        window.location.href = initPoint;
      }
    }, 2000);
  }
}
