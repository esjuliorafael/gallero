import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { wallet: true },
    orderBy: { created_at: 'asc' },
  });

  console.log('\n=== USUARIOS Y WALLETS ===\n');
  for (const u of users) {
    console.log(`full_name        : ${u.full_name}`);
    console.log(`phone            : ${u.phone}`);
    console.log(`role             : ${u.role}`);
    console.log(`user_id          : ${u.id}`);
    console.log(`wallet_id        : ${u.wallet?.id ?? 'SIN WALLET'}`);
    console.log(`balance_available: ${u.wallet?.balance_available ?? '-'}`);
    console.log(`balance_frozen   : ${u.wallet?.balance_frozen ?? '-'}`);
    console.log('\u2500'.repeat(50));
  }

  // Wallet de la casa (user_id = null)
  const houseWallet = await prisma.wallet.findFirst({
    where: { user_id: null },
  });
  if (houseWallet) {
    console.log(`CASA (sin user)`);
    console.log(`wallet_id        : ${houseWallet.id}`);
    console.log(`balance_available: ${houseWallet.balance_available}`);
    console.log(`balance_frozen   : ${houseWallet.balance_frozen}`);
    console.log('\u2500'.repeat(50));
  } else {
    console.log('CASA: sin wallet todavía');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
