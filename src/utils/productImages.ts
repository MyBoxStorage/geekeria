/**
 * Pure helpers for picking product images based on gender preference.
 */

import type { Product, ProductImage } from '@/types';

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
