/**
 * POST /api/checkout/create-order
 * 
 * Cria um pedido (Order) e seus itens (OrderItems) no banco de dados
 * Backend recalcula todos os totals (source of truth)
 * 
 * Body:
 * {
 *   "payer": { name, email, cpf?, phone? },
 *   "shipping": { cep?, address1?, number?, district?, city?, state?, complement?, service?, deadline? },
 *   "items": [{ productId, quantity, unitPrice, size?, color? }]
 * }
 */

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { errorMeta } from '../../utils/logging.js';
import { randomUUID } from 'crypto';
import {
  getClientIp,
  getClientUserAgent,
  computeOrderRiskSimple,
  truncateForDb,
} from '../../services/risk/riskScoring.js';
import { validateItemsStock, type ProductStockData } from '../../utils/stockValidation.js';

// Schema de validação
const createOrderSchema = z.object({
  payer: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  }),
  shipping: z.object({
    cep: z.string().optional(),
    address1: z.string().optional(),
    number: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    complement: z.string().optional(),
    service: z.string().optional(),
    deadline: z.number().int().nonnegative().optional(),
  }).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    size: z.string().optional(),
    color: z.string().optional(),
  })).min(1, 'Items array cannot be empty'),
  couponCode: z.string().optional(),
});

/**
 * Calcula desconto baseado na quantidade de itens
 */
function calculateDiscountRate(itemCount: number): number {
  if (itemCount >= 5) return 0.15;
  if (itemCount === 4) return 0.10;
  if (itemCount === 3) return 0.05;
  return 0;
}

/**
 * Calcula todos os valores do pedido (incluindo cupom)
 */
function calculateOrderTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  couponDiscountAmount: number = 0,
  hasTestProducts: boolean = false
) {
  // Calcular subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Calcular quantidade total de itens
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Desconto por quantidade
  const discountRate = calculateDiscountRate(itemCount);
  const quantityDiscountTotal = subtotal * discountRate;
  const subtotalAfterQuantityDiscount = subtotal - quantityDiscountTotal;

  // Desconto por cupom (limitado ao subtotal após desconto de quantidade)
  const effectiveCouponDiscount = Math.min(
    couponDiscountAmount,
    subtotalAfterQuantityDiscount
  );
  const subtotalAfterDiscount =
    subtotalAfterQuantityDiscount - effectiveCouponDiscount;
  const discountTotal = quantityDiscountTotal + effectiveCouponDiscount;

  // Calcular frete (grátis para produtos de teste)
  const FREE_SHIPPING_THRESHOLD = 200;
  const STANDARD_SHIPPING_COST = 15;
  const shippingCost = hasTestProducts
    ? 0
    : (subtotalAfterDiscount > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST);

  // Calcular total
  const total = subtotalAfterDiscount + shippingCost;

  return {
    subtotal,
    discountTotal,
    couponDiscountAmount: effectiveCouponDiscount,
    shippingCost,
    total,
    itemCount,
  };
}

export async function createOrder(req: Request, res: Response) {
  try {
    // Validação de entrada
    const validationResult = createOrderSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationResult.error.issues,
      });
    }

    const { payer, shipping, items, couponCode } = validationResult.data;

    // Obter buyerId do JWT (se logado)
    let buyerId: string | null = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';
        const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
        buyerId = decoded.userId ?? null;
      }
    } catch {
      buyerId = null;
    }

    // Validar cupom no backend (não confiar no valor do cliente)
    let couponDiscountAmount = 0;
    let couponDiscountCode: string | null = null;
    if (couponCode && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });
      let valid =
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || new Date() <= coupon.expiresAt) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses);

      if (valid && buyerId && coupon) {
        const previousUse = await prisma.couponUsage.findFirst({
          where: { couponId: coupon.id, userId: buyerId },
        });
        if (previousUse) valid = false;
      }

      if (valid && coupon) {
        couponDiscountCode = normalizedCode;
        const subtotal = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const qtyRate = calculateDiscountRate(itemCount);
        const subtotalAfterQty = subtotal * (1 - qtyRate);
        if (coupon.type === 'PERCENTAGE') {
          couponDiscountAmount = (subtotalAfterQty * coupon.value) / 100;
        } else {
          couponDiscountAmount = Math.min(coupon.value, subtotalAfterQty);
        }
      }
    }

    // Buscar produtos com dados necessários para validação + frete
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        category: true,
        colorStock: true,
        colors: true,
        sizes: true,
      },
    });

    // Verificar se todos os produtos existem
    const foundIds = new Set(products.map((p) => p.id));
    const missingIds = productIds.filter((pid) => !foundIds.has(pid));
    if (missingIds.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Um ou mais produtos não foram encontrados.',
        details: missingIds.map((id) => ({ productId: id })),
      });
    }

    // Validar estoque (color + size) contra colorStock do DB
    const productMap = new Map<string, ProductStockData>(
      products.map((p) => [
        p.id,
        {
          id: p.id,
          colorStock: p.colorStock,
          colors: p.colors,
          sizes: p.sizes,
        },
      ]),
    );

    const stockViolations = validateItemsStock(
      items.map((i) => ({
        productId: i.productId,
        color: i.color,
        size: i.size,
      })),
      productMap,
    );

    if (stockViolations.length > 0) {
      logger.warn(`Stock validation failed: ${JSON.stringify(stockViolations)}`);
      return res.status(400).json({
        ok: false,
        error: 'OUT_OF_STOCK_VARIANT',
        message: 'Uma ou mais combinações de cor/tamanho não estão disponíveis.',
        details: stockViolations,
      });
    }

    const hasTestProducts = products.some((p) => p.category === 'TESTES');

    // Calcular totals no backend (source of truth)
    const totals = calculateOrderTotals(items, couponDiscountAmount, hasTestProducts);

    // Gerar external reference único
    const externalReference = `order_${randomUUID()}`;

    // Telemetria e risco (não bloqueia; se falhar, persiste sem risco)
    const ipAddress = getClientIp(req) ?? null;
    const userAgent = getClientUserAgent(req) ?? null;
    let risk: { riskScore: number; riskFlag: boolean; riskReasons: string | null } = {
      riskScore: 0,
      riskFlag: false,
      riskReasons: null,
    };
    try {
      risk = computeOrderRiskSimple({
        ipAddress,
        userAgent,
        payerCpf: payer.cpf,
        shippingCep: shipping?.cep ?? null,
        shippingState: shipping?.state ?? null,
      });
    } catch {
      // não bloquear: mantém risk zerado
    }

    logger.info(`Creating order: externalRef=${externalReference}, total=${totals.total}`);

    // Criar Order e OrderItems em uma transação
    const order = await prisma.$transaction(async (tx: any) => {
      // Criar Order
      const newOrder = await tx.order.create({
        data: {
          total: totals.total,
          buyerId,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          status: 'PENDING',
          payerName: payer.name,
          payerEmail: payer.email,
          payerCpf: payer.cpf,
          payerPhone: payer.phone,
          externalReference: externalReference,
          // Endereço de entrega
          shippingCep: shipping?.cep,
          shippingAddress1: shipping?.address1,
          shippingNumber: shipping?.number,
          shippingDistrict: shipping?.district,
          shippingCity: shipping?.city,
          shippingState: shipping?.state,
          shippingComplement: shipping?.complement,
          // Informações de frete
          shippingCost: totals.shippingCost,
          shippingService: shipping?.service,
          shippingDeadline: shipping?.deadline,
          // Cupom
          couponCode: couponDiscountCode,
          couponDiscountAmount:
            totals.couponDiscountAmount > 0 ? totals.couponDiscountAmount : null,
          // Telemetria / risco
          ipAddress: truncateForDb(ipAddress ?? undefined),
          userAgent: truncateForDb(userAgent ?? undefined),
          riskScore: risk.riskScore,
          riskFlag: risk.riskFlag,
          riskReasons: risk.riskReasons,
        },
      });

      // Criar OrderItems
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color,
        })),
      });

      return newOrder;
    });

    // Registrar uso do cupom e incrementar usedCount
    if (couponDiscountCode && totals.couponDiscountAmount > 0 && order) {
      try {
        const coupon = await prisma.coupon.findUnique({
          where: { code: couponDiscountCode },
        });
        if (coupon) {
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
          if (buyerId) {
            await prisma.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: buyerId,
                orderId: order.id,
                discountAmount: totals.couponDiscountAmount,
              },
            });
          }
        }
      } catch (err) {
        logger.warn('Coupon usage tracking failed', errorMeta(err));
      }
    }

    logger.info(`Order created: id=${order.id}, externalRef=${externalReference}`);

    res.status(201).json({
      orderId: order.id,
      externalReference: order.externalReference,
      totals: {
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingCost: totals.shippingCost,
        total: totals.total,
      },
    });

  } catch (error) {
    logger.error('Create order error:', errorMeta(error));
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
