/**
 * setup-admin.mjs
 * Runs during vercel-build to upsert the super_admin account into Neon.
 * Reads credentials from ADMIN_EMAIL, ADMIN_PASSWORD, and DATABASE_URL env vars.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.warn('[setup-admin] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin upsert.');
  process.exit(0);
}

// Use DIRECT_URL for migrations/seeding (bypasses PgBouncer prepared statement restrictions)
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn('[setup-admin] No DATABASE_URL — skipping admin upsert.');
  process.exit(0);
}

process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient();

async function main() {
  console.log('[setup-admin] Upserting super_admin account…');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existing = await prisma.user.findFirst({ where: { role: 'super_admin' } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { email: ADMIN_EMAIL, passwordHash: hash },
    });
    console.log(`[setup-admin] ✅ Admin updated → ${ADMIN_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        fullName: 'Super Admin',
        email: ADMIN_EMAIL,
        passwordHash: hash,
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
    });
    console.log(`[setup-admin] ✅ Admin created → ${ADMIN_EMAIL}`);
  }
}

main()
  .catch(e => {
    console.error('[setup-admin] ❌ Failed:', e?.message || e);
    // Don't fail the build over this — admin can be created via syncAdminCredentials at runtime
    process.exit(0);
  })
  .finally(() => prisma.$disconnect());
