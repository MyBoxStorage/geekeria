/**
 * Stock validation helpers for checkout.
 *
 * Validates whether a (color, size) combination is available for a product
 * based on its `color_stock` (jsonb) column in the database.
 *
 * When `colorStock` is null/absent, falls back to legacy `colors[]` + `sizes[]`.
 */

// ── Types (local, no frontend dependency) ───────────────────────────────────

interface GenderStock {
  available?: boolean;
  sizes?: string[];
}

interface ColorStockItem {
  id?: string;
  stock?: {
    feminino?: GenderStock;
    masculino?: GenderStock;
  };
}

// ── Parser ──────────────────────────────────────────────────────────────────

/**
 * Safely parse the raw `colorStock` jsonb value from Prisma/DB.
 * Returns an empty array if the value is not a valid array.
 */
export function parseColorStock(value: unknown): ColorStockItem[] {
  if (!Array.isArray(value)) return [];
  return value as ColorStockItem[];
}

// ── Main validation ─────────────────────────────────────────────────────────

export interface IsItemInStockArgs {
  /** Raw `colorStock` value from DB (Json? / unknown) */
  colorStock: unknown;
  /** Legacy `colors` array from products table */
  fallbackColors?: string[];
  /** Legacy `sizes` array from products table */
  fallbackSizes?: string[];
  /** Color ID sent by the client (e.g. "preto", "vinho") */
  color: string;
  /** Size sent by the client (e.g. "M", "GG") */
  size: string;
}

/**
 * Checks whether a (color, size) combination is available for a product.
 *
 * Rules:
 * 1. If `colorStock` is present and has an entry matching `color`:
 *    - The combo is valid if the `size` appears in **at least one** gender
 *      whose `available` is not explicitly `false`.
 *    - This is intentionally permissive (no explicit gender from client yet).
 *
 * 2. If `colorStock` is absent/empty or has no matching color entry:
 *    - Fall back to `fallbackColors` includes color AND `fallbackSizes` includes size.
 *    - If fallback arrays are missing/empty, return `true` (don't break legacy).
 */
export function isItemInStock(args: IsItemInStockArgs): boolean {
  const { colorStock, fallbackColors, fallbackSizes, color, size } = args;

  const parsed = parseColorStock(colorStock);

  if (parsed.length > 0) {
    const entry = parsed.find(
      (item) => item.id != null && item.id === color,
    );

    if (entry && entry.stock) {
      const { feminino, masculino } = entry.stock;

      const femOk =
        feminino &&
        feminino.available !== false &&
        Array.isArray(feminino.sizes) &&
        feminino.sizes.includes(size);

      const mascOk =
        masculino &&
        masculino.available !== false &&
        Array.isArray(masculino.sizes) &&
        masculino.sizes.includes(size);

      return !!(femOk || mascOk);
    }

    // colorStock exists but no matching color entry → not available
    return false;
  }

  // No colorStock — use legacy fallback
  if (
    (!fallbackColors || fallbackColors.length === 0) &&
    (!fallbackSizes || fallbackSizes.length === 0)
  ) {
    // No stock info at all — allow (don't break legacy products)
    return true;
  }

  const colorOk = !color || !fallbackColors || fallbackColors.length === 0 || fallbackColors.includes(color);
  const sizeOk = !size || !fallbackSizes || fallbackSizes.length === 0 || fallbackSizes.includes(size);

  return colorOk && sizeOk;
}

// ── Batch validator ─────────────────────────────────────────────────────────

export interface StockCheckItem {
  productId: string;
  color?: string;
  size?: string;
}

export interface ProductStockData {
  id: string;
  colorStock: unknown;
  colors: string[];
  sizes: string[];
}

export interface StockViolation {
  productId: string;
  color: string;
  size: string;
}

/**
 * Validates a list of order items against product stock data.
 * Returns an array of violations (empty = all valid).
 */
export function validateItemsStock(
  items: StockCheckItem[],
  productMap: Map<string, ProductStockData>,
): StockViolation[] {
  const violations: StockViolation[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      // Product not found — will be caught separately as PRODUCT_NOT_FOUND
      continue;
    }

    const color = item.color ?? '';
    const size = item.size ?? '';

    // Skip validation if neither color nor size was specified
    if (!color && !size) continue;

    const valid = isItemInStock({
      colorStock: product.colorStock,
      fallbackColors: product.colors,
      fallbackSizes: product.sizes,
      color,
      size,
    });

    if (!valid) {
      violations.push({
        productId: item.productId,
        color,
        size,
      });
    }
  }

  return violations;
}
