/**
 * Serviços de checkout
 */

import { postJSON } from './api';

export interface CreateOrderRequest {
  payer: {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
  };
  shipping?: {
    cep?: string;
    address1?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    complement?: string;
    service?: string;
    deadline?: number;
  };
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    size?: string;
    color?: string;
  }>;
  couponCode?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  externalReference: string;
  totals: {
    subtotal: number;
    discountTotal: number;
    shippingCost: number;
    total: number;
  };
}

/**
 * Cria um pedido no backend
 */
export async function createOrder(
  payload: CreateOrderRequest,
  options?: { token?: string }
): Promise<CreateOrderResponse> {
  return postJSON<CreateOrderResponse>('/api/checkout/create-order', payload, {
    headers: {
      ...(options?.token && { Authorization: `Bearer ${options.token}` }),
    },
  });
}
