/**
 * Pure helpers for product stock / variant availability.
 *
 * When `product.colorStock` exists (from backend), it is the source of truth.
 * When it doesn't exist (local fallback), we fall back to `product.sizes`
 * and `product.colors`.
 */

import type { Product, Gender, ColorStockItem } from '@/types';

// ── Well-known size order (for consistent rendering) ────────────────────────

export const ALL_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

// ── Color map for legacy products (no colorStock) ───────────────────────────

const LEGACY_COLOR_HEX: Record<string, string> = {
  preto: '#000000',
  branco: '#FFFFFF',
  verde: '#00843D',
  azul: '#002776',
  cinza: '#666666',
  amarelo: '#FFCC29',
  vermelho: '#DC2626',
  rosa: '#EC4899',
  roxo: '#7C3AED',
  laranja: '#F97316',
  marrom: '#78350F',
  bege: '#D4B896',
  bordo: '#7F1D1D',
  vinho: '#722F37',
  'verde-militar': '#4B5320',
};

// ── 1) Effective gender ─────────────────────────────────────────────────────

export type BinaryGender = 'masculino' | 'feminino';

/**
 * Resolve which stock gender to look up.
 * - If the product itself is gendered, use that.
 * - If the product is unissex, use the UI-selected gender.
 */
export function getEffectiveGender(
  productGender: Gender,
  uiGender: BinaryGender,
): BinaryGender {
  if (productGender === 'masculino') return 'masculino';
  if (productGender === 'feminino') return 'feminino';
  return uiGender; // unissex → respect UI choice
}

// ── 2) Available colors ─────────────────────────────────────────────────────

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  image: string | null;
}

/**
 * Get the list of colors for the product.
 * Uses `colorStock` when available, otherwise falls back to `product.colors`.
 */
export function getAvailableColors(product: Product): ColorOption[] {
  const cs = product.colorStock;
  if (Array.isArray(cs) && cs.length > 0) {
    return cs.map((item) => ({
      id: item.id,
      name: item.name,
      hex: item.hex || '',
      image: item.image ?? null,
    }));
  }

  // Fallback: derive from product.colors
  return (product.colors ?? []).map((c) => ({
    id: c,
    name: c,
    hex: LEGACY_COLOR_HEX[c.toLowerCase()] ?? '',
    image: null,
  }));
}

// ── 3) Available sizes for a given color + gender ───────────────────────────

/**
 * Get the sizes available for a specific color and gender.
 * Returns `[]` if nothing is available.
 */
export function getAvailableSizesFor(
  product: Product,
  colorId: string,
  uiGender: BinaryGender,
): string[] {
  const cs = product.colorStock;
  if (!Array.isArray(cs) || cs.length === 0) {
    // No colorStock → all product sizes are "available"
    return product.sizes ?? [];
  }

  const item = cs.find((c) => c.id === colorId);
  if (!item) return [];

  const effectiveGender = getEffectiveGender(product.gender, uiGender);
  const genderStock = item.stock?.[effectiveGender];

  if (!genderStock || !genderStock.available) return [];
  return genderStock.sizes ?? [];
}

// ── 4) Full variant check ───────────────────────────────────────────────────

/**
 * Check if a specific color + size + gender combo is available.
 */
export function isVariantAvailable(
  product: Product,
  colorId: string,
  size: string,
  uiGender: BinaryGender,
): boolean {
  const available = getAvailableSizesFor(product, colorId, uiGender);
  return available.includes(size);
}

// ── 5) All possible sizes for a product (for rendering all toggles) ─────────

/**
 * Returns a sorted union of all sizes the product may have,
 * useful for rendering all size buttons (available + disabled).
 */
export function getAllProductSizes(product: Product): string[] {
  const cs = product.colorStock;
  if (!Array.isArray(cs) || cs.length === 0) {
    return product.sizes ?? [];
  }

  const sizeSet = new Set<string>();
  for (const item of cs) {
    for (const g of ['feminino', 'masculino'] as const) {
      const gs = item.stock?.[g];
      if (gs?.sizes) {
        for (const s of gs.sizes) sizeSet.add(s);
      }
    }
  }

  // Sort by the well-known order
  const order = ALL_SIZES as readonly string[];
  return [...sizeSet].sort(
    (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
              (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
  );
}
