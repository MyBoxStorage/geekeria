/**
 * Public Catalog Endpoints (read-only, no auth required)
 *
 * GET /api/catalog/products       — list products with filters, search, pagination
 * GET /api/catalog/products/:slug — get single product by slug
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendCachedJson } from '../../utils/httpCache.js';
import { sendError } from '../../utils/errorResponse.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Test-category products are internal-only and never served via public catalog. */
const isTestCategory = (c: string | null | undefined): boolean =>
  (c ?? '').toUpperCase() === 'TESTES';

// ─── Shared select (fields exposed to the public catalog) ───────────────────

const CATALOG_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  originalPrice: true,
  image: true,
  category: true,
  gender: true,
  sizes: true,
  colors: true,
  rating: true,
  reviews: true,
  badge: true,
  isNew: true,
  isBestseller: true,
  images: true,
  colorStock: true,
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function clampInt(value: string | undefined, fallback: number, max: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(n, max);
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'bestsellers';

function buildOrderBy(sort: string | undefined): Record<string, string>[] {
  switch (sort as SortOption) {
    case 'price-asc':
      return [{ price: 'asc' }];
    case 'price-desc':
      return [{ price: 'desc' }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'bestsellers':
      return [{ isBestseller: 'desc' }, { rating: 'desc' }];
    default:
      return [{ createdAt: 'desc' }];
  }
}

/**
 * Derive a fallback cover image from the `images` JSON when `image` is null.
 */
function deriveCoverImage(
  image: string | null,
  images: unknown,
): string | null {
  if (image) return image;
  if (!Array.isArray(images) || images.length === 0) return null;

  const preferred = images.find(
    (img: Record<string, unknown>) =>
      img && (img.type === 'product' || img.type === 'detail'),
  );
  const fallback = preferred ?? images[0];
  return (fallback as Record<string, unknown>)?.url as string ?? null;
}

// ─── GET /api/catalog/products ──────────────────────────────────────────────

export async function listCatalogProducts(req: Request, res: Response) {
  try {
    const {
      q,
      category,
      gender,
      sort,
      limit: limitRaw,
      offset: offsetRaw,
    } = req.query as Record<string, string | undefined>;

    const limit = clampInt(limitRaw, DEFAULT_LIMIT, MAX_LIMIT);
    const offset = clampInt(offsetRaw, 0, Number.MAX_SAFE_INTEGER);

    // Build Prisma `where` clause
    const where: Record<string, unknown> = {};

    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (gender && gender !== 'all') {
      if (gender === 'masculino' || gender === 'feminino') {
        // Include unissex products in gendered filters
        where.gender = { in: [gender, 'unissex'] };
      } else {
        where.gender = gender;
      }
    }

    // Always exclude test-category products from the public catalog
    where.NOT = { category: { equals: 'TESTES', mode: 'insensitive' } };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: CATALOG_SELECT,
        orderBy: buildOrderBy(sort),
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    // Post-process: derive cover image fallback
    const mapped = products.map((p) => ({
      ...p,
      image: deriveCoverImage(p.image, p.images),
    }));

    const payload = {
      ok: true,
      products: mapped,
      pagination: { limit, offset, total },
    };

    return sendCachedJson(req, res, payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error(`listCatalogProducts error: ${message}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao carregar catálogo.');
  }
}

// ─── GET /api/catalog/products/:slug ────────────────────────────────────────

export async function getCatalogProduct(req: Request, res: Response) {
  try {
    const rawSlug = req.params.slug;
    const slug = typeof rawSlug === 'string' ? rawSlug.trim() : '';

    if (!slug) {
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Slug é obrigatório.');
    }

    const product = await prisma.product.findFirst({
      where: { slug },
      select: CATALOG_SELECT,
    });

    if (!product) {
      return sendError(res, req, 404, 'NOT_FOUND', 'Produto não encontrado.');
    }

    // Test-category products are never served via the public catalog
    if (isTestCategory(product.category)) {
      return sendError(res, req, 404, 'NOT_FOUND', 'Produto não encontrado.');
    }

    const mapped = {
      ...product,
      image: deriveCoverImage(product.image, product.images),
    };

    const payload = { ok: true, product: mapped };

    return sendCachedJson(req, res, payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error(`getCatalogProduct error: ${message}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao carregar produto.');
  }
}
