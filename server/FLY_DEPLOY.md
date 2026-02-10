# 🚀 Deploy no Fly.io - BRAVOS BRASIL Backend

## Pré-requisitos

1. Conta no Fly.io: https://fly.io/app/sign-up
2. Fly CLI instalado: https://fly.io/docs/hands-on/install-flyctl/

### Instalar Fly CLI (Windows)

```powershell
# Via PowerShell (como Admin)
iwr https://fly.io/install.ps1 -useb | iex
```

Ou baixe manualmente: https://github.com/superfly/flyctl/releases

## Passo 1: Login no Fly.io

```bash
fly auth login
```

Isso abrirá o navegador para autenticação.

## Passo 2: Criar o App

```bash
cd server
fly launch
```

O Fly CLI vai perguntar:
- **App name**: `bravos-backend` (ou escolha outro)
- **Region**: `gru` (São Paulo) - escolha a mais próxima do Brasil
- **PostgreSQL**: Não (já temos Supabase)
- **Redis**: Não

## Passo 3: Configurar Variáveis de Ambiente

```bash
# Variáveis obrigatórias
fly secrets set DATABASE_URL="postgresql://postgres:Vn7vmNPalEk9H4wC@db.thntrxrqxupaajovnepy.supabase.co:5432/postgres?sslmode=require"
fly secrets set MP_ACCESS_TOKEN="APP_USR-<seu-token-producao>"
fly secrets set FRONTEND_URL="https://www.bravosbrasil.com.br"
fly secrets set BACKEND_URL="https://bravos-backend.fly.dev"
fly secrets set NODE_ENV="production"

# Admin (opcional, mas recomendado)
fly secrets set ADMIN_TOKEN="<gere-um-token-forte-aleatorio>"

# Montink (opcional)
fly secrets set MONTINK_API_TOKEN="<se-tiver>"
fly secrets set MONTINK_BASE_URL="https://api.montink.com.br"
fly secrets set MONTINK_CREATE_ORDER_ENABLED="false"
```

### Gerar ADMIN_TOKEN forte:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Passo 4: Deploy

```bash
fly deploy
```

O Fly.io vai:
1. Buildar a aplicação (usando Dockerfile)
2. Fazer deploy
3. Iniciar o serviço

## Passo 5: Verificar Deploy

```bash
# Ver logs
fly logs

# Ver status
fly status

# Testar health check
curl https://bravos-backend.fly.dev/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "BRAVOS BRASIL API"
}
```

## Passo 6: Configurar Prisma (IMPORTANTE)

Após o primeiro deploy, você precisa rodar o Prisma:

```bash
# Entrar no container
fly ssh console

# Dentro do container:
cd /app
npx prisma generate
npx prisma db push --schema=prisma/schema.prisma

# Sair
exit
```

## Passo 7: Configurar Domínio Customizado (Opcional)

Se quiser usar `api.bravosbrasil.com.br`:

```bash
# Adicionar domínio
fly certs add api.bravosbrasil.com.br

# Ver instruções DNS
fly certs show api.bravosbrasil.com.br
```

Depois configure o DNS:
- Tipo: `CNAME`
- Nome: `api`
- Valor: `<hostname-fornecido-pelo-fly>`

## Comandos Úteis

```bash
# Ver logs em tempo real
fly logs

# Ver status do app
fly status

# Escalar (se necessário)
fly scale count 1

# Ver variáveis de ambiente (sem valores)
fly secrets list

# Atualizar variável
fly secrets set VAR_NAME="new_value"

# Reiniciar app
fly apps restart bravos-backend

# SSH no container
fly ssh console

# Ver métricas
fly metrics
```

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se o build foi executado: `npm run build`
- Verifique se o `dist/` existe

### Erro: "Database connection failed"
- Verifique `DATABASE_URL` com `fly secrets list`
- Teste conexão: `fly ssh console` → `npx prisma db push`

### Erro: "Port already in use"
- Fly.io usa porta 8080 automaticamente
- Verifique se `PORT=8080` está no `fly.toml`

### App não inicia
```bash
# Ver logs detalhados
fly logs --app bravos-backend

# Verificar status
fly status
```

## Monitoramento

- **Logs**: `fly logs`
- **Métricas**: Dashboard do Fly.io
- **Health Check**: `https://bravos-backend.fly.dev/health`

## Custos

**Free Tier:**
- 3 VMs compartilhadas
- 256MB RAM cada
- 3GB storage
- 160GB egress/mês

**Suficiente para MVP!** 🎉

## Próximos Passos

1. ✅ Deploy feito
2. ✅ Prisma configurado
3. ⏳ Configurar webhook Mercado Pago: `https://bravos-backend.fly.dev/api/mp/webhooks`
4. ⏳ Testar fluxo completo
5. ⏳ Configurar domínio customizado (opcional)
