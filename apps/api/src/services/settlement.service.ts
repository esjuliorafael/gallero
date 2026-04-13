import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SettlementJobData } from '../queues/settlement.queue';

const BROKERAGE_RATE = new Decimal('0.10');

export class SettlementService {
  constructor(private readonly prisma: PrismaClient) {}

  async settle(job: SettlementJobData): Promise<void> {
    const { fightId, result } = job;

    const winningSide = result === 'DRAW' ? null : result;

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

    for (const betMatch of betMatches) {
      // Determinar si este match es directo DANDO vs AGARRANDO
      const betTypes = betMatch.bet_match_legs.map(
        (leg) => leg.bet_order.bet_type
      );
      const isDirectMatch =
        betTypes.includes('DANDO_80') && betTypes.includes('AGARRANDO_80');

      await this.prisma.$transaction(async (tx) => {
        for (const leg of betMatch.bet_match_legs) {
          const wallet = leg.bet_order.user.wallet;
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
            // Ganador — recibe stake + ganancia neta (menos 10% de corretaje)
            const brokerage   = targetWin.mul(BROKERAGE_RATE).toDecimalPlaces(2);
            const netWin      = targetWin.sub(brokerage);
            const totalPayout = stakeContributed.add(netWin);

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
            // Registrar el corretaje cobrado
            await tx.ledgerEntry.create({
              data: {
                wallet_id:      wallet.id,
                type:           'HOUSE_BROKERAGE_FEE',
                amount:         brokerage,
                reference_type: 'bet_match_leg',
                reference_id:   leg.id,
              },
            });

          } else {
            // Perdedor — liberar saldo congelado
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance_frozen: { decrement: stakeContributed },
              },
            });
            // Match directo DANDO vs AGARRANDO → BET_LOST (sin spread)
            // PAREJA involucrada → HOUSE_SPREAD_PROFIT
            const loserEntryType = isDirectMatch
              ? 'BET_LOST'
              : 'HOUSE_SPREAD_PROFIT';

            await tx.ledgerEntry.create({
              data: {
                wallet_id:      wallet.id,
                type:           loserEntryType,
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

    console.log(`\uD83C\uDFC6 Settlement completado — pelea ${fightId} → ${finalStatus}`);
  }
}
