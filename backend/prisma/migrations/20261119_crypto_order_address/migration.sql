-- Crypto deposits/withdrawals are now recorded as crypto orders (type "deposit" / "withdrawal")
-- instead of USD ledger entries on the checking account. Store the withdrawal destination.
ALTER TABLE "crypto_orders" ADD COLUMN IF NOT EXISTS "network_address" TEXT;
