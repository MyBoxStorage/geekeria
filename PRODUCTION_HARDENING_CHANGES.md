# Production Hardening Changes Applied

## CHANGES MADE

### 1. `server/index.ts`
- ✅ **Added production env validation** (fail fast on missing required vars)
- ✅ **Trust proxy enabled** (for correct IP detection behind reverse proxy)
- ✅ **CORS allowlist** (supports CSV in FRONTEND_URL, filters empty strings)
- ✅ **Body size limits** (10mb for JSON and URL-encoded)
- ✅ **PORT parsing** (converts string to number for TypeScript)
- ✅ **Listen on 0.0.0.0** (for container deployment)

### 2. `src/services/mercadopago-preference.ts`
- ✅ **Removed localhost fallback** (uses VITE_API_URL only, empty string fallback)
- ✅ **Removed VITE_BACKEND_URL** (consolidated to VITE_API_URL)

### 3. Prisma Migrations
- ✅ **Migrations exist** in `prisma/migrations/`
- ⚠️ **Note**: Some manual SQL files exist (`add_admin_events.sql`, `add_montink_order_statuses.sql`)
  - These should be applied manually or converted to Prisma migrations
  - Main migration: `20260210015829_add_shipping_montink_webhook_event/migration.sql`

## VERIFICATION COMMANDS

### Local Build Test
```bash
cd server
npm run build
```

### Local Server Test
```bash
cd server
npm run dev
# Test CORS: curl -H "Origin: http://localhost:5173" http://localhost:3001/health
# Test trust proxy: curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3001/health
```

### Frontend Build Test
```bash
npm run build
```

## PRODUCTION DEPLOY COMMANDS

### Prisma Migrations (DO NOT RUN, instructions only)
```bash
# On Fly.io after deploy:
fly ssh console
cd /app
npx prisma generate
npx prisma migrate deploy --schema=prisma/schema.prisma
exit
```

### Health Check
```bash
curl https://bravos-backend.fly.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "BRAVOS BRASIL API"
}
```

## ENVIRONMENT VARIABLES REQUIRED (Production)

The server will **fail to start** in production if these are missing:
- `DATABASE_URL`
- `MP_ACCESS_TOKEN`
- `FRONTEND_URL`
- `BACKEND_URL`
- `ADMIN_TOKEN`

## NOTES

1. **CORS**: Supports multiple origins via CSV: `FRONTEND_URL=https://www.bravosbrasil.com.br,https://staging.bravosbrasil.com.br`
2. **Frontend**: Must set `VITE_API_URL` in production (no localhost fallback)
3. **Local Dev**: Set `VITE_API_URL=http://localhost:3001` in `.env.local` for development
