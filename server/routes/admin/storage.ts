/**
 * POST /api/admin/storage/upload
 *
 * Upload product images to Supabase Storage (bucket: products).
 * Protected by x-admin-token (same as all admin routes).
 *
 * Accepts multipart/form-data:
 *   - file       (required) — the image file (jpeg/png/webp/gif, max 5 MB)
 *   - folder     (optional) — bucket sub-folder, default "products"
 *   - productId  (optional) — used to organise path
 *   - kind       (optional) — e.g. "model_m", "model_f", "color", "detail"
 *
 * Returns:
 *   { ok, bucket, path, publicUrl }
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { getSupabaseAdmin } from '../../utils/supabaseAdmin.js';
import { logger } from '../../utils/logger.js';
import { sendError } from '../../utils/errorResponse.js';

const BUCKET = 'products';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Multer: memory storage (buffer → Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use jpeg, png, webp ou gif.`));
    }
  },
});

/** Middleware that accepts a single file field called "file". */
export const uploadMiddleware = upload.single('file');

/**
 * Sanitise filename: lowercase, remove accents/special chars, keep extension.
 */
function safeFileName(original: string): string {
  const ext = path.extname(original).toLowerCase() || '.png';
  const base = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9_-]/g, '_')   // keep alphanumeric, _, -
    .replace(/_+/g, '_')            // collapse multiple _
    .slice(0, 60);                  // limit length
  return `${base}${ext}`;
}

export async function uploadProductImage(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Nenhum arquivo enviado. Use o campo "file".');
    }

    const folder = (req.body.folder as string) || 'products';
    const productId = (req.body.productId as string) || 'unassigned';
    const kind = (req.body.kind as string) || 'image';

    const timestamp = Date.now();
    const safe = safeFileName(file.originalname);
    const storagePath = `${folder}/${productId}/${kind}/${timestamp}-${safe}`;

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error(`Supabase Storage upload failed: ${error.message}`);
      return sendError(res, req, 500, 'UPLOAD_ERROR', 'Erro no upload do arquivo.');
    }

    // Build public URL (bucket is public)
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    logger.info(`Image uploaded: ${storagePath} → ${publicUrl}`);

    return res.status(200).json({
      ok: true,
      bucket: BUCKET,
      path: storagePath,
      publicUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error(`Upload handler error: ${message}`);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro no processamento do upload.');
  }
}
