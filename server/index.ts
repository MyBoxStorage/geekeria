/**
 * Express Server - BRAVOS BRASIL Backend
 * 
 * Integração com Mercado Pago Payments API
 * Suporte a PIX e Boleto
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPayment } from './routes/mp/create-payment.js';
import { createPreference } from './routes/mp/create-preference.js';
import { webhookHandler } from './routes/mp/webhooks.js';
import { getPayment } from './routes/mp/get-payment.js';
import { healthCheck } from './routes/health.js';
import { shippingQuote } from './routes/shipping/quote.js';
import { createOrder } from './routes/checkout/create-order.js';
import { getOrder } from './routes/orders/get-order.js';
import { markMontink, validateAdminToken } from './routes/orders/mark-montink.js';
import { listAdminOrders, exportAdminOrder } from './routes/admin/orders.js';
import { getOrderAudit } from './routes/admin/audit.js';
import { monitorStatus } from './routes/internal/monitor.js';
import { reconcilePending } from './routes/internal/reconcile-pending.js';
import { createRateLimiter } from './utils/rateLimiter.js';

// Carrega variáveis de ambiente
dotenv.config();

// Production environment validation (fail fast on missing required vars)
if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'MP_ACCESS_TOKEN', 'FRONTEND_URL', 'BACKEND_URL', 'ADMIN_TOKEN'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars in production: ${missing.join(', ')}`);
  }
}

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
const rateLimitAdminAudit = createRateLimiter({
  routeKey: 'GET:/api/admin/orders/audit',
  maxRequests: 30,
  windowMs: WINDOW_MS,
});

// Middlewares
// CORS: Support multiple origins (production + staging if needed)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body size limits (DoS protection)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', healthCheck);
app.post('/api/mp/create-payment', createPayment);
app.post('/api/mp/create-preference', createPreference);
app.get('/api/mp/payment/:paymentId', rateLimitGetPayment, getPayment);
app.post('/api/mp/webhooks', webhookHandler);
app.post('/api/shipping/quote', shippingQuote);
app.post('/api/checkout/create-order', createOrder);
app.get('/api/orders/:externalReference', rateLimitGetOrder, getOrder);
app.post(
  '/api/orders/:externalReference/mark-montink',
  validateAdminToken,
  rateLimitMarkMontink,
  markMontink
);
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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const envKeys = [
    'DATABASE_URL',
    'MP_ACCESS_TOKEN',
    'MP_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'BACKEND_URL',
    'ADMIN_TOKEN',
  ] as const;
  const status = envKeys.map((k) => `${k}=${process.env[k] ? 'set' : 'not set'}`).join(', ');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Env: ${status}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
