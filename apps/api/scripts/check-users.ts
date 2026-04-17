import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { wallet: true },
    orderBy: { created_at: 'asc' },
  });

  console.log('\n=== USUARIOS Y WALLETS ===\n');
  for (const u of users) {
    console.log(`Name            : ${u.name}`);
    console.log(`Email           : ${u.email}`);
    console.log(`Role            : ${u.role}`);
    console.log(`Wallet ID       : ${u.wallet?.id ?? 'SIN WALLET'}`);
    console.log(`balance_available: ${u.wallet?.balance_available ?? '-'}`);
    console.log(`balance_frozen   : ${u.wallet?.balance_frozen ?? '-'}`);
    console.log('─'.repeat(40));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
