-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_discount_amount" DOUBLE PRECISION;
