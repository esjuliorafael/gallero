import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { Redis } from 'ioredis';
import { getMatchmakerQueue } from '../../queues/matchmaker.queue';
import { getOrderExpiryQueue } from '../../queues/order-expiry.queue';

type BetType = 'PAREJA' | 'DANDO_90' | 'DANDO_80' | 'AGARRANDO_90' | 'AGARRANDO_80';

function calculateTargetWin(amount_staked: Decimal, bet_type: BetType): Decimal {
  const ratios: Record<BetType, number> = {
    PAREJA:       1.00,
    DANDO_90:     0.90,
    DANDO_80:     0.80,
    AGARRANDO_90: 1 / 0.90,
    AGARRANDO_80: 1 / 0.80,
  };
  return new Decimal(amount_staked).mul(ratios[bet_type]).toDecimalPlaces(2);
}

export async function createBet(
  userId: string,
  fight_id: string,
  side: 'RED' | 'GREEN',
  bet_type: BetType,
  amount_staked_raw: number,
  redis: Redis
) {
  const amount_staked = new Decimal(amount_staked_raw).toDecimalPlaces(2);

  // 1. Validar pelea
  const fight = await prisma.fight.findUnique({ where: { id: fight_id } });
  if (!fight) throw new Error('Pelea no encontrada');
  if (fight.status !== 'OPEN') throw new Error('Pelea no est\u00e1 abierta');

  // 2. Validar saldo
  const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
  if (!wallet) throw new Error('Wallet no encontrada');
  if (new Decimal(wallet.balance_available).lt(amount_staked)) {
    throw new Error('Saldo insuficiente');
  }

  const target_win_amount = calculateTargetWin(amount_staked, bet_type);
  const expires_at = new Date(Date.now() + 60 * 60 * 1000);

  // 3. Transacci\u00f3n at\u00f3mica
  const bet = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { user_id: userId },
      data: {
        balance_available: { decrement: amount_staked },
        balance_frozen:    { increment: amount_staked },
      },
    });

    await tx.ledgerEntry.create({
      data: {
        wallet_id:      wallet.id,
        type:           'BET_STAKE_FROZEN',
        amount:         amount_staked,
        reference_type: 'bet_order',
        reference_id:   fight_id,
      },
    });

    return tx.betOrder.create({
      data: {
        user_id:                 userId,
        fight_id,
        side,
        bet_type,
        amount_staked,
        target_win_amount,
        unmatched_staked_amount: amount_staked,
        status:                  'OPEN',
        expires_at,
      },
    });
  });

  // 4. Encolar matchmaker
  await getMatchmakerQueue(redis).add('try-match', {
    betOrderId:      bet.id,
    fightId:         bet.fight_id,
    side:            bet.side,
    amountStaked:    bet.amount_staked.toString(),
    targetWinAmount: bet.target_win_amount.toString(),
  });

  // 5. Encolar expiraci\u00f3n con delay exacto al vencimiento
  const delayMs = expires_at.getTime() - Date.now();
  await getOrderExpiryQueue(redis).add(
    'expire-order',
    {
      betOrderId: bet.id,
      userId,
      walletId:   wallet.id,
      amount:     bet.unmatched_staked_amount.toString(),
    },
    {
      delay: delayMs,
      jobId: `expiry-${bet.id}`,
    }
  );

  return bet;
}

export async function getMyBets(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.betOrder.findMany({
      where:   { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id:                      true,
        fight_id:                true,
        side:                    true,
        bet_type:                true,
        amount_staked:           true,
        target_win_amount:       true,
        unmatched_staked_amount: true,
        status:                  true,
        expires_at:              true,
        created_at:              true,
      },
    }),
    prisma.betOrder.count({ where: { user_id: userId } }),
  ]);

  return {
    data: orders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
