/**
 * Pure helpers for picking product images based on gender preference
 * and for order item thumbnail resolution.
 */

import type { Product, ProductImage, ColorStockItem } from '@/types';
import type { OrderItem as TrackingOrderItem, OrderItemProduct } from '@/types/order';

/**
 * Pick the best model image URL for a given gender preference.
 *
 * Priority:
 * 1. Model image matching preferred gender
 * 2. Any model image
 * 3. Any product/detail image
 * 4. product.image fallback
 */
export function pickModelImage(
  product: Product,
  preferred: 'masculino' | 'feminino' | null,
): string | null {
  const imgs = product.images;
  if (!Array.isArray(imgs) || imgs.length === 0) {
    return product.image ?? null;
  }

  // 1. Exact match: model + preferred gender
  if (preferred) {
    const exact = imgs.find(
      (img) => img.type === 'model' && img.gender === preferred,
    );
    if (exact?.url) return exact.url;
  }

  // 2. Any model image
  const anyModel = imgs.find((img) => img.type === 'model');
  if (anyModel?.url) return anyModel.url;

  // 3. Product or detail image
  const fallbackImg = imgs.find(
    (img) => img.type === 'product' || img.type === 'detail',
  );
  if (fallbackImg?.url) return fallbackImg.url;

  // 4. First image with a url
  const first = imgs.find((img) => !!img.url);
  if (first?.url) return first.url;

  return product.image ?? null;
}

/**
 * Determine the initial card gender from the page-level filter.
 *
 * Returns null when the filter doesn't specify a gender (e.g. "Todos"),
 * letting the caller use its own default (random / existing behaviour).
 */
export function getInitialCardGender(
  filtersGender: string,
): 'masculino' | 'feminino' | null {
  if (filtersGender === 'feminino') return 'feminino';
  if (filtersGender === 'masculino') return 'masculino';
  return null;
}

// ── Order-item thumbnail resolution ─────────────────────────────────

/** Minimal product shape accepted by the order-item helper. */
type OrderProduct = OrderItemProduct | { name: string; image: string | null; images?: unknown[] | null; colorStock?: unknown[] | null };

/** Minimal order-item shape (works with both OrderTracking and UserDashboard types). */
interface OrderItemLike {
  color?: string | null;
  product?: OrderProduct | null;
}

/**
 * Pick the best thumbnail URL for an order item.
 *
 * Priority:
 *  1. colorStock image matching item.color (best UX — shows exact variant ordered)
 *  2. images[] by type priority: product > detail > model > first with url
 *  3. product.image (main cover)
 *  4. null (caller should use a placeholder)
 */
export function pickOrderItemImage(item: OrderItemLike): string | null {
  const product = item.product;
  if (!product) return null;

  // 1. Color-specific image via colorStock
  if (item.color && Array.isArray(product.colorStock) && product.colorStock.length > 0) {
    const normalise = (s: string) => s.trim().toLowerCase();
    const target = normalise(item.color);
    const match = (product.colorStock as ColorStockItem[]).find(
      (cs) => normalise(cs.id) === target || normalise(cs.name) === target,
    );
    if (match?.image) return match.image;
  }

  // 2. images[] by type priority
  if (Array.isArray(product.images) && product.images.length > 0) {
    const imgs = product.images as ProductImage[];
    const byType = (t: string) => imgs.find((i) => i.type === t && !!i.url);
    const found = byType('product') ?? byType('detail') ?? byType('model') ?? imgs.find((i) => !!i.url);
    if (found?.url) return found.url;
  }

  // 3. product.image
  if (product.image) return product.image;

  return null;
}
