# MCP Mercado Pago – Instalação

O servidor MCP do Mercado Pago está configurado em `.cursor/mcp.json`.

## Ativar / Reinstalar

1. **Coloque seu Access Token**
   - Abra `.cursor/mcp.json`.
   - Substitua **`SEU_ACCESS_TOKEN_AQUI`** (nas duas ocorrências) pelo seu **Access Token** do Mercado Pago.
   - Token: [Painel → Suas integrações → Credenciais](https://www.mercadopago.com.br/developers/panel/credentials) (Teste ou Produção).

2. **Reinicie o Cursor**
   - Feche e abra o Cursor ou use *Reload Window* (Command Palette → "Developer: Reload Window").

3. **Conferir no Cursor**
   - **Settings** (Ctrl+,) → **Tools & Integrations** → **MCP Servers**.
   - O servidor `mercadopago-mcp-server` deve aparecer como disponível.

## Ferramenta disponível

- **search_documentation** – Busca na documentação do Mercado Pago (parâmetros: `query`, `language`: `pt` | `en` | `es`).

## SDKs (referência)

- **Client-side:** MercadoPago.js ou SDK React – tokenização de cartões e integração no front.
- **Server-side:** SDKs de backend – criar/consultar pagamentos, reembolsos, webhooks.

Documentação: https://www.mercadopago.com.br/developers/pt/docs/sdks-library/landing
