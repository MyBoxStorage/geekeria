-- Índice parcial para query cancel-abandoned: PENDING sem mp_payment_id
-- Otimiza: WHERE status='PENDING' AND mp_payment_id IS NULL AND created_at < cutoff
CREATE INDEX IF NOT EXISTS orders_pending_no_payment_created_at_idx
ON orders (created_at)
WHERE status = 'PENDING' AND mp_payment_id IS NULL;
