/**
 * Admin Catalog Health Check
 *
 * GET /api/admin/catalog-health
 * Auth: x-admin-token
 *
 * Scans up to 500 products and reports data-quality issues.
 */

import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendError } from '../../utils/errorResponse.js';

// ── Issue codes ──────────────────────────────────────────────────────────────

type IssueCode =
  | 'MISSING_SLUG'
  | 'MISSING_IMAGE'
  | 'INVALID_PRICE'
  | 'INVALID_CATEGORY'
  | 'INVALID_COLOR_STOCK'
  | 'DERIVED_MISMATCH'
  | 'TEST_CATEGORY';

// ── Select shape ─────────────────────────────────────────────────────────────

const HEALTH_SELECT = {
  id: true,
  name: true,
  slug: true,
  category: true,
  price: true,
  image: true,
  images: true,
  colorStock: true,
  gender: true,
  sizes: true,
  colors: true,
  isNew: true,
  isBestseller: true,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasValidImageUrl(images: unknown): boolean {
  if (!Array.isArray(images) || images.length === 0) return false;
  return images.some(
    (img) =>
      img &&
      typeof img === 'object' &&
      typeof (img as Record<string, unknown>).url === 'string' &&
      ((img as Record<string, unknown>).url as string).length > 0,
  );
}

function validateColorStock(colorStock: unknown): boolean {
  if (colorStock === null || colorStock === undefined) return true;
  if (!Array.isArray(colorStock)) return false;

  for (const item of colorStock) {
    if (!item || typeof item !== 'object') return false;
    const cs = item as Record<string, unknown>;
    if (typeof cs.id !== 'string' || !cs.id) return false;

    const stock = cs.stock as Record<string, unknown> | undefined;
    if (!stock || typeof stock !== 'object') continue;

    for (const gender of ['feminino', 'masculino'] as const) {
      const gs = stock[gender] as Record<string, unknown> | undefined;
      if (!gs || typeof gs !== 'object') continue;
      if (gs.available === true) {
        if (!Array.isArray(gs.sizes) || gs.sizes.length === 0) return false;
      }
    }
  }

  return true;
}

function hasDerivedMismatch(
  colorStock: unknown,
  sizes: unknown,
  colors: unknown,
): boolean {
  if (!Array.isArray(colorStock) || colorStock.length === 0) return false;
  const hasActiveColor = colorStock.some((cs) => {
    if (!cs || typeof cs !== 'object') return false;
    const item = cs as Record<string, unknown>;
    const stock = item.stock as Record<string, unknown> | undefined;
    if (!stock) return false;
    const fem = stock.feminino as Record<string, unknown> | undefined;
    const masc = stock.masculino as Record<string, unknown> | undefined;
    return fem?.available === true || masc?.available === true;
  });
  if (!hasActiveColor) return false;

  const sizesEmpty = !Array.isArray(sizes) || sizes.length === 0;
  const colorsEmpty = !Array.isArray(colors) || colors.length === 0;
  return sizesEmpty || colorsEmpty;
}

// ── Handler ──────────────────────────────────────────────────────────────────

const MAX_ITEMS_RESPONSE = 50;

export async function getCatalogHealth(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      select: HEALTH_SELECT,
      take: 500,
      orderBy: { updatedAt: 'desc' },
    });

    const counts = {
      total: products.length,
      withIssues: 0,
      missingSlug: 0,
      missingImage: 0,
      invalidPrice: 0,
      invalidCategory: 0,
      invalidColorStock: 0,
      derivedMismatch: 0,
      testCategory: 0,
    };

    const itemsWithIssues: Array<{
      id: string;
      name: string;
      slug: string | null;
      category: string;
      issues: IssueCode[];
    }> = [];

    for (const p of products) {
      const issues: IssueCode[] = [];

      if (!p.slug || p.slug.trim() === '') {
        issues.push('MISSING_SLUG');
        counts.missingSlug++;
      }

      if (
        (!p.image || p.image.trim() === '') &&
        !hasValidImageUrl(p.images)
      ) {
        issues.push('MISSING_IMAGE');
        counts.missingImage++;
      }

      if (p.price <= 0) {
        issues.push('INVALID_PRICE');
        counts.invalidPrice++;
      }

      if (!p.category || p.category.trim() === '') {
        issues.push('INVALID_CATEGORY');
        counts.invalidCategory++;
      }

      if (!validateColorStock(p.colorStock)) {
        issues.push('INVALID_COLOR_STOCK');
        counts.invalidColorStock++;
      }

      if (hasDerivedMismatch(p.colorStock, p.sizes, p.colors)) {
        issues.push('DERIVED_MISMATCH');
        counts.derivedMismatch++;
      }

      if ((p.category ?? '').toUpperCase() === 'TESTES') {
        issues.push('TEST_CATEGORY');
        counts.testCategory++;
      }

      if (issues.length > 0) {
        counts.withIssues++;
        itemsWithIssues.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          issues,
        });
      }
    }

    itemsWithIssues.sort((a, b) => b.issues.length - a.issues.length);

    return res.json({
      ok: true,
      counts,
      items: itemsWithIssues.slice(0, MAX_ITEMS_RESPONSE),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`getCatalogHealth: ${msg}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao verificar catálogo.');
  }
}
