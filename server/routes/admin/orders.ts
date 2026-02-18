/**
 * Rotas admin para operação manual Montink
 *
 * ⚠️ Protegidas por ADMIN_TOKEN (header x-admin-token) no index.ts
 * ⚠️ Rate limiting aplicado no index.ts
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { sendError } from '../../utils/errorResponse.js';

const listAdminOrdersSchema = z.object({
  status: z.string().default('READY_FOR_MONTINK'),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((v) => !isNaN(v) && v > 0 && v <= 200, {
      message: 'limit must be between 1 and 200',
    })
    .default('50' as any),
});

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!user || !domain) return null;
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

/**
 * GET /api/admin/orders?status=READY_FOR_MONTINK&limit=50
 *
 * Lista pedidos para operação manual (ex: READY_FOR_MONTINK)
 */
export async function listAdminOrders(req: Request, res: Response) {
  try {
    const parsed = listAdminOrdersSchema.safeParse({
      status: (req.query.status as string) ?? 'READY_FOR_MONTINK',
      limit: (req.query.limit as string) ?? '50',
    });

    if (!parsed.success) {
      logger.warn('Invalid admin orders list request');
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Parâmetros inválidos');
    }

    const { status, limit } = parsed.data;

    const orders = await prisma.order.findMany({
      where: { status: status as 'PENDING' | 'PAID' | 'READY_FOR_MONTINK' | 'SENT_TO_MONTINK' | 'FAILED_MONTINK' | 'CANCELED' | 'FAILED' | 'REFUNDED' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        items: {
          select: { id: true },
        },
      },
    });

    const result = orders.map((order: any) => ({
      orderId: order.id,
      externalReference: order.externalReference,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      itemCount: order.items.length,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      mpStatus: order.mpStatus,
      mpPaymentId: order.mpPaymentId,
      payerEmailMasked: maskEmail(order.payerEmail),
      riskScore: order.riskScore ?? null,
      riskFlag: order.riskFlag ?? false,
      riskReasons: order.riskReasons ?? null,
      ipAddress: order.ipAddress ?? null,
      userAgent: order.userAgent ?? null,
    }));

    logger.info(`Admin list orders: count=${result.length}, status=${status}`);

    return res.json({
      status,
      count: result.length,
      orders: result,
    });
  } catch (error) {
    logger.error(
      `Error in admin list orders: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao listar pedidos');
  }
}

const exportAdminOrderSchema = z.object({
  externalReference: z.string().min(1),
  includeCpf: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

/**
 * GET /api/admin/orders/:externalReference/export
 *
 * Exporta JSON operacional para cadastro manual na Montink.
 */
export async function exportAdminOrder(req: Request, res: Response) {
  try {
    const parsed = exportAdminOrderSchema.safeParse({
      externalReference: req.params.externalReference,
      includeCpf: req.query.includeCpf as string | undefined,
    });

    if (!parsed.success) {
      logger.warn('Invalid admin export request');
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Parâmetros inválidos');
    }

    const { externalReference, includeCpf } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { externalReference },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                images: true,
                colorStock: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      logger.warn(`Admin export: order not found externalReference=${externalReference}`);
      return sendError(res, req, 404, 'NOT_FOUND', 'Pedido não encontrado');
    }

    const exportPayload = {
      order: {
        orderId: order.id,
        externalReference: order.externalReference,
        createdAt: order.createdAt,
        status: order.status,
      },
      customer: {
        name: order.payerName,
        email: order.payerEmail,
        phone: order.payerPhone,
        ...(includeCpf && order.payerCpf ? { cpf: order.payerCpf } : {}),
      },
      shipping: {
        cep: order.shippingCep,
        address1: order.shippingAddress1,
        number: order.shippingNumber,
        district: order.shippingDistrict,
        city: order.shippingCity,
        state: order.shippingState,
        complement: order.shippingComplement,
        service: order.shippingService,
        deadline: order.shippingDeadline,
      },
      items: order.items.map((item: any) => ({
        productId: item.productId,
        name: item.product?.name ?? null,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        unitPrice: item.unitPrice,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              image: item.product.image ?? null,
              images: item.product.images ?? null,
              colorStock: item.product.colorStock ?? null,
            }
          : null,
      })),
      totals: {
        subtotal: order.subtotal ?? 0,
        discountTotal: order.discountTotal ?? 0,
        shippingCost: order.shippingCost,
        total: order.total,
      },
      payment: {
        mpStatus: order.mpStatus,
        mpPaymentId: order.mpPaymentId,
      },
      risk: {
        score: order.riskScore ?? null,
        flag: order.riskFlag ?? false,
        reasons: order.riskReasons ?? null,
        ipAddress: order.ipAddress ?? null,
        userAgent: order.userAgent ?? null,
      },
      notes: 'Cadastrar manualmente na Montink',
    };

    logger.info(`Admin export order: externalReference=${externalReference}`);

    return res.json(exportPayload);
  } catch (error) {
    logger.error(
      `Error in admin export order: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao exportar pedido');
  }
}

