/**
 * Admin Products API service
 * All calls require x-admin-token
 */

import { getJSON, postJSON, putJSON, uploadFile } from '@/services/api';

// ── Types ───────────────────────────────────────────────────────────────────

export interface AdminProductSummary {
  id: string;
  slug: string | null;
  name: string;
  price: number;
  image: string | null;
  category: string;
  gender: string;
  isNew: boolean;
  isBestseller: boolean;
  updatedAt: string;
}

export interface AdminProductFull {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  image: string | null;
  images: unknown;
  category: string;
  gender: string;
  sizes: string[];
  colors: string[];
  colorStock: unknown;
  stock: number;
  badge: string | null;
  isNew: boolean;
  isBestseller: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductListResponse {
  ok: boolean;
  products: AdminProductSummary[];
  pagination: { limit: number; offset: number; total: number };
}

export interface AdminProductDetailResponse {
  ok: boolean;
  product: AdminProductFull;
}

export interface StorageUploadResponse {
  ok: boolean;
  bucket: string;
  path: string;
  publicUrl: string;
}

export interface CatalogHealthCounts {
  total: number;
  withIssues: number;
  missingSlug: number;
  missingImage: number;
  invalidPrice: number;
  invalidCategory: number;
  invalidColorStock: number;
  derivedMismatch: number;
  testCategory: number;
}

export interface CatalogHealthItem {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  issues: string[];
}

export interface CatalogHealthResponse {
  ok: boolean;
  counts: CatalogHealthCounts;
  items: CatalogHealthItem[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { 'x-admin-token': token };
}

// ── API calls ───────────────────────────────────────────────────────────────

export async function adminListProducts(
  token: string,
  limit = 50,
  offset = 0,
): Promise<AdminProductListResponse> {
  return getJSON<AdminProductListResponse>(
    `/api/admin/products?limit=${limit}&offset=${offset}`,
    { headers: authHeaders(token) },
  );
}

export async function adminGetProduct(
  token: string,
  id: string,
): Promise<AdminProductDetailResponse> {
  return getJSON<AdminProductDetailResponse>(
    `/api/admin/products/${encodeURIComponent(id)}`,
    { headers: authHeaders(token) },
  );
}

export async function adminCreateProduct(
  token: string,
  payload: Record<string, unknown>,
): Promise<AdminProductDetailResponse> {
  return postJSON<AdminProductDetailResponse>(
    '/api/admin/products',
    payload,
    { headers: authHeaders(token) },
  );
}

export async function adminUpdateProduct(
  token: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<AdminProductDetailResponse> {
  return putJSON<AdminProductDetailResponse>(
    `/api/admin/products/${encodeURIComponent(id)}`,
    payload,
    { headers: authHeaders(token) },
  );
}

/**
 * Upload a single image file to Supabase Storage via the backend.
 */
export async function adminUploadImage(
  token: string,
  file: File,
  opts: { productId?: string; kind?: string; folder?: string },
): Promise<StorageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (opts.productId) formData.append('productId', opts.productId);
  if (opts.kind) formData.append('kind', opts.kind);
  if (opts.folder) formData.append('folder', opts.folder);

  return uploadFile<StorageUploadResponse>(
    '/api/admin/storage/upload',
    formData,
    { headers: authHeaders(token) },
  );
}

/**
 * Catalog health check — scans products for data-quality issues.
 */
export async function adminGetCatalogHealth(
  token: string,
): Promise<CatalogHealthResponse> {
  return getJSON<CatalogHealthResponse>(
    '/api/admin/catalog-health',
    { headers: authHeaders(token) },
  );
}
