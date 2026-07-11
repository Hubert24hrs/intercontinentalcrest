-- AlterTable: Add admin adjustment fields to transactions
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "reason" TEXT,
  ADD COLUMN IF NOT EXISTS "admin_reference" TEXT,
  ADD COLUMN IF NOT EXISTS "performed_by_admin_id" TEXT;

-- AddForeignKey
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_performed_by_admin_id_fkey"
  FOREIGN KEY ("performed_by_admin_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
