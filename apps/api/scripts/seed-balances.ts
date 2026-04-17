import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Uso: npx ts-node scripts/seed-balances.ts <phoneA> <phoneB> [monto]
const PHONE_A = process.argv[2];
const PHONE_B = process.argv[3];
const AMOUNT  = new Decimal(process.argv[4] ?? '1000');

async function main() {
  if (!PHONE_A || !PHONE_B) {
    console.error('Uso: npx ts-node scripts/seed-balances.ts <phoneA> <phoneB> [monto]');
    process.exit(1);
  }

  // 1. Poner TODOS los wallets en cero
  await prisma.wallet.updateMany({
    data: { balance_available: new Decimal(0), balance_frozen: new Decimal(0) },
  });
  console.log('\u2705 Todos los wallets reseteados a $0');

  // 2. Cargar saldo a A y B por phone
  for (const phone of [PHONE_A, PHONE_B]) {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { wallet: true },
    });

    if (!user)         { console.error(`\u274c Usuario no encontrado: ${phone}`); continue; }
    if (!user.wallet)  { console.error(`\u274c Sin wallet: ${phone}`); continue; }

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data:  { balance_available: AMOUNT },
      });
      await tx.ledgerEntry.create({
        data: {
          wallet_id:      user.wallet!.id,
          type:           'DEPOSIT_APPROVED',
          amount:         AMOUNT,
          reference_type: 'test_seed',
          reference_id:   user.id,
        },
      });
    });

    console.log(`\u2705 ${user.full_name} (${phone}) \u2192 $${AMOUNT}`);
  }

  // 3. Verificar estado final
  console.log('\n=== ESTADO FINAL ===\n');
  const all = await prisma.user.findMany({
    include: { wallet: true },
    orderBy: { created_at: 'asc' },
  });
  for (const u of all) {
    console.log(
      `${u.full_name.padEnd(20)} | ${u.role.padEnd(7)} | available: $${String(u.wallet?.balance_available ?? 0).padStart(10)} | frozen: $${u.wallet?.balance_frozen ?? 0}`
    );
  }

  const houseWallet = await prisma.wallet.findFirst({ where: { user_id: null } });
  if (houseWallet) {
    console.log(
      `${'CASA'.padEnd(20)} | HOUSE   | available: $${String(houseWallet.balance_available).padStart(10)} | frozen: $${houseWallet.balance_frozen}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
