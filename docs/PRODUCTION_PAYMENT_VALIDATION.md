# Production Payment Validation — BRAVOS BRASIL

Runbook for validating the full payment + webhook + order status flow in production (real PIX). No code changes; documentation and process only.

---

## A) When to run

- After a **backend deploy** (Fly).
- After **Mercado Pago webhook URL or secret** changes.
- After **checkout or pending page** changes that affect PIX flow.
- Before or after a **go-live** event.

---

## B) Pre-checks

1. **GitHub Actions**  
   Last run of **Deploy Backend to Fly.io** is green (backend deploy succeeded).

2. **Fly app running**  
   ```bash
   fly status -a bravos-backend
   ```  
   Confirm the app is running and no failed machines.

3. **Release command succeeded**  
   In [Fly Dashboard](https://fly.io/dashboard) → **bravos-backend** → **Releases**: latest release shows **release_command** (Prisma migrate) completed with no errors.

4. **Fly secrets present** (names only; do not print values)  
   ```bash
   fly secrets list -a bravos-backend
   ```  
   Confirm these **names** exist:  
   `DATABASE_URL`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `FRONTEND_URL`, `BACKEND_URL`, `ADMIN_TOKEN`.

---

## C) Quick API smoke (existing script)

From repo root (Node 18+):

```bash
node scripts/go-live-check.js <API_URL> <FRONT_URL>
```

Example (replace with your production URLs):

```bash
node scripts/go-live-check.js https://bravos-backend.fly.dev https://www.bravosbrasil.com.br
```

- **Expected:** `Overall: PASS` and exit code 0.
- If any check fails, fix API/health/admin/payment endpoint before running real PIX.

---

## D) Real PIX validation steps

1. **Create order**  
   Open production site → add product to cart → fill checkout (name, email, address) → choose **PIX** → complete payment with a **real PIX** (low value).

2. **Redirect**  
   You should land on:  
   `/checkout/pending?payment_id=...&external_reference=...`  
   Confirm URL contains `payment_id` and `external_reference`.

3. **Pending page**  
   - QR code **or** copy-and-paste (copia e cola) is shown.  
   - No relevant errors in browser console (F12).  
   - No 429 (rate limit) in Network tab.

4. **Webhook execution**  
   Right after payment:  
   ```bash
   fly logs -a bravos-backend
   ```  
   Look for: webhook received, payment fetched from MP, order updated (e.g. to `READY_FOR_MONTINK`).

5. **If no webhook in Fly logs**  
   Mercado Pago → **Your integrations** → **Webhooks** → **Delivery logs**.  
   Confirm the request to your webhook URL returned **HTTP 200**.

6. **Database state (Supabase)**  
   In Supabase → **SQL Editor** run (adjust table/column names if your schema differs):  
   ```sql
   SELECT "externalReference", status, "mpPaymentId"
   FROM "Order"
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```  
   **Expected:** `status` = `READY_FOR_MONTINK`, `mpPaymentId` NOT NULL for the order you just paid.

7. **Order page**  
   Visit: `/order?ref=<EXTERNAL_REFERENCE>` (use the value from the pending URL or SQL).  
   Confirm status is displayed correctly and there are no email mismatch errors.

---

## E) Failure triage (artifacts to capture)

If any step fails, capture and share (no secret values):

| Step / symptom      | Artifact to capture                                      |
|---------------------|-----------------------------------------------------------|
| Fly / webhook       | Fly logs snippet (last 50–100 lines around payment time) |
| MP webhook delivery| MP dashboard → Webhooks → Delivery logs (status / HTTP)   |
| Database            | SQL query output (last order row, anonymize if needed)   |
| Frontend / pending  | Browser console screenshot or copy of errors             |

Report exactly which step failed and what you saw (e.g. “Step 4: no webhook line in Fly logs” or “Step 6: status still PENDING”).

---

## Monitoring

- **Endpoint:** `GET /api/internal/monitor` (requires header `x-admin-token` = `ADMIN_TOKEN`). Returns `ok`, DB status, counts of PENDING-too-long orders and failed webhooks (with safe example IDs only).
- **Script:** `node scripts/monitor-check.js <API_URL> <ADMIN_TOKEN>` — exit 0 if `ok:true`, 1 otherwise; does not print the token.
- **UptimeRobot / cron:** Configure an HTTP(S) monitor to `GET https://<backend>/api/internal/monitor` with custom header `x-admin-token: <your-admin-token>`, or run the script periodically (e.g. every 5–10 min) and alert on exit code 1.

---

## Auto-reconciliation

The **Reconcile Pending** job runs periodically (e.g. every 15 minutes via GitHub Actions) and calls `POST /api/internal/reconcile-pending`. It finds PENDING orders older than a threshold (default 15 minutes), fetches their current status from Mercado Pago, and updates the database when MP status differs from the stored one. Orders without `mpPaymentId` are never guessed; they are skipped and reported as `skippedMissingPaymentId`.

- **What it does:** Queries MP for each stale PENDING order that has `mpPaymentId`, maps MP status to `OrderStatus` (same logic as the webhook), and updates the order when different. Optionally triggers Montink fulfillment when status becomes `READY_FOR_MONTINK`.
- **When to trigger manually:** Use **Actions** → **Reconcile Pending (Production)** → **Run workflow** after suspected webhook gaps or to catch up after downtime. You can also run locally: `node scripts/reconcile-pending.js <API_URL> <ADMIN_TOKEN>`.
- **Safety:** The endpoint never marks an order as paid without a successful MP fetch; it never guesses when `mpPaymentId` is missing. It is protected by `x-admin-token` and a rate limit (10 requests per 5 minutes).

---

## Audit

To retrieve the **timeline and events** for a single order (e.g. after a failed webhook or reconciliation):

- **Endpoint:** `GET /api/admin/orders/:externalReference/audit` with header `x-admin-token` = `ADMIN_TOKEN`.
- **Response (no PII):** `order` (externalReference, status, mpPaymentId, mpStatus, createdAt, updatedAt), `adminEvents` (last 50: action, createdAt, metadata), `webhookEvents` (last 50 for that payment: eventId, eventType, status, receivedAt, processedAt, errorMessage). No email, address, or payload.
- Use this to confirm reconcile runs, webhook processing, and manual admin actions (e.g. MARK_MONTINK, RECONCILE_UPDATED_STATUS).

---

## Expected result

- Payment processed (PIX).
- Webhook verified (200, no 401).
- Order status updated in DB.
- No manual DB or MP intervention.
- No retry loops or repeated errors in logs.
