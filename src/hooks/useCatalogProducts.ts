/**
 * Hook that loads catalog products with:
 *  1. Param-aware cache from sessionStorage (instant render per query)
 *  2. SWR — background refresh even when cache is valid
 *  3. Local fallback only when API fails AND no cache exists
 *
 * When called without params (FeaturedProducts, ProductSelector),
 * defaults to { limit: 100, offset: 0 } — backward compatible.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchCatalogProductsAPI,
  type CatalogQueryParams,
  type CatalogPagination,
} from '@/services/catalog';
import { allProducts as localProducts } from '@/data/products';
import type { Product } from '@/types';

// ── Cache config ────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'bb_catalog_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CatalogCacheEntry {
  version: 1;
  savedAt: number;
  products: Product[];
  pagination: CatalogPagination;
}

/** Build a stable, deterministic key string from query params. */
function computeParamsKey(params: CatalogQueryParams | undefined): string {
  if (!params) return 'default';
  const entries: [string, string | number][] = [];
  if (params.q) entries.push(['q', params.q]);
  if (params.category && params.category !== 'all') entries.push(['category', params.category]);
  if (params.gender) entries.push(['gender', params.gender]);
  if (params.sort) entries.push(['sort', params.sort]);
  if (params.limit != null) entries.push(['limit', params.limit]);
  if (params.offset != null) entries.push(['offset', params.offset]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries.length > 0 ? JSON.stringify(Object.fromEntries(entries)) : 'default';
}

function cacheKeyFor(paramsKey: string): string {
  return `${CACHE_PREFIX}:${paramsKey}`;
}

function readCache(key: string): CatalogCacheEntry | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as CatalogCacheEntry).version !== 1 ||
      !Array.isArray((parsed as CatalogCacheEntry).products)
    ) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed as CatalogCacheEntry;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

function writeCache(key: string, products: Product[], pagination: CatalogPagination): void {
  try {
    const payload: CatalogCacheEntry = {
      version: 1,
      savedAt: Date.now(),
      products,
      pagination,
    };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function isCacheValid(cache: CatalogCacheEntry): boolean {
  return Date.now() - cache.savedAt < CACHE_TTL_MS;
}

// One-time cleanup of legacy cache key from previous implementation
try { sessionStorage.removeItem('bb_catalog_cache_v1'); } catch { /* noop */ }

// ── Hook ─────────────────────────────────────────────────────────────────────

const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

export type CatalogSource = 'api' | 'cache' | 'local';

interface UseCatalogProductsReturn {
  products: Product[];
  pagination: CatalogPagination;
  isLoading: boolean;
  source: CatalogSource;
  refresh: () => void;
}

export function useCatalogProducts(params?: CatalogQueryParams): UseCatalogProductsReturn {
  const paramsKey = computeParamsKey(params);
  const cacheKey = cacheKeyFor(paramsKey);
  const effectiveParams: CatalogQueryParams = params ?? { limit: 100, offset: 0 };

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<CatalogPagination>({ limit: 0, offset: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<CatalogSource>('local');

  useEffect(() => {
    let cancelled = false;

    // 1) Check cache for current params
    const cache = readCache(cacheKey);
    const hasFreshCache = !!(cache && isCacheValid(cache));

    if (hasFreshCache) {
      setProducts(cache!.products);
      setPagination(cache!.pagination);
      setSource('cache');
      setIsLoading(false);
    } else {
      setProducts([]);
      setPagination({ limit: 0, offset: 0, total: 0 });
      setIsLoading(true);
    }

    // 2) Always fetch (SWR when cache exists, fresh otherwise)
    fetchCatalogProductsAPI(effectiveParams)
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products);
        setPagination(result.pagination);
        setSource('api');
        writeCache(cacheKey, result.products, result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        if (IS_DEV) {
          console.warn('[catalog] API unavailable', err);
        }
        // Only apply local fallback if we have no data at all
        if (!hasFreshCache) {
          setProducts(localProducts);
          setPagination({
            limit: localProducts.length,
            offset: 0,
            total: localProducts.length,
          });
          setSource('local');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-run when params change (paramsKey is a stable serialization)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchCatalogProductsAPI(effectiveParams)
      .then((result) => {
        setProducts(result.products);
        setPagination(result.pagination);
        setSource('api');
        writeCache(cacheKey, result.products, result.pagination);
      })
      .catch((err) => {
        if (IS_DEV) {
          console.warn('[catalog] refresh failed', err);
        }
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return { products, pagination, isLoading, source, refresh };
}
