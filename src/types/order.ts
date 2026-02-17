/**
 * Tipos compartilhados para Order
 */

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'READY_FOR_MONTINK'
  | 'SENT_TO_MONTINK'
  | 'FAILED_MONTINK'
  | 'CANCELED'
  | 'FAILED'
  | 'REFUNDED';

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  shippingCost: number;
  total: number;
}

export interface OrderShipping {
  cep: string | null;
  address1: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
  service: string | null;
  deadline: number | null;
}

export interface OrderItemProduct {
  id?: string;
  name: string;
  image: string | null;
  images?: unknown[] | null;
  colorStock?: unknown[] | null;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  size: string | null;
  color: string | null;
  name: string | null;
  product?: OrderItemProduct | null;
}

export interface OrderResponse {
  orderId: string;
  externalReference: string;
  status: OrderStatus;
  totals: OrderTotals;
  shipping: OrderShipping;
  items: OrderItem[];
  mpStatus: string | null;
  mpPaymentId: string | null;
  montinkStatus: string | null;
  montinkOrderId: string | null;
   payerEmailMasked: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer-facing status label (no internal/partner names).
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: 'Aguardando confirmação do pagamento',
    PAID: 'Pagamento confirmado',
    READY_FOR_MONTINK: 'Pagamento confirmado',
    SENT_TO_MONTINK: 'Pedido em produção',
    FAILED_MONTINK: 'Precisamos de suporte',
    CANCELED: 'Pedido cancelado',
    FAILED: 'Falha no pagamento',
    REFUNDED: 'Reembolsado',
  };
  return labels[status] ?? 'Status em atualização';
}

/**
 * Optional short hint for the status (shown below label).
 */
export function getOrderStatusHint(status: OrderStatus): string | null {
  const hints: Partial<Record<OrderStatus, string | null>> = {
    PENDING: 'Pagamentos podem levar alguns minutos para confirmar.',
    PAID: 'Estamos preparando seu pedido para envio.',
    READY_FOR_MONTINK: 'Estamos preparando seu pedido para envio.',
    SENT_TO_MONTINK: 'Seu pedido está sendo preparado para envio.',
    CANCELED: null,
    FAILED: null,
    REFUNDED: null,
    FAILED_MONTINK: 'Entre em contato para mais informações.',
  };
  return hints[status] ?? null;
}
