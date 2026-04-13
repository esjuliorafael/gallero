import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SettlementJobData } from '../queues/settlement.queue';

const BROKERAGE_RATE  = new Decimal('0.10');
const HOUSE_WALLET_ID = process.env.HOUSE_WALLET_ID!;

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
          const wallet         = leg.bet_order.user.wallet;
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
            const brokerage  = targetWin.mul(BROKERAGE_RATE).toDecimalPlaces(2);
            const netWin     = targetWin.sub(brokerage);
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
            // Acreditar corretaje a la casa
            if (HOUSE_WALLET_ID) {
              await tx.wallet.update({
                where: { id: HOUSE_WALLET_ID },
                data: { balance_available: { increment: brokerage } },
              });
            }

          } else {
            // Perdedor — liberar saldo congelado
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance_frozen: { decrement: stakeContributed },
              },
            });

            if (isDirectMatch) {
              // Match directo DANDO vs AGARRANDO — sin spread
              await tx.ledgerEntry.create({
                data: {
                  wallet_id:      wallet.id,
                  type:           'BET_LOST',
                  amount:         stakeContributed,
                  reference_type: 'bet_match_leg',
                  reference_id:   leg.id,
                },
              });
            } else {
              // Match asimetrico DANDO vs PAREJA
              // El perdedor es el DANDO; el spread es (stakeContributed - totalPagadoAGanadores)
              // targetWin del leg del perdedor = cuanto se le pago al ganador desde su stake
              // spread = stakeContributed - targetWin
              const spread = stakeContributed.sub(targetWin).toDecimalPlaces(2);

              await tx.ledgerEntry.create({
                data: {
                  wallet_id:      wallet.id,
                  type:           'HOUSE_SPREAD_PROFIT',
                  amount:         stakeContributed,
                  reference_type: 'bet_match_leg',
                  reference_id:   leg.id,
                },
              });

              // Acreditar spread a la casa
              if (HOUSE_WALLET_ID && spread.gt(0)) {
                await tx.wallet.update({
                  where: { id: HOUSE_WALLET_ID },
                  data: { balance_available: { increment: spread } },
                });
                await tx.ledgerEntry.create({
                  data: {
                    wallet_id:      HOUSE_WALLET_ID,
                    type:           'HOUSE_SPREAD_PROFIT',
                    amount:         spread,
                    reference_type: 'bet_match_leg',
                    reference_id:   leg.id,
                  },
                });
              }
            }
          }
        }
      });
    }

    // Marcar la pelea como finalizada
    const finalStatus =
      result === 'RED'   ? 'FINISHED_RED'   :
      result === 'GREEN' ? 'FINISHED_GREEN' :
      'FINISHED_DRAW';

    await this.prisma.fight.update({
      where: { id: fightId },
      data:  { status: finalStatus },
    });

    console.log(`🏆 Settlement completado — pelea ${fightId} → ${finalStatus}`);
  }
}
