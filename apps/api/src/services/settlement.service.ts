import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SettlementJobData } from '../queues/settlement.queue';

const BROKERAGE_RATE  = new Decimal('0.10');
const HOUSE_WALLET_ID = process.env.HOUSE_WALLET_ID!;

/**
 * Determina si un par de legs es match directo (DANDO vs AGARRANDO).
 * Se evalua por BetMatch completo: si todas las legs son DANDO_80/AGARRANDO_80
 * o DANDO_90/AGARRANDO_90, es directo. Si hay algun PAREJA, es asimetrico.
 * Para evitar el edge case de legs mixtas, se evalua por cada leg perdedora
 * individualmente: una leg es "directa" si su contraparte en el mismo match
 * es del tipo inverso exacto (DANDO_80 <-> AGARRANDO_80, DANDO_90 <-> AGARRANDO_90).
 */
function isDirectPair(myType: string, opponentTypes: string[]): boolean {
  if (myType === 'DANDO_80')     return opponentTypes.every(t => t === 'AGARRANDO_80');
  if (myType === 'DANDO_90')     return opponentTypes.every(t => t === 'AGARRANDO_90');
  if (myType === 'AGARRANDO_80') return opponentTypes.every(t => t === 'DANDO_80');
  if (myType === 'AGARRANDO_90') return opponentTypes.every(t => t === 'DANDO_90');
  return false; // PAREJA nunca es directo
}

export class SettlementService {
  constructor(private readonly prisma: PrismaClient) {}

  async settle(job: SettlementJobData): Promise<void> {
    const { fightId, result } = job;
    const winningSide = result === 'DRAW' ? null : result;

    // Cargar todos los BetMatch con sus legs
    const betMatches = await this.prisma.betMatch.findMany({
      where: { fight_id: fightId },
      include: {
        bet_match_legs: {
          include: {
            bet_order: {
              include: {
                user: { include: { wallet: true } },
              },
            },
          },
        },
      },
    });

    for (const betMatch of betMatches) {
      await this.prisma.$transaction(async (tx) => {
        for (const leg of betMatch.bet_match_legs) {
          const wallet = leg.bet_order.user.wallet;
          if (!wallet) continue;

          const stakeContributed = new Decimal(leg.amount_staked_contributed);
          const targetWin        = new Decimal(leg.target_win_contributed);
          const myType           = leg.bet_order.bet_type as string;

          if (result === 'DRAW') {
            // Empate: devolver stake a todos
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
            // Ganador: stake + ganancia neta (menos 10% corretaje)
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
            // Perdedor: liberar stake congelado
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance_frozen: { decrement: stakeContributed } },
            });

            // Determinar tipos de las legs contrarias en este mismo match
            const opponentTypes = betMatch.bet_match_legs
              .filter(l => l.side !== leg.side)
              .map(l => l.bet_order.bet_type as string);

            const isDirect = isDirectPair(myType, opponentTypes);

            if (isDirect) {
              // Match directo DANDO vs AGARRANDO — sin spread, todo se lo lleva el ganador
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
              // spread = lo que el DANDO puso de mas sobre lo que los ganadores cobran
              // target_win_contributed del leg del DANDO = lo que se le prometio al ganador
              // spread = stakeContributed (lo que bloqueo el DANDO) - targetWin (lo que se paga al ganador)
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

    // Marcar pelea como finalizada
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
