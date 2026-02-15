# Validação cancel-abandoned em Produção

## Status: PARCIAL — endpoint retorna 404

O endpoint `POST /api/internal/cancel-abandoned` retornou **404 Route not found** em produção.  
**Ação:** Dispare um deploy manual em GitHub Actions (Actions → Deploy Backend to Fly.io → Run workflow).

---

## PASSO 0 — Health ✅

```json
{"status":"ok","timestamp":"2026-02-13T16:35:45.712Z","service":"BRAVOS BRASIL API"}
```

---

## PASSO 1 — Pedidos de teste inseridos (MCP Supabase) ✅

**1.2) Evidência:**
```json
[
  {"id":"abandoned_c740c56e8c5e60402a70","external_reference":"abandoned_test_1_1771000961","status":"PENDING","mp_payment_id":null,"created_at":"2026-02-13 14:42:41.372"},
  {"id":"abandoned_5dc2d632394a273a59f9","external_reference":"abandoned_test_2_1771000961","status":"PENDING","mp_payment_id":null,"created_at":"2026-02-13 14:42:41.372"}
]
```

---

## PASSO 2 — Dry Run ❌ (404)

```
[FAIL] cancel-abandoned 404: {"error":"Route not found"}
```

---

## PASSO 3 — Apply ❌ (não executado)

---

## PASSO 4 — Evidência admin_events

```json
[]
```
(Nenhum evento criado — API não respondeu)

---

## PASSO 5 — Monitor ✅

```json
{
  "ok": true,
  "db": {"ok": true},
  "pendingTooLong": {"count": 0, "examples": []},
  "abandonedPending": {"count": 2, "examples": ["abandoned_test_1_1771000961", "abandoned_test_2_1771000961"]},
  "failedWebhooks": {"count": 0},
  "ignoredWebhooksLast24h": {"count": 2}
}
```

---

## PASSO 6 — Cleanup (aguardando validação completa)

Após deploy e validação, execute no Supabase:
```sql
DELETE FROM orders WHERE external_reference LIKE 'abandoned_test_%';
```

---

## Comandos para validação pós-deploy

```bash
# 1) Dry run
node scripts/cancel-abandoned.js "https://bravosbackend.fly.dev"

# 2) Apply
node scripts/cancel-abandoned.js "https://bravosbackend.fly.dev" --apply
```

ADMIN_TOKEN é carregado de `server/.env` se não informado.
