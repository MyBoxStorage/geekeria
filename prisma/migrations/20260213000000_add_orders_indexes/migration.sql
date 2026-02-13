-- CreateIndex: Index on mp_payment_id for payment lookups (reconcile, webhook idempotency)
CREATE INDEX IF NOT EXISTS "orders_mp_payment_id_idx" ON "orders"("mp_payment_id");

-- CreateIndex: Composite index on (status, created_at) for reconcile-pending queries
CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx" ON "orders"("status", "created_at");
