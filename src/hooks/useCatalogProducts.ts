/**
 * Hook that loads catalog products from the backend API,
 * with automatic fallback to local hardcoded data.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchCatalogProducts,
  type CatalogQueryParams,
  type CatalogPagination,
} from '@/services/catalog';
import { allProducts as localProducts } from '@/data/products';
import type { Product } from '@/types';

interface UseCatalogProductsReturn {
  /** Product list (from API or fallback) */
  products: Product[];
  /** Pagination metadata */
  pagination: CatalogPagination;
  /** Whether the initial load is still running */
  isLoading: boolean;
  /** 'api' if data came from backend, 'local' if using fallback */
  source: 'api' | 'local';
  /** Re-fetch (e.g. after params change) */
  refresh: () => void;
}

export function useCatalogProducts(): UseCatalogProductsReturn {
  // Start with local data so the page is never blank
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [pagination, setPagination] = useState<CatalogPagination>({
    limit: localProducts.length,
    offset: 0,
    total: localProducts.length,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'local'>('local');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all products (large limit) — filtering is done client-side
      // via useProductFilters for instant UX
      const params: CatalogQueryParams = { limit: 100, offset: 0 };
      const result = await fetchCatalogProducts(params);

      setProducts(result.products);
      setPagination(result.pagination);
      setSource(result.source);
    } catch {
      // fetchCatalogProducts already handles fallback internally,
      // but just in case:
      setProducts(localProducts);
      setSource('local');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { products, pagination, isLoading, source, refresh: load };
}
