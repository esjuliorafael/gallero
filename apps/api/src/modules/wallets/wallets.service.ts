import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId },
    select: {
      id:                true,
      balance_available: true,
      balance_frozen:    true,
      updated_at:        true,
    },
  });

  if (!wallet) throw new Error('Wallet no encontrada');
  return wallet;
}

export async function getLedger(userId: string, page: number, limit: number) {
  const wallet = await prisma.wallet.findUnique({
    where:  { user_id: userId },
    select: { id: true },
  });

  if (!wallet) throw new Error('Wallet no encontrada');

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where:   { wallet_id: wallet.id },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id:             true,
        type:           true,
        amount:         true,
        reference_type: true,
        reference_id:   true,
        created_at:     true,
      },
    }),
    prisma.ledgerEntry.count({ where: { wallet_id: wallet.id } }),
  ]);

  return {
    data: entries,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// 👇 nueva función
export async function deposit(userId: string, amount_raw: number) {
  const amount = new Decimal(amount_raw).toDecimalPlaces(2);

  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId },
  });

  if (!wallet) throw new Error('Wallet no encontrada');

  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.update({
      where: { id: wallet.id },
      data:  { balance_available: { increment: amount } },
      select: {
        id:                true,
        balance_available: true,
        balance_frozen:    true,
        updated_at:        true,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        wallet_id:      wallet.id,
        type:           'DEPOSIT_APPROVED',
        amount,
        reference_type: 'deposit',
        reference_id:   userId,
      },
    });

    return w;
  });

  return updated;
}