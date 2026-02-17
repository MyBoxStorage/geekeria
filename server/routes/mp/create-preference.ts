/**
 * POST /api/mp/create-preference
 *
 * Creates a Mercado Pago Checkout Preference for an **existing** Order.
 *
 * The Order + OrderItems must already exist (created via POST /api/checkout/create-order).
 * This endpoint:
 *   1. Looks up the Order by `externalReference` (or `orderId`)
 *   2. Loads its OrderItems + Product names
 *   3. Creates the preference on Mercado Pago
 *   4. Saves `mpPreferenceId` back to the Order
 *   5. Returns { preferenceId, initPoint } to the frontend
 *
 * Body:
 * {
 *   externalReference?: string,   // preferred lookup key
 *   orderId?: string,             // fallback lookup key
 *   // Legacy fields (ignored if order found — kept for compat logging)
 *   items?: ..., payer?: ..., amount?: ..., shipping?: ...
 * }
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { errorMeta } from '../../utils/logging.js';

// ── Validation schema ───────────────────────────────────────────────────────

const createPreferenceSchema = z.object({
  externalReference: z.string().optional(),
  orderId: z.string().optional(),
  // Legacy fields — accepted but not used for order creation
  items: z.array(z.any()).optional(),
  payer: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    zipCode: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  amount: z.number().optional(),
  shipping: z.number().optional(),
}).refine(
  (data) => data.externalReference || data.orderId,
  { message: 'externalReference ou orderId é obrigatório. Crie o pedido primeiro via /api/checkout/create-order.' },
);

// ── Handler ─────────────────────────────────────────────────────────────────

export async function createPreference(req: Request, res: Response) {
  try {
    // Validate input
    const validationResult = createPreferenceSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn('create-preference called without order reference', {
        body: Object.keys(req.body),
        errors: validationResult.error.issues,
      });
      return res.status(400).json({
        ok: false,
        error: 'MISSING_ORDER_REFERENCE',
        message: 'externalReference ou orderId é obrigatório. Crie o pedido primeiro via POST /api/checkout/create-order.',
        details: validationResult.error.issues,
      });
    }

    const { externalReference, orderId } = validationResult.data;

    // ── 1. Look up existing Order ───────────────────────────────────────

    const order = await prisma.order.findFirst({
      where: externalReference
        ? { externalReference }
        : { id: orderId! },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      logger.warn(`create-preference: order not found (extRef=${externalReference}, id=${orderId})`);
      return res.status(404).json({
        ok: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Pedido não encontrado. Crie o pedido primeiro via POST /api/checkout/create-order.',
      });
    }

    // ── 2. Check Mercado Pago Access Token ──────────────────────────────

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      logger.error('MP_ACCESS_TOKEN não configurado');
      return res.status(500).json({
        ok: false,
        error: 'Server configuration error',
        message: 'Mercado Pago access token not configured',
      });
    }

    // ── 3. Build preference from Order data ─────────────────────────────

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const preferenceData = {
      items: order.items.map((item) => ({
        id: item.productId,
        title: `${item.product?.name || `Produto ${item.productId}`}${item.size ? ` - ${item.size}` : ''}${item.color ? ` - ${item.color}` : ''}`,
        description: item.product?.description || item.product?.name || `Produto ${item.productId}`,
        picture_url: item.product?.image
          ? (item.product.image.startsWith('http') ? item.product.image : `${frontendUrl}${item.product.image}`)
          : undefined,
        category_id: 'fashion',
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      payer: {
        name: order.payerName || 'Cliente',
        surname: (order.payerName || '').split(' ').slice(1).join(' ') || '',
        email: order.payerEmail,
        ...(order.payerCpf && {
          identification: {
            type: order.payerCpf.length === 11 ? 'CPF' : 'CNPJ',
            number: order.payerCpf.replace(/\D/g, ''),
          },
        }),
        ...(order.payerPhone && {
          phone: {
            area_code: order.payerPhone.replace(/\D/g, '').substring(0, 2) || '11',
            number: order.payerPhone.replace(/\D/g, '').substring(2) || '',
          },
        }),
      },
      external_reference: order.externalReference,
      statement_descriptor: 'BRAVOS BRASIL',
      back_urls: {
        success: `${frontendUrl}/checkout/success`,
        failure: `${frontendUrl}/checkout/failure`,
        pending: `${frontendUrl}/checkout/pending`,
      },
      notification_url: `${backendUrl}/api/mp/webhooks`,
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_methods: [] as unknown[],
        excluded_payment_types: [] as unknown[],
        installments: 12,
      },
      ...(order.shippingCost && order.shippingCost > 0 && {
        shipments: {
          cost: order.shippingCost,
          mode: 'not_specified',
        },
      }),
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        order_id: order.id,
        external_reference: order.externalReference,
        items_count: order.items.length,
        platform: 'BRAVOS_BRASIL',
      },
    };

    logger.info(`Creating MP preference for existing order: ${order.id} (extRef=${order.externalReference})`);

    // ── 4. Call Mercado Pago API ────────────────────────────────────────

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const mpData = (await mpResponse.json()) as any;

    if (!mpResponse.ok) {
      logger.error('Mercado Pago preference error:', mpData);
      return res.status(mpResponse.status).json({
        ok: false,
        error: 'Preference creation failed',
        message: mpData.message || 'Erro ao criar preferência no Mercado Pago',
        details: mpData,
      });
    }

    // ── 5. Save mpPreferenceId on existing Order ────────────────────────

    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPreferenceId: mpData.id?.toString(),
        paymentMethod: 'checkout_preference',
      },
    });

    logger.info(`Preference created: ${mpData.id} for order ${order.id}`);

    // ── 6. Return to frontend ───────────────────────────────────────────

    res.status(200).json({
      preferenceId: mpData.id,
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
      orderId: order.id,
      externalReference: order.externalReference,
      mobile: {
        android: mpData.init_point,
        ios: mpData.init_point,
      },
    });
  } catch (error) {
    logger.error('Create preference error:', errorMeta(error));

    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
