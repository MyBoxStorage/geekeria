/**
 * Catalog Service — fetches products from the backend API.
 *
 * `fetchCatalogProductsAPI` throws on failure so the caller (hook)
 * can decide whether to use cache or local fallback.
 *
 * Legacy `fetchCatalogProducts` is kept for backward-compat but now
 * just wraps the new function with a local-data catch.
 */

import { getJSON } from '@/services/api';
import { allProducts as localProducts } from '@/data/products';
import type { Product } from '@/types';

const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

// ── Response types ──────────────────────────────────────────────────────────

export interface CatalogPagination {
  limit: number;
  offset: number;
  total: number;
}

export interface CatalogListResponse {
  ok: true;
  products: Product[];
  pagination: CatalogPagination;
}

export interface CatalogDetailResponse {
  ok: true;
  product: Product;
}

/** Shape returned by both API and cache-aware callers */
export interface CatalogResult {
  products: Product[];
  pagination: CatalogPagination;
  source: 'api' | 'local';
}

// ── Query params ────────────────────────────────────────────────────────────

export interface CatalogQueryParams {
  q?: string;
  category?: string;
  gender?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildQueryString(params: CatalogQueryParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.gender && params.gender !== 'all') qs.set('gender', params.gender);
  if (params.sort) qs.set('sort', params.sort);
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch products from the API — THROWS on failure.
 * Used by the hook to distinguish "API OK" from "API failed".
 */
export async function fetchCatalogProductsAPI(
  params: CatalogQueryParams = {},
): Promise<{ products: Product[]; pagination: CatalogPagination }> {
  const qs = buildQueryString(params);
  const data = await getJSON<CatalogListResponse>(`/api/catalog/products${qs}`);

  if (data.ok && Array.isArray(data.products)) {
    return { products: data.products, pagination: data.pagination };
  }

  throw new Error('Unexpected API response shape');
}

/**
 * Legacy wrapper — fetches products with automatic local fallback.
 * Kept for any callers that don't need cache awareness.
 */
export async function fetchCatalogProducts(
  params: CatalogQueryParams = {},
): Promise<CatalogResult> {
  try {
    const { products, pagination } = await fetchCatalogProductsAPI(params);
    return { products, pagination, source: 'api' };
  } catch (err) {
    if (IS_DEV) {
      console.warn('[catalog] API unavailable, using local fallback', err);
    }
    return {
      products: localProducts,
      pagination: { limit: localProducts.length, offset: 0, total: localProducts.length },
      source: 'local',
    };
  }
}

/**
 * Fetch a single product by slug from the backend.
 * Returns `null` if the product doesn't exist or the API is down.
 */
export async function fetchCatalogProductBySlug(
  slug: string,
): Promise<{ product: Product | null; source: 'api' | 'local' }> {
  try {
    const data = await getJSON<CatalogDetailResponse>(
      `/api/catalog/products/${encodeURIComponent(slug)}`,
    );

    if (data.ok && data.product) {
      return { product: data.product, source: 'api' };
    }

    return { product: null, source: 'api' };
  } catch (err) {
    if (IS_DEV) {
      console.warn('[catalog] Slug fetch failed, trying local fallback', err);
    }

    const local = localProducts.find(
      (p) => p.slug === slug || p.id === slug,
    ) ?? null;

    return { product: local, source: 'local' };
  }
}
