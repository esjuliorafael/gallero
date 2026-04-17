import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// IDs de usuario A y B — cámbialos por los reales después de correr check-users
const USER_A_EMAIL = process.argv[2];
const USER_B_EMAIL = process.argv[3];
const AMOUNT       = new Decimal(process.argv[4] ?? '1000');

async function main() {
  if (!USER_A_EMAIL || !USER_B_EMAIL) {
    console.error('Uso: npx ts-node scripts/seed-balances.ts <emailA> <emailB> [monto]');
    process.exit(1);
  }

  // 1. Poner TODOS los wallets en cero
  await prisma.wallet.updateMany({
    data: { balance_available: new Decimal(0), balance_frozen: new Decimal(0) },
  });
  console.log('✅ Todos los wallets reseteados a $0');

  // 2. Cargar saldo a A y B
  for (const email of [USER_A_EMAIL, USER_B_EMAIL]) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) { console.error(`❌ Usuario no encontrado: ${email}`); continue; }
    if (!user.wallet) { console.error(`❌ Sin wallet: ${email}`); continue; }

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

    console.log(`✅ ${user.name} (${email}) → $${AMOUNT}`);
  }

  // 3. Verificar estado final
  console.log('\n=== ESTADO FINAL ===\n');
  const all = await prisma.user.findMany({ include: { wallet: true }, orderBy: { created_at: 'asc' } });
  for (const u of all) {
    console.log(`${u.name.padEnd(20)} | available: $${u.wallet?.balance_available ?? 0} | frozen: $${u.wallet?.balance_frozen ?? 0}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
