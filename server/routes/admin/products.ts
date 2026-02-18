/**
 * Admin Product CRUD endpoints (protected by x-admin-token)
 *
 * GET    /api/admin/products      — list products (paginated)
 * GET    /api/admin/products/:id  — get single product
 * POST   /api/admin/products      — create product
 * PUT    /api/admin/products/:id  — update product
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendError } from '../../utils/errorResponse.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Test-category products must not be created/edited via admin. */
const isTestCategory = (c: string | null | undefined): boolean =>
  (c ?? '').toUpperCase() === 'TESTES';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function clampInt(value: string | undefined, fallback: number, max: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(n, max);
}

/**
 * Derive a cover image URL from the images array when `image` is not provided.
 */
function deriveCoverImage(
  image: string | null | undefined,
  images: unknown,
): string | null {
  if (image) return image;
  if (!Array.isArray(images) || images.length === 0) return null;

  const preferred = images.find(
    (img: Record<string, unknown>) =>
      img && (img.type === 'product' || img.type === 'detail'),
  );
  if (preferred?.url) return preferred.url as string;

  const model = images.find(
    (img: Record<string, unknown>) => img && img.type === 'model',
  );
  if (model?.url) return model.url as string;

  const first = images[0];
  return (first as Record<string, unknown>)?.url as string ?? null;
}

/**
 * Derive sizes and colors arrays from colorStock when present.
 */
function deriveFromColorStock(
  colorStock: unknown,
  fallbackSizes: string[],
  fallbackColors: string[],
): { sizes: string[]; colors: string[] } {
  if (!Array.isArray(colorStock) || colorStock.length === 0) {
    return { sizes: fallbackSizes ?? [], colors: fallbackColors ?? [] };
  }

  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();

  for (const item of colorStock) {
    if (!item || typeof item !== 'object') continue;
    const c = item as Record<string, unknown>;
    if (typeof c.id === 'string') colorSet.add(c.id);

    const stock = c.stock as Record<string, unknown> | undefined;
    if (!stock) continue;

    for (const gender of ['feminino', 'masculino'] as const) {
      const gs = stock[gender] as Record<string, unknown> | undefined;
      if (!gs || !gs.available) continue;
      const sizes = gs.sizes;
      if (Array.isArray(sizes)) {
        for (const s of sizes) {
          if (typeof s === 'string') sizeSet.add(s);
        }
      }
    }
  }

  const KNOWN_SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  const sortedSizes = [...sizeSet].sort(
    (a, b) =>
      (KNOWN_SIZE_ORDER.indexOf(a) === -1 ? 99 : KNOWN_SIZE_ORDER.indexOf(a)) -
      (KNOWN_SIZE_ORDER.indexOf(b) === -1 ? 99 : KNOWN_SIZE_ORDER.indexOf(b)),
  );

  return {
    sizes: sortedSizes.length > 0 ? sortedSizes : fallbackSizes ?? [],
    colors: colorSet.size > 0 ? [...colorSet] : fallbackColors ?? [],
  };
}

// ── Select shapes ───────────────────────────────────────────────────────────

const LIST_SELECT = {
  id: true,
  slug: true,
  name: true,
  price: true,
  image: true,
  category: true,
  gender: true,
  isNew: true,
  isBestseller: true,
  updatedAt: true,
};

const FULL_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  originalPrice: true,
  image: true,
  images: true,
  category: true,
  gender: true,
  sizes: true,
  colors: true,
  colorStock: true,
  stock: true,
  badge: true,
  isNew: true,
  isBestseller: true,
  rating: true,
  reviews: true,
  createdAt: true,
  updatedAt: true,
};

// ── GET /api/admin/products ─────────────────────────────────────────────────

export async function listAdminProducts(req: Request, res: Response) {
  try {
    const limit = clampInt(req.query.limit as string | undefined, 50, 100);
    const offset = clampInt(req.query.offset as string | undefined, 0, Number.MAX_SAFE_INTEGER);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        select: LIST_SELECT,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.product.count(),
    ]);

    return res.json({
      ok: true,
      products,
      pagination: { limit, offset, total },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`listAdminProducts: ${msg}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao listar produtos.');
  }
}

// ── GET /api/admin/products/:id ─────────────────────────────────────────────

export async function getAdminProduct(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === 'string' ? rawId.trim() : '';
    if (!id) return sendError(res, req, 400, 'VALIDATION_ERROR', 'ID obrigatório.');

    const product = await prisma.product.findUnique({
      where: { id },
      select: FULL_SELECT,
    });

    if (!product) {
      return sendError(res, req, 404, 'NOT_FOUND', 'Produto não encontrado.');
    }

    return res.json({ ok: true, product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`getAdminProduct: ${msg}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar produto.');
  }
}

// ── POST /api/admin/products ────────────────────────────────────────────────

export async function createAdminProduct(req: Request, res: Response) {
  try {
    const body = req.body;

    if (!body.name || body.price == null || !body.category) {
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Campos obrigatórios: name, price, category.');
    }

    if (isTestCategory(body.category)) {
      return sendError(res, req, 400, 'CATEGORY_NOT_ALLOWED', "Categoria 'TESTES' não é permitida no app principal.");
    }

    // Do not accept custom IDs on create
    if (body.id) {
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Não envie "id" ao criar produto. O ID é gerado automaticamente.');
    }

    const slug = body.slug || generateSlug(body.name);
    const { sizes, colors } = deriveFromColorStock(
      body.colorStock,
      body.sizes ?? [],
      body.colors ?? [],
    );
    const image = deriveCoverImage(body.image, body.images);

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description ?? '',
        price: typeof body.price === 'number' ? body.price : parseFloat(body.price) || 0,
        originalPrice: body.originalPrice != null
          ? (typeof body.originalPrice === 'number' ? body.originalPrice : parseFloat(body.originalPrice) || null)
          : null,
        slug,
        gender: body.gender || 'unissex',
        image,
        images: body.images ?? null,
        colorStock: body.colorStock ?? null,
        category: body.category,
        sizes,
        colors,
        badge: body.badge || null,
        isNew: body.isNew === true,
        isBestseller: body.isBestseller === true,
        rating: typeof body.rating === 'number' ? body.rating : parseFloat(body.rating) || 4.8,
        reviews: typeof body.reviews === 'number' ? body.reviews : parseInt(body.reviews, 10) || 0,
        stock: body.stock ?? 0,
      },
      select: FULL_SELECT,
    });

    logger.info(`Product created: ${product.id} (${product.name})`);
    return res.status(201).json({ ok: true, product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`createAdminProduct: ${msg}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao criar produto.');
  }
}

// ── PUT /api/admin/products/:id ─────────────────────────────────────────────

export async function updateAdminProduct(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === 'string' ? rawId.trim() : '';
    if (!id) return sendError(res, req, 400, 'VALIDATION_ERROR', 'ID obrigatório.');

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return sendError(res, req, 404, 'NOT_FOUND', 'Produto não encontrado.');
    }

    const body = req.body;

    if (body.category !== undefined && isTestCategory(body.category)) {
      return sendError(res, req, 400, 'CATEGORY_NOT_ALLOWED', "Categoria 'TESTES' não é permitida no app principal.");
    }

    const data: Record<string, unknown> = {};

    // Only set fields that were explicitly sent
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) {
      data.price = typeof body.price === 'number' ? body.price : parseFloat(body.price) || 0;
    }
    if (body.originalPrice !== undefined) {
      data.originalPrice = body.originalPrice != null
        ? (typeof body.originalPrice === 'number' ? body.originalPrice : parseFloat(body.originalPrice) || null)
        : null;
    }
    if (body.slug !== undefined) data.slug = body.slug || (body.name ? generateSlug(body.name) : undefined);
    if (body.gender !== undefined) data.gender = body.gender;
    if (body.category !== undefined) data.category = body.category;
    if (body.image !== undefined) data.image = body.image;
    if (body.images !== undefined) data.images = body.images;
    if (body.colorStock !== undefined) data.colorStock = body.colorStock;
    if (body.badge !== undefined) data.badge = body.badge || null;
    if (body.isNew !== undefined) data.isNew = body.isNew === true;
    if (body.isBestseller !== undefined) data.isBestseller = body.isBestseller === true;
    if (body.rating !== undefined) {
      data.rating = typeof body.rating === 'number' ? body.rating : parseFloat(body.rating) || 4.8;
    }
    if (body.reviews !== undefined) {
      data.reviews = typeof body.reviews === 'number' ? body.reviews : parseInt(body.reviews, 10) || 0;
    }

    // Re-derive sizes/colors/cover if colorStock or images changed
    if (body.colorStock !== undefined || body.sizes !== undefined || body.colors !== undefined) {
      const { sizes, colors } = deriveFromColorStock(
        body.colorStock ?? undefined,
        body.sizes ?? [],
        body.colors ?? [],
      );
      data.sizes = sizes;
      data.colors = colors;
    }

    if (body.images !== undefined && body.image === undefined) {
      data.image = deriveCoverImage(null, body.images);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      select: FULL_SELECT,
    });

    logger.info(`Product updated: ${product.id} (${product.name})`);
    return res.json({ ok: true, product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`updateAdminProduct: ${msg}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao atualizar produto.');
  }
}
