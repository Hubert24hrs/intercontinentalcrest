#!/usr/bin/env bash
# ============================================================================
# Intercontinental Crest — SQLite → Neon Postgres Migration Apply Script
# ============================================================================
# Run this from the repo root: bash apply-migration.sh
#
# This script applies ALL code changes automatically. You only need to:
# 1. Run this script
# 2. Set Vercel environment variables (see MIGRATION_GUIDE.md)
# 3. Commit, push, and deploy
# ============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

echo "========================================"
echo "  Neon Postgres Migration Apply Script"
echo "========================================"
echo ""

# Check we're in the right place
if [ ! -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
    echo "❌ Error: backend/prisma/schema.prisma not found."
    echo "   Run this script from the repo root directory."
    exit 1
fi

echo "✅ Found backend/prisma/schema.prisma"
echo ""

# ----------------------------------------------------------------------------
# STEP 1: Backup existing files
# ----------------------------------------------------------------------------
echo "📦 Creating backups..."
BACKUP_DIR="$REPO_ROOT/.migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp "$BACKEND_DIR/prisma/schema.prisma" "$BACKUP_DIR/"
cp "$BACKEND_DIR/src/main.ts" "$BACKUP_DIR/"
cp "$BACKEND_DIR/src/auth/jwt.strategy.ts" "$BACKUP_DIR/"
cp "$BACKEND_DIR/src/auth/auth.controller.ts" "$BACKUP_DIR/"
cp "$BACKEND_DIR/src/auth/auth.service.ts" "$BACKUP_DIR/"
cp "$BACKEND_DIR/vercel.json" "$BACKUP_DIR/"
cp "$BACKEND_DIR/package.json" "$BACKUP_DIR/"

echo "   Backups saved to: $BACKUP_DIR"
echo ""

# ----------------------------------------------------------------------------
# STEP 2: Remove SQLite database file
# ----------------------------------------------------------------------------
echo "🗑️  Removing SQLite database file..."
if [ -f "$BACKEND_DIR/prisma/dev.db" ]; then
    rm "$BACKEND_DIR/prisma/dev.db"
    echo "   ✅ Removed backend/prisma/dev.db"
else
    echo "   ℹ️  backend/prisma/dev.db not found (already removed)"
fi

# Remove from .gitignore if present
if [ -f "$REPO_ROOT/.gitignore" ]; then
    if grep -q "dev.db" "$REPO_ROOT/.gitignore"; then
        sed -i '/dev.db/d' "$REPO_ROOT/.gitignore"
        echo "   ✅ Removed dev.db from .gitignore"
    fi
fi
echo ""

# ----------------------------------------------------------------------------
# STEP 3: Apply schema.prisma
# ----------------------------------------------------------------------------
echo "📝 Applying schema.prisma..."
cat > "$BACKEND_DIR/prisma/schema.prisma" << 'PRISMA_EOF'
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x", "rhel-openssl-3.0.x"]
}

// NOTE: Fields that represent fixed value sets (role, status, accountType, etc.)
// are kept as String rather than native Prisma enums to minimize migration risk.
// Converting to enums would require a data-migration step for existing data.
// If you want native enums later, run: prisma migrate dev --create-only
// and add the enum definitions before the model changes.

model User {
  id                   String        @id @default(uuid())
  fullName             String        @map("full_name")
  email                String        @unique
  phone                String?       @unique
  passwordHash         String        @map("password_hash")
  role                 String        @default("customer") // customer, admin, super_admin, support
  status               String        @default("active") // active, suspended, inactive, pending_verification
  emailVerified        Boolean       @default(false) @map("email_verified")
  phoneVerified        Boolean       @default(false) @map("phone_verified")
  twoFactorEnabled     Boolean       @default(false) @map("two_factor_enabled")
  twoFactorSecret      String?       @map("two_factor_secret")
  passwordResetToken   String?       @map("password_reset_token")
  passwordResetExpiry  DateTime?     @map("password_reset_expiry")
  failedLoginAttempts  Int           @default(0) @map("failed_login_attempts")
  lockedUntil          DateTime?     @map("locked_until")
  lastLogin            DateTime?     @map("last_login")
  createdAt            DateTime      @default(now()) @map("created_at")
  updatedAt            DateTime      @updatedAt @map("updated_at")

  accounts             Account[]
  beneficiaries        Beneficiary[]
  kycDocuments         KycDocument[] @relation("KycDocuments")
  reviewedKycDocuments KycDocument[] @relation("KycReviewer")
  loans                Loan[]        @relation("LoanCustomer")
  approvedLoans        Loan[]        @relation("LoanApprover")
  investments          Investment[]
  notifications        Notification[]
  auditLogs            AuditLog[]
  cryptoHoldings       CryptoHolding[]
  cryptoOrders         CryptoOrder[]
  cryptoWallets        CryptoWallet[]

  @@map("users")
}

model CryptoHolding {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  coinId      String   @map("coin_id")       // e.g. "bitcoin"
  coinSymbol  String   @map("coin_symbol")   // e.g. "BTC"
  coinName    String   @map("coin_name")     // e.g. "Bitcoin"
  quantity    Decimal
  avgBuyPrice Decimal  @map("avg_buy_price") // weighted average cost
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, coinId])
  @@map("crypto_holdings")
}

model CryptoOrder {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  coinId      String   @map("coin_id")
  coinSymbol  String   @map("coin_symbol")
  coinName    String   @map("coin_name")
  type        String                        // "buy" | "sell"
  quantity    Decimal
  priceAtTime Decimal  @map("price_at_time") // USD price per coin at execution
  totalUsd    Decimal  @map("total_usd")
  fee         Decimal  @default(0.00)
  status      String   @default("completed") // completed | failed
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("crypto_orders")
}

model Account {
  id               String       @id @default(uuid())
  accountNumber    String       @unique @map("account_number")
  accountName      String?      @map("account_name")
  userId           String       @map("user_id")
  accountType      String       @default("checking") @map("account_type") // savings, checking, business, investment
  balance          Decimal      @default(0.00)
  availableBalance Decimal      @default(0.00) @map("available_balance")
  currency         String       @default("USD")
  isFrozen         Boolean      @default(false) @map("is_frozen")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  sentTransfers    Transaction[] @relation("SenderAccount")
  receivedTransfers Transaction[] @relation("ReceiverAccount")
  loans            Loan[]

  @@map("accounts")
}

model Transaction {
  id                   String            @id @default(uuid())
  transactionReference String            @unique @map("transaction_reference")
  senderAccountId      String?           @map("sender_account_id")
  receiverAccountId    String?           @map("receiver_account_id")
  amount               Decimal
  fee                  Decimal           @default(0.00)
  currency             String            @default("USD")
  status               String            @default("pending") // pending, completed, failed, reversed
  type                 String
  description          String?
  metadata             Json?             // Native Postgres JSONB; was serialized JSON string in SQLite
  ipAddress            String?           @map("ip_address")
  createdAt            DateTime          @default(now()) @map("created_at")
  updatedAt            DateTime          @updatedAt @map("updated_at")

  senderAccount        Account?          @relation("SenderAccount", fields: [senderAccountId], references: [id])
  receiverAccount      Account?          @relation("ReceiverAccount", fields: [receiverAccountId], references: [id])

  @@map("transactions")
}

model Beneficiary {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  beneficiaryName String   @map("beneficiary_name")
  accountNumber   String   @map("account_number")
  bankName        String?  @map("bank_name")
  bankCode        String?  @map("bank_code")
  swiftCode       String?  @map("swift_code")
  iban            String?
  currency        String   @default("USD")
  country         String?
  isInternational Boolean  @default(false) @map("is_international")
  createdAt       DateTime @default(now()) @map("created_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("beneficiaries")
}

model KycDocument {
  id                 String    @id @default(uuid())
  userId             String    @map("user_id")
  status             String    @default("pending") // not_submitted, pending, approved, rejected
  documentType       String    @map("document_type")
  documentFrontUrl   String?   @map("document_front_url")
  documentBackUrl    String?   @map("document_back_url")
  selfieUrl          String?   @map("selfie_url")
  proofOfAddressUrl  String?   @map("proof_of_address_url")
  reviewerId         String?   @map("reviewer_id")
  reviewerNotes      String?   @map("reviewer_notes")
  reviewedAt         DateTime? @map("reviewed_at")
  submittedAt        DateTime  @default(now()) @map("submitted_at")
  createdAt          DateTime  @default(now()) @map("created_at")

  user               User      @relation("KycDocuments", fields: [userId], references: [id], onDelete: Cascade)
  reviewer           User?     @relation("KycReviewer", fields: [reviewerId], references: [id])

  @@map("kyc_documents")
}

model Loan {
  id                 String     @id @default(uuid())
  userId             String     @map("user_id")
  accountId          String?    @map("account_id")
  loanType           String     @map("loan_type")
  principalAmount    Decimal    @map("principal_amount")
  interestRate       Decimal    @map("interest_rate")
  termMonths         Int        @map("term_months")
  monthlyPayment     Decimal?   @map("monthly_payment")
  outstandingBalance Decimal?   @map("outstanding_balance")
  status             String     @default("pending") // pending, approved, active, completed, defaulted, rejected
  ssn                String?    @map("ssn")
  selectedCrypto     String?    @map("selected_crypto")
  cryptoAmount       Decimal?   @map("crypto_amount")
  disbursementType   String?    @default("bank") @map("disbursement_type") // bank | crypto_wallet | external_bank
  disbursementDestination String? @map("disbursement_destination")
  approvedBy         String?    @map("approved_by")
  approvedAt         DateTime?  @map("approved_at")
  disbursedAt        DateTime?  @map("disbursed_at")
  dueDate            DateTime?  @map("due_date")
  createdAt          DateTime   @default(now()) @map("created_at")
  updatedAt          DateTime   @updatedAt @map("updated_at")

  user               User       @relation("LoanCustomer", fields: [userId], references: [id], onDelete: Cascade)
  account            Account?   @relation(fields: [accountId], references: [id])
  approver           User?      @relation("LoanApprover", fields: [approvedBy], references: [id])

  @@map("loans")
}

model Investment {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  planName        String    @map("plan_name")
  principalAmount Decimal   @map("principal_amount")
  currentValue    Decimal?  @map("current_value")
  interestRate    Decimal?  @map("interest_rate")
  startDate       DateTime? @map("start_date")
  maturityDate    DateTime? @map("maturity_date")
  status          String    @default("active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("investments")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  title     String
  message   String
  type      String   @default("info")
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?  @map("user_id")
  action     String
  entityType String?  @map("entity_type")
  entityId   String?  @map("entity_id")
  oldValues  Json?    @map("old_values")   // Native Postgres JSONB; was serialized JSON string in SQLite
  newValues  Json?    @map("new_values")   // Native Postgres JSONB; was serialized JSON string in SQLite
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User?    @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}

model CryptoWallet {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  coinId      String   @map("coin_id")       // e.g. "bitcoin"
  coinSymbol  String   @map("coin_symbol")   // e.g. "BTC"
  coinName    String   @map("coin_name")     // e.g. "Bitcoin"
  address     String
  balance     Decimal  @default(0.00)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, coinId])
  @@map("crypto_wallets")
}

PRISMA_EOF
echo "   ✅ backend/prisma/schema.prisma updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 4: Copy migration files
# ----------------------------------------------------------------------------
echo "📂 Copying migration files..."
mkdir -p "$BACKEND_DIR/prisma/migrations"

# migration_lock.toml
cat > "$BACKEND_DIR/prisma/migrations/migration_lock.toml" << 'LOCK_EOF'
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
LOCK_EOF

# Create migration directory
MIGRATION_DIR="$BACKEND_DIR/prisma/migrations/20260704114100_init"
mkdir -p "$MIGRATION_DIR"

cat > "$MIGRATION_DIR/migration.sql" << 'MIGRATION_EOF'
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "status" TEXT NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expiry" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_holdings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coin_id" TEXT NOT NULL,
    "coin_symbol" TEXT NOT NULL,
    "coin_name" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "avg_buy_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coin_id" TEXT NOT NULL,
    "coin_symbol" TEXT NOT NULL,
    "coin_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "price_at_time" DECIMAL(65,30) NOT NULL,
    "total_usd" DECIMAL(65,30) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crypto_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT,
    "user_id" TEXT NOT NULL,
    "account_type" TEXT NOT NULL DEFAULT 'checking',
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "available_balance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "transaction_reference" TEXT NOT NULL,
    "sender_account_id" TEXT,
    "receiver_account_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_name" TEXT,
    "bank_code" TEXT,
    "swift_code" TEXT,
    "iban" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "country" TEXT,
    "is_international" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "document_type" TEXT NOT NULL,
    "document_front_url" TEXT,
    "document_back_url" TEXT,
    "selfie_url" TEXT,
    "proof_of_address_url" TEXT,
    "reviewer_id" TEXT,
    "reviewer_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "loan_type" TEXT NOT NULL,
    "principal_amount" DECIMAL(65,30) NOT NULL,
    "interest_rate" DECIMAL(65,30) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "monthly_payment" DECIMAL(65,30),
    "outstanding_balance" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ssn" TEXT,
    "selected_crypto" TEXT,
    "crypto_amount" DECIMAL(65,30),
    "disbursement_type" TEXT DEFAULT 'bank',
    "disbursement_destination" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "disbursed_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "principal_amount" DECIMAL(65,30) NOT NULL,
    "current_value" DECIMAL(65,30),
    "interest_rate" DECIMAL(65,30),
    "start_date" TIMESTAMP(3),
    "maturity_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coin_id" TEXT NOT NULL,
    "coin_symbol" TEXT NOT NULL,
    "coin_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_holdings_user_id_coin_id_key" ON "crypto_holdings"("user_id", "coin_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_number_key" ON "accounts"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_reference_key" ON "transactions"("transaction_reference");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_wallets_user_id_coin_id_key" ON "crypto_wallets"("user_id", "coin_id");

-- AddForeignKey
ALTER TABLE "crypto_holdings" ADD CONSTRAINT "crypto_holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crypto_orders" ADD CONSTRAINT "crypto_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sender_account_id_fkey" FOREIGN KEY ("sender_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_account_id_fkey" FOREIGN KEY ("receiver_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crypto_wallets" ADD CONSTRAINT "crypto_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

MIGRATION_EOF

echo "   ✅ backend/prisma/migrations/ created"
echo "      - migration_lock.toml"
echo "      - 20260704114100_init/migration.sql"
echo ""

# ----------------------------------------------------------------------------
# STEP 5: Apply main.ts
# ----------------------------------------------------------------------------
echo "📝 Applying main.ts..."
cat > "$BACKEND_DIR/src/main.ts" << 'MAIN_EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

let cachedServer: any;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://intercontinentalcrest.vercel.app',
  'https://intercontinentalcrest-backend.vercel.app',
];

function corsOriginHandler(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  // Allow requests with no origin (mobile apps, Postman, server-to-server)
  if (!origin) return callback(null, true);

  // Allow any *.vercel.app domain and localhost in development
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)
  ) {
    return callback(null, true);
  }

  callback(null, false);
}

/**
 * Ensure the super_admin account exists with the latest credentials from env vars.
 * Runs once per cold start using the singleton PrismaService to avoid connection leaks.
 */
async function syncAdminCredentials(prisma: PrismaService) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  try {
    const hash = await bcrypt.hash(adminPassword, 12);
    const existing = await prisma.user.findFirst({ where: { role: 'super_admin' } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { email: adminEmail, passwordHash: hash } });
      console.log(`[Admin] Credentials synced → ${adminEmail}`);
    }
  } catch (e: any) {
    console.error('[Admin] Failed to sync credentials:', e?.message);
  }
}

export async function bootstrapExpress(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: corsOriginHandler,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Sync admin credentials on cold start using the singleton PrismaService
  const prisma = app.get(PrismaService);
  await syncAdminCredentials(prisma);

  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: corsOriginHandler,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Banking API running on: http://localhost:${port}/api`);
}

if (!process.env.VERCEL) {
  bootstrap();
}

MAIN_EOF
echo "   ✅ backend/src/main.ts updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 6: Apply jwt.strategy.ts
# ----------------------------------------------------------------------------
echo "📝 Applying jwt.strategy.ts..."
cat > "$BACKEND_DIR/src/auth/jwt.strategy.ts" << 'JWT_EOF'
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['accessToken'] || req.cookies['jwt'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretjwtkey!changeme',
    });
  }

  /**
   * Validate the JWT by doing a lightweight DB lookup.
   *
   * DECISION (2026-07-04): Now that the database is persistent (Neon Postgres),
   * we re-enable per-request DB lookups instead of trusting the JWT payload blindly.
   * This allows real-time enforcement of account suspension/deletion and costs
   * ~1-2ms for an indexed primary-key lookup — negligible compared to the network round-trip.
   *
   * The previous JWT-trust approach was a workaround for the SQLite-on-/tmp cold-start bug
   * where recently-registered users were invisible to fresh serverless instances.
   */
  async validate(payload: any) {
    if (!payload?.sub) throw new UnauthorizedException('Invalid token');

    const user = await this.usersService.findOneById(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    if (user.status === 'suspended') throw new UnauthorizedException('Account suspended');
    if (user.status === 'inactive') throw new UnauthorizedException('Account inactive');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }
}

JWT_EOF
echo "   ✅ backend/src/auth/jwt.strategy.ts updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 7: Apply auth.controller.ts
# ----------------------------------------------------------------------------
echo "📝 Applying auth.controller.ts..."
cat > "$BACKEND_DIR/src/auth/auth.controller.ts" << 'AUTHCTRL_EOF'
import { Controller, Post, Patch, Body, Res, Req, UseGuards, Get, HttpCode, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2FaDto } from './dto/verify-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
}

class ChangePasswordDto {
  @IsNotEmpty() @IsString() currentPassword: string;
  @IsNotEmpty() @IsString() @MinLength(12) newPassword: string;
}

class ForgotPasswordDto {
  @IsNotEmpty() @IsString() email: string;
}

class ResetPasswordDto {
  @IsNotEmpty() @IsString() token: string;
  @IsNotEmpty() @IsString() @MinLength(12) newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(loginDto);
    const result = await this.authService.login(user) as any;

    if (result.require2Fa) return result;

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generate2Fa(@Req() req: any) {
    return this.authService.generate2FaSecret(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2Fa(@Req() req: any, @Body() verifyDto: Verify2FaDto) {
    return this.authService.verify2FaSetup(req.user.id, verifyDto.code);
  }

  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate2Fa(
    @Body('tempToken') tempToken: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.authenticate2Fa(tempToken, code) as any;
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2Fa(@Req() req: any, @Body() verifyDto: Verify2FaDto) {
    return this.authService.disable2Fa(req.user.id, verifyDto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Accept refresh token from cookie (standard browsers) or request body (iOS Safari — ITP blocks cross-site cookies)
    const refreshToken = (req as any).cookies?.['refreshToken'] || (req as any).body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const result = await this.authService.refreshAccessToken(refreshToken) as any;
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    // Return fresh user data from the persistent database (Neon Postgres).
    // No fallback to JWT payload needed — the DB is now reliably consistent
    // across all serverless instances.
    const freshUser = await this.authService.getUserById(req.user.id);
    if (freshUser) {
      return {
        user: {
          id: freshUser.id,
          fullName: freshUser.fullName,
          email: freshUser.email,
          role: freshUser.role,
          phone: freshUser.phone,
          twoFactorEnabled: freshUser.twoFactorEnabled,
        },
      };
    }
    return { user: req.user };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // Vercel serverless builds may not set NODE_ENV to 'production' reliably.
    // Also check VERCEL === '1' to ensure secure cookies on deployed environments.
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}

AUTHCTRL_EOF
echo "   ✅ backend/src/auth/auth.controller.ts updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 8: Apply auth.service.ts
# ----------------------------------------------------------------------------
echo "📝 Applying auth.service.ts..."
cat > "$BACKEND_DIR/src/auth/auth.service.ts" << 'AUTHSVC_EOF'
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      phone: registerDto.phone,
      passwordHash,
    });

    try {
      const { text, html } = this.emailService.getWelcomeEmailTemplate(user.fullName);
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to Intercontinental Crest — Account Opened Successfully!',
        text,
        html,
      });
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(user: any) {
    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, isTemp2fa: true },
        { expiresIn: '5m' },
      );
      return { require2Fa: true, tempToken };
    }
    return this.generateTokens(user);
  }

  async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, fullName: user.fullName };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (!payload?.sub) throw new UnauthorizedException('Refresh token is invalid or expired');

    // With Neon Postgres the database is persistent across all serverless instances,
    // so we always do a real DB lookup. Removed the JWT-payload fallback that was a
    // workaround for the SQLite-on-/tmp cold-start bug.
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    return this.generateTokens(user);
  }

  async getUserById(id: string) {
    return this.usersService.findOneById(id).catch(() => null);
  }

  async generate2FaSecret(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Intercontinental Crest', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    await this.usersService.update2FaSecret(userId, secret);

    return { secret, qrCodeUrl };
  }

  async verify2FaSetup(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA Setup not initiated or secret not found');
    }

    const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isVerified) throw new UnauthorizedException('Invalid 2FA code');

    await this.usersService.enable2Fa(userId);
    return { success: true };
  }

  async authenticate2Fa(tempToken: string, code: string) {
    try {
      const payload = this.jwtService.verify(tempToken);
      if (!payload.isTemp2fa) throw new UnauthorizedException('Invalid temporary token');

      const user = await this.usersService.findOneById(payload.sub);
      if (!user || !user.twoFactorSecret) {
        throw new UnauthorizedException('User or 2FA configuration not found');
      }

      const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
      if (!isVerified) throw new UnauthorizedException('Invalid 2FA code');

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired 2FA verification session');
    }
  }

  async disable2Fa(userId: string, code: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA configuration not found');
    }

    const isVerified = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isVerified) throw new UnauthorizedException('Invalid 2FA code');

    await this.usersService.disable2Fa(userId);
    return { success: true };
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    const user = await this.usersService.updateProfile(userId, data);
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const result = await this.usersService.createPasswordResetToken(email);
    // Always return success to prevent email enumeration
    if (!result) return { success: true };

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${result.token}`;

    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'Intercontinental Crest — Password Reset Request',
        text: `You requested a password reset. Click the link below to reset your password:

${resetLink}

This link expires in 1 hour. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0A2342; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #00B7F1; margin: 0; font-size: 22px;">INTERCONTINENTAL CREST</h1>
            </div>
            <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <h2 style="color: #0A2342;">Password Reset Request</h2>
              <p style="color: #6b7280;">Hi ${result.user.fullName},</p>
              <p style="color: #6b7280;">We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #00B7F1, #0078B3); color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 600; display: inline-block;">Reset My Password</a>
              </div>
              <p style="color: #9ca3af; font-size: 13px;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email — your account is safe.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">Intercontinental Crest — Secure Global Banking</p>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    await this.usersService.resetPasswordWithToken(token, newPassword);
    return { success: true };
  }
}

AUTHSVC_EOF
echo "   ✅ backend/src/auth/auth.service.ts updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 9: Apply vercel.json
# ----------------------------------------------------------------------------
echo "📝 Applying vercel.json..."
cat > "$BACKEND_DIR/vercel.json" << 'VERCEL_EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node",
      "config": {
        "maxDuration": 30,
        "includeFiles": [
          "prisma/schema.prisma",
          "node_modules/.prisma/client/**",
          "node_modules/@prisma/client/**"
        ]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}

VERCEL_EOF
echo "   ✅ backend/vercel.json updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 10: Apply package.json
# ----------------------------------------------------------------------------
echo "📝 Applying package.json..."
cat > "$BACKEND_DIR/package.json" << 'PKG_EOF'
{
  "name": "intercontinental-crest-backend",
  "version": "0.0.1",
  "description": "Enterprise Digital Banking Platform Backend API",
  "author": "Intercontinental Crest",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write "src/**/*.ts" "test/**/*.ts"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node -r tsconfig-paths/register prisma/seed.ts",
    "vercel-build": "prisma generate && prisma migrate deploy"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.1.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.4.22",
    "@nestjs/websockets": "^10.4.22",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "cookie-parser": "^1.4.6",
    "nodemailer": "^9.0.1",
    "otplib": "^12.0.1",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "pdfkit": "^0.19.1",
    "qrcode": "^1.5.3",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "socket.io": "^4.8.3"
  },
  "prisma": {
    "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/cookie-parser": "^1.4.3",
    "@types/express": "^4.17.17",
    "@types/node": "^20.3.1",
    "@types/nodemailer": "^8.0.1",
    "@types/passport-jwt": "^3.0.8",
    "@types/pdfkit": "^0.17.6",
    "@types/qrcode": "^1.5.0",
    "prisma": "^5.0.0",
    "source-map-support": "^0.5.21",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}

PKG_EOF
echo "   ✅ backend/package.json updated"
echo ""

# ----------------------------------------------------------------------------
# STEP 11: Verify changes
# ----------------------------------------------------------------------------
echo "🔍 Verifying changes..."
ERRORS=0

# Check schema provider
if ! grep -q 'provider = "postgresql"' "$BACKEND_DIR/prisma/schema.prisma"; then
    echo "   ❌ schema.prisma provider is not postgresql"
    ERRORS=$((ERRORS + 1))
fi

# Check no dev.db references
if grep -q "dev.db" "$BACKEND_DIR/vercel.json"; then
    echo "   ❌ vercel.json still references dev.db"
    ERRORS=$((ERRORS + 1))
fi

# Check no /tmp references in main.ts
if grep -q "/tmp/dev.db" "$BACKEND_DIR/src/main.ts"; then
    echo "   ❌ main.ts still references /tmp/dev.db"
    ERRORS=$((ERRORS + 1))
fi

# Check migrations exist
if [ ! -f "$BACKEND_DIR/prisma/migrations/20260704114100_init/migration.sql" ]; then
    echo "   ❌ Migration files not found"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "   ✅ All verifications passed"
else
    echo "   ❌ $ERRORS verification(s) failed — check output above"
    exit 1
fi
echo ""

# ----------------------------------------------------------------------------
# DONE
# ----------------------------------------------------------------------------
echo "========================================"
echo "  ✅ ALL CODE CHANGES APPLIED"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Set Vercel environment variables:"
echo "     https://vercel.com/dashboard"
echo ""
echo "     DATABASE_URL = postgresql://neondb_owner:****@ep-proud-unit-aty2h1xx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
echo "     DIRECT_URL   = postgresql://neondb_owner:****@ep-proud-unit-aty2h1xx.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
echo ""
echo "  2. Commit and push:"
echo "     git add -A"
echo "     git commit -m 'migrate: sqlite to neon postgres'"
echo "     git push"
echo ""
echo "  3. Vercel will auto-deploy. The build runs:"
echo "     prisma generate && prisma migrate deploy"
echo ""
echo "  4. Test: Register a user, then immediately log in from"
echo "     a different browser or incognito window."
echo ""
echo "Backups saved to: $BACKUP_DIR"
echo ""
