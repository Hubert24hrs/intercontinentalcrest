const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'john.admin@crest.com';
  
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });
    console.log(`User already exists. Updated role: ${updated.role}`);
    return;
  }

  // Create new admin user
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('SecurePass123!', salt);

  const user = await prisma.user.create({
    data: {
      fullName: 'John Admin',
      email,
      phone: '+1234567890',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });

  // Create checking account
  const checkingNo = 'CK-' + Math.floor(10000000 + Math.random() * 90000000);
  await prisma.account.create({
    data: {
      accountNumber: checkingNo,
      userId: user.id,
      accountType: 'checking',
      balance: 9800.42,
      availableBalance: 9800.42,
      currency: 'USD',
    },
  });

  // Create savings account
  const savingsNo = 'SV-' + Math.floor(10000000 + Math.random() * 90000000);
  await prisma.account.create({
    data: {
      accountNumber: savingsNo,
      userId: user.id,
      accountType: 'savings',
      balance: 14500.00,
      availableBalance: 14500.00,
      currency: 'USD',
    },
  });

  console.log(`Created admin user John Admin (${email}) with password 'SecurePass123!' and checking/savings accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
