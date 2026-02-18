/**
 * GET /api/admin/analytics/overview
 * Dashboard de vendas com métricas e gráficos
 * Requer ADMIN_TOKEN (header x-admin-token)
 */

import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../utils/prisma.js';
import { sendError } from '../../../utils/errorResponse.js';

export async function getAnalyticsOverview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: Prisma.OrderWhereInput = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
    }

    // Total de pedidos (no período)
    const totalOrders = await prisma.order.count({
      where: dateFilter,
    });

    // Receita total (pedidos PAID)
    const orders = await prisma.order.findMany({
      where: dateFilter,
      select: {
        total: true,
        status: true,
      },
    });

    const totalRevenue = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const pendingRevenue = orders
      .filter((o) => o.status === 'PENDING')
      .reduce((sum, o) => sum + Number(o.total), 0);

    // Total de usuários (todos, sem filtro de data)
    const totalUsers = await prisma.user.count();

    // Gerações de estampas (no período)
    const generationDateFilter: Prisma.GenerationWhereInput = {};
    if (startDate || endDate) {
      generationDateFilter.createdAt = {};
      if (startDate) generationDateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) generationDateFilter.createdAt.lte = new Date(endDate as string);
    }

    const totalGenerations = await prisma.generation.count({
      where: generationDateFilter,
    });

    const successfulGenerations = await prisma.generation.count({
      where: {
        ...generationDateFilter,
        status: 'COMPLETED',
      },
    });

    // Cupons usados (no período)
    const couponDateFilter: Prisma.CouponUsageWhereInput = {};
    if (startDate || endDate) {
      couponDateFilter.createdAt = {};
      if (startDate) couponDateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) couponDateFilter.createdAt.lte = new Date(endDate as string);
    }

    const couponsUsed = await prisma.couponUsage.count({
      where: couponDateFilter,
    });

    const totalDiscountResult = await prisma.couponUsage.aggregate({
      where: couponDateFilter,
      _sum: {
        discountAmount: true,
      },
    });

    // Vendas por dia (últimos 30 dias ou conforme filtro)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const salesStart = startDate ? new Date(startDate as string) : thirtyDaysAgo;
    const salesEnd = endDate ? new Date(endDate as string) : new Date();

    const salesByDay = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint; revenue: number }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count,
        COALESCE(SUM(total), 0)::float as revenue
      FROM orders
      WHERE created_at >= ${salesStart}
      AND created_at <= ${salesEnd}
      AND status = 'PAID'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Top produtos mais vendidos (via order_items + products)
    const topProducts = await prisma.$queryRaw<
      Array<{ productName: string; totalSold: bigint; revenue: number }>
    >`
      SELECT 
        p.name as "productName",
        COALESCE(SUM(oi.quantity), 0)::int as "totalSold",
        COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status = 'PAID'
      AND o.created_at >= ${salesStart}
      AND o.created_at <= ${salesEnd}
      GROUP BY p.name
      ORDER BY "totalSold" DESC
      LIMIT 10
    `;

    // Status dos pedidos (no período)
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        id: true,
      },
    });

    res.json({
      success: true,
      analytics: {
        overview: {
          totalOrders,
          totalRevenue,
          pendingRevenue,
          totalUsers,
          totalGenerations,
          successfulGenerations,
          couponsUsed,
          totalDiscount: Number(totalDiscountResult._sum.discountAmount || 0),
        },
        salesByDay: salesByDay.map((r) => ({
          date: r.date,
          count: Number(r.count),
          revenue: Number(r.revenue),
        })),
        topProducts: topProducts.map((r) => ({
          productName: r.productName,
          totalSold: Number(r.totalSold),
          revenue: Number(r.revenue),
        })),
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao buscar analytics');
  }
}
