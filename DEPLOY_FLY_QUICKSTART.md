# 🚀 Deploy Rápido no Fly.io

## Passo 1: Instalar Fly CLI

**Windows (PowerShell como Admin):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Ou baixe:** https://github.com/superfly/flyctl/releases

## Passo 2: Login

```bash
fly auth login
```

## Passo 3: Deploy (da raiz do projeto)

```bash
cd server
fly launch
```

Quando perguntar:
- **App name**: `bravos-backend` (ou outro nome)
- **Region**: `gru` (São Paulo)
- **PostgreSQL**: `n` (não, já temos Supabase)
- **Redis**: `n`

## Passo 4: Configurar Secrets

```bash
fly secrets set DATABASE_URL="postgresql://postgres:Vn7vmNPalEk9H4wC@db.thntrxrqxupaajovnepy.supabase.co:5432/postgres?sslmode=require"
fly secrets set MP_ACCESS_TOKEN="APP_USR-<seu-token>"
fly secrets set FRONTEND_URL="https://www.bravosbrasil.com.br"
fly secrets set BACKEND_URL="https://bravos-backend.fly.dev"
fly secrets set NODE_ENV="production"
fly secrets set ADMIN_TOKEN="<gere-um-token-forte>"
```

## Passo 5: Deploy

```bash
fly deploy
```

## Passo 6: Configurar Prisma

```bash
fly ssh console
# Dentro do container:
cd /app
npx prisma generate
npx prisma db push --schema=prisma/schema.prisma
exit
```

## Passo 7: Testar

```bash
curl https://bravos-backend.fly.dev/health
```

## Próximos Passos

1. Atualizar `BACKEND_URL` no Vercel: `https://bravos-backend.fly.dev`
2. Configurar webhook Mercado Pago: `https://bravos-backend.fly.dev/api/mp/webhooks`
3. (Opcional) Configurar domínio: `fly certs add api.bravosbrasil.com.br`

---

**Documentação completa:** `server/FLY_DEPLOY.md`
