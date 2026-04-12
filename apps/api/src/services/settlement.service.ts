import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SettlementJobData } from '../queues/settlement.queue';

export class SettlementService {
  constructor(private readonly prisma: PrismaClient) {}

  async settle(job: SettlementJobData): Promise<void> {
    const { fightId, result } = job;

    // Determinar qué lado gana
    const winningSide = result === 'DRAW' ? null : result; // null = empate

    // Cargar todos los BetMatch de la pelea con sus legs
    const betMatches = await this.prisma.betMatch.findMany({
      where: { fight_id: fightId },
      include: {
        bet_match_legs: {
          include: {
            bet_order: {
              include: {
                user: {
                  include: { wallet: true },
                },
              },
            },
          },
        },
      },
    });

    // Procesar cada match en su propia transacción
    for (const betMatch of betMatches) {
      await this.prisma.$transaction(async (tx) => {
        for (const leg of betMatch.bet_match_legs) {
          const wallet  = leg.bet_order.user.wallet;
          if (!wallet) continue;

          const stakeContributed = new Decimal(leg.amount_staked_contributed);
          const targetWin        = new Decimal(leg.target_win_contributed);

          if (result === 'DRAW') {
            // Empate — devolver stake a todos
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance_available: { increment: stakeContributed },
                balance_frozen:    { decrement: stakeContributed },
              },
            });

            await tx.ledgerEntry.create({
              data: {
                wallet_id:      wallet.id,
                type:           'BET_STAKE_RELEASED',
                amount:         stakeContributed,
                reference_type: 'bet_match_leg',
                reference_id:   leg.id,
              },
            });

          } else if (leg.side === winningSide) {
            // Ganador — recibe stake + ganancia
            const totalPayout = stakeContributed.add(targetWin);

            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance_available: { increment: totalPayout },
                balance_frozen:    { decrement: stakeContributed },
              },
            });

            await tx.ledgerEntry.create({
              data: {
                wallet_id:      wallet.id,
                type:           'WINNING_PAYOUT',
                amount:         totalPayout,
                reference_type: 'bet_match_leg',
                reference_id:   leg.id,
              },
            });

          } else {
            // Perdedor — solo liberar el saldo congelado (ya perdido)
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance_frozen: { decrement: stakeContributed },
              },
            });

            await tx.ledgerEntry.create({
              data: {
                wallet_id:      wallet.id,
                type:           'HOUSE_SPREAD_PROFIT',
                amount:         stakeContributed,
                reference_type: 'bet_match_leg',
                reference_id:   leg.id,
              },
            });
          }
        }
      });
    }

    // Marcar la pelea como finalizada
    const finalStatus =
      result === 'RED'   ? 'FINISHED_RED'   :
      result === 'GREEN' ? 'FINISHED_GREEN'  :
                           'FINISHED_DRAW';

    await this.prisma.fight.update({
      where: { id: fightId },
      data:  { status: finalStatus },
    });

    console.log(`🏆 Settlement completado — pelea ${fightId} → ${finalStatus}`);
  }
}