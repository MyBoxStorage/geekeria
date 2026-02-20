/**
 * Express Server - GEEKERIA Backend
 * 
 * Integração com Mercado Pago Payments API
 * Suporte a PIX, Boleto, Cartão de Crédito e Débito
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createPayment } from './routes/mp/create-payment.js';
import { createPreference } from './routes/mp/create-preference.js';
import { webhookHandler } from './routes/mp/webhooks.js';
import { getPayment } from './routes/mp/get-payment.js';
import { processCardPayment } from './routes/mp/process-card-payment.js';
import { healthCheck } from './routes/health.js';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';
import { requestContextMiddleware } from './utils/requestContext.js';
import { shippingQuote } from './routes/shipping/quote.js';
import { createOrder } from './routes/checkout/create-order.js';
import { getOrder } from './routes/orders/get-order.js';
import { updateOrderPayment } from './routes/orders/update-payment.js';
import { linkOrder } from './routes/orders/link-order.js';
import { markMontink } from './routes/orders/mark-montink.js';
import { validateAdminToken } from './utils/adminAuth.js';
import { listAdminOrders, exportAdminOrder } from './routes/admin/orders.js';
import { getOrderAudit } from './routes/admin/audit.js';
import { listGenerations } from './routes/admin/list-generations.js';
import { listPromptTemplates } from './routes/admin/prompt-templates/list.js';
import { createPromptTemplate } from './routes/admin/prompt-templates/create.js';
import { updatePromptTemplate } from './routes/admin/prompt-templates/update.js';
import { activatePromptTemplate } from './routes/admin/prompt-templates/activate.js';
import { listCoupons } from './routes/admin/coupons/list.js';
import { createCoupon } from './routes/admin/coupons/create.js';
import { updateCoupon } from './routes/admin/coupons/update.js';
import { deleteCoupon } from './routes/admin/coupons/delete.js';
import { getAnalyticsOverview } from './routes/admin/analytics/overview.js';
import { uploadMiddleware, uploadProductImage } from './routes/admin/storage.js';
import { listAdminProducts, getAdminProduct, createAdminProduct, updateAdminProduct, deleteAdminProduct } from './routes/admin/products.js';
import { getCatalogHealth } from './routes/admin/catalog-health.js';
import { listCatalogProducts, getCatalogProduct } from './routes/catalog/products.js';
import { validateCoupon } from './routes/coupons/validate.js';
import { monitorStatus } from './routes/internal/monitor.js';
import { reconcilePending } from './routes/internal/reconcile-pending.js';
import { cancelAbandoned } from './routes/internal/cancel-abandoned.js';
import { sendAbandonedCartEmails } from './routes/internal/abandoned-cart-email.js';
import { createRateLimiter } from './utils/rateLimiter.js';
import { validateProductionEnv, logEnvStatus } from './utils/env.js';
import rateLimit from 'express-rate-limit';
import { signup } from './routes/auth/signup.js';
import { login } from './routes/auth/login.js';
import { me } from './routes/auth/me.js';
import { verifyEmail } from './routes/auth/verify-email.js';
import { resendVerification } from './routes/auth/resend-verification.js';
import { requireAuth, optionalAuth } from './utils/authMiddleware.js';
import { generateStamp } from './routes/generate-stamp/generate.js';
import { listMyGenerations } from './routes/generate-stamp/list.js';
import { getMyGenerations } from './routes/user/my-generations.js';
import { getMyOrders } from './routes/user/my-orders.js';
import { cleanupExpiredGenerations } from './routes/internal/cleanup-expired-generations.js';
import { sendError } from './utils/errorResponse.js';
import { orderEventsHandler } from './utils/sse.js';
import { subscribeNewsletter } from './routes/newsletter/subscribe.js';

// Carrega variáveis de ambiente
dotenv.config();

// Production environment validation (fail fast on missing required vars)
validateProductionEnv();

const app = express();

// Trust proxy for correct IP detection behind Fly.io/reverse proxy
app.set('trust proxy', 1);

const PORT = parseInt(process.env.PORT || '3001', 10);

const WINDOW_MS = 5 * 60 * 1000;

const rateLimitGetOrder = createRateLimiter({
  routeKey: 'GET:/api/orders',
  maxRequests: 60,
  windowMs: WINDOW_MS,
});
const rateLimitGetPayment = createRateLimiter({
  routeKey: 'GET:/api/mp/payment',
  maxRequests: 60,
  windowMs: WINDOW_MS,
});
const rateLimitMarkMontink = createRateLimiter({
  routeKey: 'POST:/api/orders/mark-montink',
  maxRequests: 20,
  windowMs: WINDOW_MS,
});
const rateLimitAdminListOrders = createRateLimiter({
  routeKey: 'GET:/api/admin/orders',
  maxRequests: 30,
  windowMs: WINDOW_MS,
});
const rateLimitAdminExportOrder = createRateLimiter({
  routeKey: 'GET:/api/admin/orders/export',
  maxRequests: 30,
  windowMs: WINDOW_MS,
});
const rateLimitMonitor = createRateLimiter({
  routeKey: 'internal:monitor',
  maxRequests: 30,
  windowMs: WINDOW_MS,
});
const rateLimitReconcilePending = createRateLimiter({
  routeKey: 'internal:reconcile-pending',
  maxRequests: 10,
  windowMs: WINDOW_MS,
});
const rateLimitCancelAbandoned = createRateLimiter({
  routeKey: 'internal:cancel-abandoned',
  maxRequests: 5,
  windowMs: WINDOW_MS,
});
const rateLimitAbandonedCartEmail = createRateLimiter({
  routeKey: 'internal:abandoned-cart-email',
  maxRequests: 5,
  windowMs: WINDOW_MS,
});
const rateLimitCleanupGenerations = createRateLimiter({
  routeKey: 'internal:cleanup-expired-generations',
  maxRequests: 10,
  windowMs: WINDOW_MS,
});
const rateLimitAdminAudit = createRateLimiter({
  routeKey: 'GET:/api/admin/orders/audit',
  maxRequests: 30,
  windowMs: WINDOW_MS,
});
// Global admin rate limiter — applies to ALL /api/admin/* routes (60 req/min per IP)
const rateLimitAdmin = createRateLimiter({
  routeKey: 'ADMIN',
  maxRequests: 60,
  windowMs: 60 * 1000,
});
const rateLimitGenerateStamp = createRateLimiter({
  routeKey: 'POST:/api/generate-stamp',
  maxRequests: 5,
  windowMs: 60 * 1000,
});
const rateLimitCatalog = createRateLimiter({
  routeKey: 'GET:/api/catalog',
  maxRequests: 120,
  windowMs: WINDOW_MS,
});

// Security headers (helmet) — CSP disabled for now to avoid breaking Payment Brick / external scripts
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: Support multiple origins (production + staging if needed)
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:5173'];
const allowedOrigins = [
  ...new Set([
    ...frontendUrls,
    'https://bravosbrasil.com.br',
    'https://www.bravosbrasil.com.br',
    'http://localhost:5173',
  ]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, webhooks, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-token',
      'x-request-id',
      'x-signature',
    ],
  })
);

// Body size limits (DoS protection)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request context: requestId + duration logging
app.use(requestContextMiddleware);

// Routes
app.get('/health', healthCheck);

app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true, status: 'ready', db: 'up' });
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    logger.error('health_ready_failed', { event: 'health_ready_failed', message });
    sendError(res, req, 503, 'HEALTH_NOT_READY', 'Database not reachable', { status: 'not_ready', db: 'down' });
    return;
  }
});

app.post('/api/mp/create-payment', createPayment);
app.post('/api/mp/process-card-payment', processCardPayment);
app.post('/api/mp/create-preference', createPreference);
app.get('/api/mp/payment/:paymentId', rateLimitGetPayment, getPayment);
app.get('/api/mp/webhooks', (_req, res) => {
  res.status(200).send('Webhook endpoint OK');
});
app.post('/api/mp/webhooks', webhookHandler);
app.post('/api/shipping/quote', shippingQuote);
app.get('/api/catalog/products', rateLimitCatalog, listCatalogProducts);
app.get('/api/catalog/products/:slug', rateLimitCatalog, getCatalogProduct);
app.post('/api/checkout/create-order', createOrder);
app.get('/api/orders/:externalReference', rateLimitGetOrder, getOrder);
app.get('/api/orders/:externalReference/events', orderEventsHandler);
app.post('/api/orders/:externalReference/update-payment', updateOrderPayment);
app.post('/api/orders/link', requireAuth, linkOrder);
app.post(
  '/api/orders/:externalReference/mark-montink',
  validateAdminToken,
  rateLimitMarkMontink,
  markMontink
);
// Admin rate limit blanket — 60 req/min per IP across all /api/admin/* routes
app.use('/api/admin', rateLimitAdmin);
app.get(
  '/api/admin/orders',
  validateAdminToken,
  rateLimitAdminListOrders,
  listAdminOrders
);
app.get(
  '/api/admin/orders/:externalReference/export',
  validateAdminToken,
  rateLimitAdminExportOrder,
  exportAdminOrder
);
app.get(
  '/api/admin/orders/:externalReference/audit',
  validateAdminToken,
  rateLimitAdminAudit,
  getOrderAudit
);
app.get('/api/admin/generations', validateAdminToken, listGenerations);
app.get('/api/admin/prompt-templates', validateAdminToken, listPromptTemplates);
app.post('/api/admin/prompt-templates', validateAdminToken, createPromptTemplate);
app.put('/api/admin/prompt-templates/:id', validateAdminToken, updatePromptTemplate);
app.post('/api/admin/prompt-templates/:id/activate', validateAdminToken, activatePromptTemplate);
app.get('/api/admin/coupons', validateAdminToken, listCoupons);
app.post('/api/admin/coupons', validateAdminToken, createCoupon);
app.put('/api/admin/coupons/:id', validateAdminToken, updateCoupon);
app.delete('/api/admin/coupons/:id', validateAdminToken, deleteCoupon);
app.get('/api/admin/analytics/overview', validateAdminToken, getAnalyticsOverview);
app.post('/api/admin/storage/upload', validateAdminToken, uploadMiddleware, uploadProductImage);
app.get('/api/admin/products', validateAdminToken, listAdminProducts);
app.get('/api/admin/products/:id', validateAdminToken, getAdminProduct);
app.post('/api/admin/products', validateAdminToken, createAdminProduct);
app.put('/api/admin/products/:id', validateAdminToken, updateAdminProduct);
app.delete('/api/admin/products/:id', validateAdminToken, deleteAdminProduct);
app.get('/api/admin/catalog-health', validateAdminToken, getCatalogHealth);
app.post('/api/coupons/validate', optionalAuth, validateCoupon);
app.get(
  '/api/internal/monitor',
  validateAdminToken,
  rateLimitMonitor,
  monitorStatus
);
app.post(
  '/api/internal/reconcile-pending',
  validateAdminToken,
  rateLimitReconcilePending,
  reconcilePending
);
app.post(
  '/api/internal/cancel-abandoned',
  validateAdminToken,
  rateLimitCancelAbandoned,
  cancelAbandoned
);
app.post(
  '/api/internal/abandoned-cart-email',
  validateAdminToken,
  rateLimitAbandonedCartEmail,
  sendAbandonedCartEmails
);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { ok: false, error: 'RATE_LIMITED', message: 'Muitas tentativas. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Newsletter
app.post('/api/newsletter/subscribe', subscribeNewsletter);

// Auth routes
app.post('/api/auth/signup', authLimiter, signup);
app.post('/api/auth/login', login);
app.post('/api/auth/verify-email', authLimiter, verifyEmail);
app.post('/api/auth/resend-verification', authLimiter, resendVerification);
app.get('/api/auth/me', requireAuth, me);

// Generate stamp (requires auth + credits)
app.post('/api/generate-stamp', requireAuth, rateLimitGenerateStamp, generateStamp);
app.get('/api/my-generations', requireAuth, listMyGenerations);
app.get('/api/user/my-generations', requireAuth, getMyGenerations);
app.get('/api/user/my-orders', requireAuth, getMyOrders);

// Internal: Cleanup expired generations (CRON)
app.post(
  '/api/internal/cleanup-expired-generations',
  validateAdminToken,
  rateLimitCleanupGenerations,
  cleanupExpiredGenerations
);

// Error handling middleware (includes Multer errors for file upload)
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isDev = process.env.NODE_ENV === 'development';
  const requestId = (req as express.Request & { requestId?: string }).requestId ?? 'unknown';

  // Multer-specific errors (file too large, wrong type, etc.)
  if (err.name === 'MulterError' || err.message?.includes('Tipo de arquivo não permitido')) {
    logger.warn('upload_error', { event: 'upload_error', requestId, detail: err.message });
    const msg = isDev
      ? err.message
      : 'Falha no upload. Verifique o arquivo e tente novamente.';
    sendError(res, req, 400, 'UPLOAD_ERROR', msg);
    return;
  }

  logger.error('unhandled_error', { event: 'unhandled_error', requestId, message: err.message });
  const msg = isDev ? err.message : 'Erro interno do servidor';
  sendError(res, req, 500, 'INTERNAL_ERROR', msg);
});

// 404 handler
app.use((req, res) => {
  sendError(res, req, 404, 'NOT_FOUND', 'Rota não encontrada');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  logEnvStatus();
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
