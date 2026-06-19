const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'john.admin@crest.com';
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
  });
  console.log(`Successfully promoted user ${user.fullName} (${user.email}) to role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
