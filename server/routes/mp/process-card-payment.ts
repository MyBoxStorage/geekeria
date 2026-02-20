/**
 * POST /api/mp/process-card-payment
 *
 * Processa pagamento com cartão de crédito ou débito via Mercado Pago.
 * Recebe o token gerado pelo Payment Brick (frontend) e cria o pagamento
 * na API v1/payments do Mercado Pago.
 *
 * Body:
 * {
 *   token: string,              // Token do cartão gerado pelo Brick
 *   payment_method_id: string,  // Ex: "visa", "master", "debvisa", "debmaster"
 *   issuer_id: string,          // ID do emissor do cartão
 *   installments: number,       // Número de parcelas (1 para débito)
 *   transaction_amount: number, // Valor total da transação
 *   payer: {
 *     email: string,
 *     identification: { type: string, number: string }
 *   },
 *   external_reference: string, // External reference do pedido já criado
 * }
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { errorMeta } from '../../utils/logging.js';
import { sendError } from '../../utils/errorResponse.js';

const processCardPaymentSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  payment_method_id: z.string().min(1, 'Payment method ID é obrigatório'),
  issuer_id: z.union([z.string(), z.number()]).transform(String),
  installments: z.number().int().min(1).max(12),
  transaction_amount: z.number().positive(),
  payer: z.object({
    email: z.string().email(),
    identification: z.object({
      type: z.string().min(1),
      number: z.string().min(1),
    }).optional(),
  }),
  external_reference: z.string().min(1, 'External reference é obrigatório'),
  device_id: z.string().optional(),
});

export async function processCardPayment(req: Request, res: Response) {
  try {
    // Validação de entrada
    const validationResult = processCardPaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn('Card payment validation error', {
        issues: validationResult.error.issues,
      });
      return sendError(res, req, 400, 'VALIDATION_ERROR', 'Dados de pagamento inválidos', { details: validationResult.error.issues });
    }

    const {
      token,
      payment_method_id,
      issuer_id,
      installments,
      transaction_amount,
      payer,
      external_reference,
      device_id,
    } = validationResult.data;

    // Verificar Access Token
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      logger.error('MP_ACCESS_TOKEN não configurado');
      return sendError(res, req, 500, 'SERVER_CONFIG_ERROR', 'Mercado Pago access token not configured');
    }

    // Buscar o pedido existente pelo external_reference (com items e endereço para additional_info)
    const order = await prisma.order.findUnique({
      where: { externalReference: external_reference },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, description: true, image: true },
            },
          },
        },
      },
    });

    if (!order) {
      logger.warn('Order not found for card payment', { external_reference });
      return sendError(res, req, 404, 'NOT_FOUND', 'Pedido não encontrado');
    }

    // Verificar se o pedido já foi pago
    if (order.mpPaymentId && order.status !== 'PENDING') {
      logger.warn('Order already has a payment', {
        orderId: order.id,
        status: order.status,
        mpPaymentId: order.mpPaymentId,
      });
      return sendError(res, req, 409, 'ORDER_ALREADY_PROCESSED', 'Este pedido já possui um pagamento associado.', { status: order.status });
    }

    // Validar que o valor bate com o pedido
    const amountDiff = Math.abs(transaction_amount - order.total);
    if (amountDiff > 0.01) {
      logger.warn('Card payment amount mismatch', {
        orderId: order.id,
        orderTotal: order.total,
        requestAmount: transaction_amount,
      });
      return sendError(res, req, 400, 'AMOUNT_MISMATCH', 'O valor do pagamento não confere com o pedido.');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://bravosbrasil.com.br';

    // Preparar payload para a API do Mercado Pago
    const mpPaymentData: Record<string, unknown> = {
      token,
      payment_method_id,
      issuer_id,
      installments,
      transaction_amount,
      payer: {
        email: payer.email,
        ...(payer.identification && {
          identification: {
            type: payer.identification.type,
            number: payer.identification.number,
          },
        }),
      },
      external_reference,
      description: `Pedido GEEKERIA - ${external_reference}`,
      statement_descriptor: 'GEEKERIA',
      ...(device_id && { device_id }),
      notification_url: process.env.BACKEND_URL
        ? `${process.env.BACKEND_URL}/api/mp/webhooks`
        : undefined,
      additional_info: {
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.product?.name || `Produto ${item.productId}`,
          description: item.product?.description || item.product?.name || 'Camiseta geek GEEKERIA',
          category_id: 'fashion',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          picture_url: item.product?.image
            ? (item.product.image.startsWith('http') ? item.product.image : `${frontendUrl}${item.product.image}`)
            : undefined,
        })),
        payer: {
          first_name: (order.payerName || 'Cliente').split(' ')[0],
          last_name: (order.payerName || '').split(' ').slice(1).join(' ') || '',
          ...(order.payerPhone && {
            phone: {
              area_code: order.payerPhone.replace(/\D/g, '').substring(0, 2),
              number: order.payerPhone.replace(/\D/g, '').substring(2),
            },
          }),
        },
        ...(order.shippingCost && order.shippingCost > 0 && {
          shipments: {
            receiver_address: {
              zip_code: order.shippingCep || '',
              street_name: order.shippingAddress1 || '',
              city_name: order.shippingCity || '',
              state_name: order.shippingState || '',
            },
          },
        }),
      },
    };

    logger.info('Creating card payment in Mercado Pago', {
      orderId: order.id,
      external_reference,
      payment_method_id,
      installments,
      amount: transaction_amount,
    });

    // Gerar idempotency key
    const idempotencyKey = `bravos-card-${external_reference}-${Date.now()}`;

    // Chamar API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(mpPaymentData),
    });

    const mpData = (await mpResponse.json()) as Record<string, any>;

    if (!mpResponse.ok) {
      logger.error('Mercado Pago card payment error', {
        status: mpResponse.status,
        mpError: mpData,
        orderId: order.id,
      });

      // Atualizar pedido com status FAILED se for erro definitivo
      if (mpResponse.status >= 400 && mpResponse.status < 500) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            mpStatus: 'rejected',
            paymentMethod: payment_method_id,
          },
        });
      }

      return res.status(mpResponse.status).json({
        success: false,
        error: 'Payment creation failed',
        message: mpData.message || 'Erro ao processar pagamento com cartão',
        status: mpData.status,
        status_detail: mpData.status_detail,
        details: mpData,
      });
    }

    const mpPaymentId = mpData.id?.toString();
    const mpStatus = mpData.status;
    const statusDetail = mpData.status_detail;

    logger.info('Card payment created in Mercado Pago', {
      orderId: order.id,
      mpPaymentId,
      mpStatus,
      statusDetail,
      payment_method_id,
      installments,
    });

    // Mapear status do MP para status do pedido
    let orderStatus: string;
    switch (mpStatus) {
      case 'approved':
        orderStatus = 'PAID';
        break;
      case 'in_process':
      case 'pending':
        orderStatus = 'PENDING';
        break;
      case 'rejected':
        orderStatus = 'FAILED';
        break;
      case 'cancelled':
        orderStatus = 'CANCELED';
        break;
      default:
        orderStatus = 'PENDING';
    }

    // Atualizar pedido com dados do pagamento
    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPaymentId,
        mpStatus,
        status: orderStatus as any,
        paymentMethod: payment_method_id,
      },
    });

    logger.info('Order updated with card payment', {
      orderId: order.id,
      mpPaymentId,
      orderStatus,
    });

    // Retornar resultado para o frontend
    const isApproved = mpStatus === 'approved';
    const isPending = mpStatus === 'pending' || mpStatus === 'in_process';
    const isRejected = mpStatus === 'rejected';

    res.status(200).json({
      success: isApproved,
      payment_id: mpPaymentId,
      status: mpStatus,
      status_detail: statusDetail,
      external_reference,
      order_id: order.id,
      is_approved: isApproved,
      is_pending: isPending,
      is_rejected: isRejected,
    });
  } catch (error) {
    logger.error('Process card payment error:', errorMeta(error));
    sendError(res, req, 500, 'INTERNAL_ERROR', 'Erro ao processar pagamento com cartão');
  }
}
