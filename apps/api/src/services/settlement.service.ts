import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SettlementJobData } from '../queues/settlement.queue';

const BROKERAGE_RATE  = new Decimal('0.10');
const HOUSE_WALLET_ID = process.env.HOUSE_WALLET_ID!;

type BetType = 'PAREJA' | 'DANDO_90' | 'DANDO_80' | 'AGARRANDO_90' | 'AGARRANDO_80';

/**
 * Determina si un BetMatch es directo (DANDO vs AGARRANDO).
 * Un match es directo cuando los dos tipos de apuesta son inversos entre si:
 *   DANDO_80 <-> AGARRANDO_80
 *   DANDO_90 <-> AGARRANDO_90
 * En cualquier otro caso (PAREJA involucrada) es asimetrico y hay spread potencial.
 */
function isDirectMatch(betTypes: BetType[]): boolean {
  const has = (t: BetType) => betTypes.includes(t);
  return (
    (has('DANDO_80') && has('AGARRANDO_80')) ||
    (has('DANDO_90') && has('AGARRANDO_90'))
  );
}

export class SettlementService {
  constructor(private readonly prisma: PrismaClient) {}

  async settle(job: SettlementJobData): Promise<void> {
    const { fightId, result } = job;

    const winningSide = result === 'DRAW' ? null : result;

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
      const betTypes = betMatch.bet_match_legs.map(
        (leg) => leg.bet_order.bet_type as BetType
      );
      const direct = isDirectMatch(betTypes);

      await this.prisma.$transaction(async (tx) => {
        for (const leg of betMatch.bet_match_legs) {
          const wallet = leg.bet_order.user.wallet;
          if (!wallet) continue;

          const stakeContributed = new Decimal(leg.amount_staked_contributed);
          const targetWin        = new Decimal(leg.target_win_contributed);

          // ── EMPATE: devolver stake a todos ──────────────────────────────────
          if (result === 'DRAW') {
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
            continue;
          }

          // ── GANADOR ─────────────────────────────────────────────────────────
          if (leg.side === winningSide) {
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
              await tx.ledgerEntry.create({
                data: {
                  wallet_id:      HOUSE_WALLET_ID,
                  type:           'HOUSE_BROKERAGE_FEE',
                  amount:         brokerage,
                  reference_type: 'bet_match_leg',
                  reference_id:   leg.id,
                },
              });
            }

          // ── PERDEDOR ────────────────────────────────────────────────────────
          } else {
            // Liberar saldo congelado (ya no esta en la wallet, fue perdido)
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance_frozen: { decrement: stakeContributed },
              },
            });

            if (direct) {
              // Match directo: sin spread, solo registrar perdida
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
              // Match asimetrico (DANDO perdedor vs PAREJA ganadores):
              // stakeContributed = lo que el DANDO puso en juego en este leg
              // targetWin        = lo que se pago al ganador desde el stake del DANDO
              // spread           = stakeContributed - targetWin  (va a la casa)
              const spread = stakeContributed.sub(targetWin).toDecimalPlaces(2);

              await tx.ledgerEntry.create({
                data: {
                  wallet_id:      wallet.id,
                  type:           'BET_LOST',
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

    const finalStatus =
      result === 'RED'   ? 'FINISHED_RED'   :
      result === 'GREEN' ? 'FINISHED_GREEN' :
      'FINISHED_DRAW';

    await this.prisma.fight.update({
      where: { id: fightId },
      data:  { status: finalStatus },
    });

    console.log(`\uD83C\uDFC6 Settlement completado \u2014 pelea ${fightId} \u2192 ${finalStatus}`);
  }
}
