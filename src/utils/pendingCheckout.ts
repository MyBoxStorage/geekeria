/**
 * Persistência de checkout pendente (frontend only).
 *
 * Salva/lê o estado do checkout em andamento em localStorage para:
 * 1. Recuperar um pagamento PIX/cartão interrompido (ex: refresh da página).
 * 2. Evitar criar Orders duplicados quando o usuário reabre o checkout.
 *
 * MCP: mercadopago-mcp-server (quality_checklist — anti‑duplicação recomendada)
 */

// ─── Constantes ────────────────────────────────────────────────────────────
export const PENDING_CHECKOUT_KEY = 'bb_order_pending_v1';

/** Chave legada — escrita em paralelo para manter compat com CheckoutPending/Success */
export const PENDING_LEGACY_KEY = 'bb_order_pending';

/** TTL: 2 horas (em ms) */
export const PENDING_TTL_MS = 2 * 60 * 60 * 1000;

// ─── Tipos ─────────────────────────────────────────────────────────────────
export interface PendingCheckoutV1 {
  version: 1;
  createdAt: number;
  orderId: string | null;
  externalReference: string | null;
  payer: {
    name: string;
    email: string;
    phone?: string;
    zipCode?: string;
    address?: string;
  } | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    size: string;
    color: string;
  }>;
  totals: {
    subtotal: number;
    discountTotal: number;
    shippingCost: number;
    total: number;
  } | null;
  step: 'form' | 'payment';
  paymentTypeHint?: 'pix' | 'card' | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Carrega o pending checkout. Retorna null se expirado, inválido ou ausente. */
export function loadPendingCheckout(): PendingCheckoutV1 | null {
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as PendingCheckoutV1;
    if (data.version !== 1) {
      clearPendingCheckout();
      return null;
    }

    // TTL check
    if (Date.now() - data.createdAt > PENDING_TTL_MS) {
      clearPendingCheckout();
      return null;
    }

    return data;
  } catch {
    clearPendingCheckout();
    return null;
  }
}

/**
 * Verifica se existe um pedido pendente (orderId + externalReference) dentro do TTL.
 * Útil para gates rápidos antes de chamar create-order.
 */
export function hasPendingOrder(): boolean {
  const pending = loadPendingCheckout();
  return (
    !!pending &&
    !!pending.orderId &&
    !!pending.externalReference &&
    !!pending.totals &&
    pending.step === 'payment'
  );
}

/** Salva um novo pending checkout (sobrescreve qualquer anterior). */
export function savePendingCheckout(
  data: Omit<PendingCheckoutV1, 'version' | 'createdAt'>,
): void {
  const payload: PendingCheckoutV1 = {
    version: 1,
    createdAt: Date.now(),
    ...data,
  };
  localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
}

/**
 * Atualiza campos específicos do pending checkout existente.
 * Se não houver pending válido, não faz nada.
 */
export function updatePendingCheckout(
  updates: Partial<Omit<PendingCheckoutV1, 'version'>>,
): void {
  const current = loadPendingCheckout();
  if (!current) return;

  const updated: PendingCheckoutV1 = { ...current, ...updates };
  localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(updated));
}

/** Remove ambas as keys (v1 + legada). */
export function clearPendingCheckout(): void {
  localStorage.removeItem(PENDING_CHECKOUT_KEY);
  localStorage.removeItem(PENDING_LEGACY_KEY);
}

/**
 * Escreve a key legada `bb_order_pending` usada por CheckoutPending e CheckoutSuccess.
 * Deve ser chamada em paralelo ao savePendingCheckout quando o orderId estiver disponível.
 */
export function writeLegacyPendingKey(orderId: string, externalReference: string, email: string): void {
  localStorage.setItem(
    PENDING_LEGACY_KEY,
    JSON.stringify({
      orderId,
      externalReference,
      email,
      timestamp: Date.now(),
    }),
  );
}
