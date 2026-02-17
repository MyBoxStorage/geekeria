/**
 * Pure function to build the product payload for the backend API
 * from the admin draft form data.
 */

// ── Types matching DraftProduct/ColorStock from ProductAdmin ────────────────

interface DraftImageInput {
  id: string;
  file?: File;
  preview: string;
  type: 'model' | 'product' | 'detail';
  gender?: 'masculino' | 'feminino';
  isMain: boolean;
}

interface GenderStockInput {
  enabled: boolean;
  sizes: Record<string, boolean>;
}

interface ColorStockInput {
  colorId: string;
  image: DraftImageInput | null;
  feminino: GenderStockInput;
  masculino: GenderStockInput;
}

interface DraftProductInput {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  image: string;
  category: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  sizes: string[];
  colors: string[];
  colorStock: ColorStockInput[];
  badge: string;
  isNew: boolean;
  isBestseller: boolean;
  rating: string;
  reviews: string;
}

// Color metadata map
interface ColorDef {
  id: string;
  name: string;
  hex: string;
}

const SIZES_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

// ── Upload URLs map ─────────────────────────────────────────────────────────

/**
 * Maps DraftImage.id → uploaded public URL.
 * Built during the upload phase before calling buildProductPayload.
 */
export type UploadedUrlsMap = Map<string, string>;

// ── Main builder ────────────────────────────────────────────────────────────

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  slug: string;
  gender: string;
  category: string;
  image: string | null;
  images: Array<{
    url: string;
    alt: string;
    type: string;
    gender?: string;
  }>;
  colorStock: Array<{
    id: string;
    name: string;
    hex: string;
    image: string | null;
    stock: {
      feminino: { available: boolean; sizes: string[] };
      masculino: { available: boolean; sizes: string[] };
    };
  }>;
  badge: string | null;
  isNew: boolean;
  isBestseller: boolean;
  rating: number;
  reviews: number;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Builds the product API payload from the admin form draft.
 *
 * @param draft - The form state from ProductAdmin
 * @param images - The DraftImage array (model/product/detail images)
 * @param uploadedUrls - Map of DraftImage.id → publicUrl (from upload step)
 * @param colorDefs - Color definitions (id, name, hex) for enriching colorStock
 */
export function buildProductPayload(
  draft: DraftProductInput,
  images: DraftImageInput[],
  uploadedUrls: UploadedUrlsMap,
  colorDefs: readonly ColorDef[],
): ProductPayload {
  const slug = generateSlug(draft.name);

  // Build images array from uploaded URLs
  const typedImages = images.map((img) => {
    const url = uploadedUrls.get(img.id) || img.preview;
    return {
      url,
      alt:
        img.type === 'model' && img.gender
          ? `Modelo ${img.gender} usando ${draft.name}`
          : img.type === 'detail'
            ? `Detalhe ${draft.name}`
            : draft.name,
      type: img.type,
      gender: img.gender,
    };
  });

  // Active colors (at least one gender enabled)
  const activeColors = draft.colorStock.filter(
    (cs) => cs.feminino.enabled || cs.masculino.enabled,
  );

  // Build color images from uploaded URLs
  const colorImages = activeColors
    .filter((cs) => cs.image)
    .map((cs) => {
      const url = cs.image ? (uploadedUrls.get(cs.image.id) || cs.image.preview) : '';
      return {
        url,
        alt: draft.name,
        type: 'product' as const,
        gender: undefined,
      };
    })
    .filter((ci) => ci.url);

  const allImages = [...typedImages, ...colorImages];

  // Cover image: main image or derive from list
  const mainImg = images.find((i) => i.isMain);
  const mainIdx = mainImg ? images.indexOf(mainImg) : 0;
  let coverImage: string | null = null;
  if (allImages.length > 0) {
    coverImage = typedImages[mainIdx]?.url ?? allImages[0]?.url ?? null;
  } else if (draft.image) {
    coverImage = draft.image;
  }

  // Build colorStock for DB
  const colorStock = activeColors.map((cs) => {
    const def = colorDefs.find((c) => c.id === cs.colorId);
    const colorImgUrl = cs.image
      ? (uploadedUrls.get(cs.image.id) || cs.image.preview)
      : null;

    return {
      id: cs.colorId,
      name: def?.name ?? cs.colorId,
      hex: def?.hex ?? '#000000',
      image: colorImgUrl,
      stock: {
        feminino: {
          available: cs.feminino.enabled,
          sizes: SIZES_ORDER.filter((sz) => cs.feminino.sizes[sz]),
        },
        masculino: {
          available: cs.masculino.enabled,
          sizes: SIZES_ORDER.filter((sz) => cs.masculino.sizes[sz]),
        },
      },
    };
  });

  return {
    name: draft.name,
    description: draft.description,
    price: parseFloat(draft.price) || 0,
    originalPrice: draft.originalPrice ? parseFloat(draft.originalPrice) : null,
    slug,
    gender: draft.gender,
    category: draft.category,
    image: coverImage,
    images: allImages,
    colorStock,
    badge: draft.badge || null,
    isNew: draft.isNew,
    isBestseller: draft.isBestseller,
    rating: parseFloat(draft.rating) || 4.8,
    reviews: parseInt(draft.reviews, 10) || 0,
  };
}

/**
 * Collect all File objects that need uploading (model/detail images + color swatch images).
 * Returns array of { id, file, kind, productSlug } for the upload loop.
 */
export function collectFilesToUpload(
  images: DraftImageInput[],
  colorStock: ColorStockInput[],
  productSlug: string,
): Array<{ id: string; file: File; kind: string }> {
  const files: Array<{ id: string; file: File; kind: string }> = [];

  for (const img of images) {
    if (img.file) {
      const kind =
        img.type === 'model' && img.gender
          ? `model_${img.gender.charAt(0)}`
          : img.type;
      files.push({ id: img.id, file: img.file, kind });
    }
  }

  for (const cs of colorStock) {
    if (cs.image?.file) {
      files.push({
        id: cs.image.id,
        file: cs.image.file,
        kind: `color_${cs.colorId}`,
      });
    }
  }

  return files;
}
