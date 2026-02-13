-- AlterTable: Add risk/telemetry fields to orders (MVP anti-fraud, non-blocking)
ALTER TABLE "orders" ADD COLUMN "ip_address" TEXT;
ALTER TABLE "orders" ADD COLUMN "user_agent" TEXT;
ALTER TABLE "orders" ADD COLUMN "risk_score" INTEGER DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "risk_flag" BOOLEAN DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "risk_reasons" TEXT;
