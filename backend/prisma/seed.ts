import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function generateAccountNumber(): Promise<string> {
  return 'IC' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

async function main() {
  console.log('Seeding database...');

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminEmail = 'admin@intercontinentalcrest.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    const adminHash = await bcrypt.hash('Admin@2026!', 12);
    const admin = await prisma.user.create({
      data: {
        fullName: 'Super Admin',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      },
    });
    console.log(`Created admin: ${admin.email}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  // ── Demo customer ─────────────────────────────────────────────────────────
  const demoEmail = 'demo@intercontinentalcrest.com';
  const demoExists = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoExists) {
    const demoHash = await bcrypt.hash('Demo@2026!', 12);
    const demo = await prisma.user.create({
      data: {
        fullName: 'Demo Customer',
        email: demoEmail,
        passwordHash: demoHash,
        role: 'customer',
        status: 'active',
        emailVerified: true,
      },
    });

    // Provision checking + savings accounts with seed balances
    const checkingAccNum = await generateAccountNumber();
    const savingsAccNum  = await generateAccountNumber();

    await prisma.account.createMany({
      data: [
        {
          userId: demo.id,
          accountNumber: checkingAccNum,
          accountType: 'checking',
          balance: 25000.00,
          availableBalance: 25000.00,
          currency: 'USD',
        },
        {
          userId: demo.id,
          accountNumber: savingsAccNum,
          accountType: 'savings',
          balance: 50000.00,
          availableBalance: 50000.00,
          currency: 'USD',
        },
      ],
    });

    console.log(`Created demo customer: ${demo.email} | checking: ${checkingAccNum} | savings: ${savingsAccNum}`);
  } else {
    console.log(`Demo customer already exists: ${demoEmail}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
