// src/services/matchmaker.service.ts
import { PrismaClient, BetType as PrismaBetType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Redis } from 'ioredis';
import { MatchmakerJobData } from '../queues/matchmaker.queue';
import { getOrderExpiryQueue } from '../queues/order-expiry.queue';

type BetType = 'PAREJA' | 'DANDO_90' | 'DANDO_80' | 'AGARRANDO_90' | 'AGARRANDO_80';

/**
 * Devuelve los bet_type compatibles para matchear contra una orden entrante,
 * en orden de prioridad (primero el match directo, luego PAREJA).
 *
 * Reglas:
 * - DANDO_80  puede matchear con AGARRANDO_80 (directo) o PAREJA
 * - DANDO_90  puede matchear con AGARRANDO_90 (directo) o PAREJA
 * - AGARRANDO_80 solo puede matchear con DANDO_80 (directo)
 * - AGARRANDO_90 solo puede matchear con DANDO_90 (directo)
 * - PAREJA    puede matchear con PAREJA o con DANDO_80 / DANDO_90
 */
function compatibleTypes(myType: BetType): BetType[] {
  switch (myType) {
    case 'DANDO_80':     return ['AGARRANDO_80', 'PAREJA'];
    case 'DANDO_90':     return ['AGARRANDO_90', 'PAREJA'];
    case 'AGARRANDO_80': return ['DANDO_80'];
    case 'AGARRANDO_90': return ['DANDO_90'];
    case 'PAREJA':       return ['PAREJA', 'DANDO_80', 'DANDO_90'];
    default:             return [];
  }
}

/**
 * Dado el bet_type del candidato y el de nuestra orden,
 * calcula cuánto aporta el CANDIDATO como target_win_contributed
 * (es decir, cuánto GANARÍA nuestra orden si gana).
 *
 * - DANDO vs AGARRANDO: el candidato aporta su stake completo consumido
 *   como target de nuestra ganancia (son simétricamente inversos).
 * - DANDO vs PAREJA: el candidato PAREJA apuesta 1:1, por lo que
 *   el target que aporta a nuestra ganancia = su stake consumido.
 * - PAREJA vs DANDO: el DANDO candidato aporta más stake del que
 *   corresponde al target de nuestra ganancia (hay spread).
 *   nuestro target = stake_candidato_consumido * ratio_dando
 *   Ej: DANDO_80 aporta $100 stake → nos da $80 de ganancia.
 * - PAREJA vs PAREJA: 1:1, target = stake consumido.
 */
function candidateTargetContribution(
  candidateType: BetType,
  myType: BetType,
  candidateStakeConsumed: Decimal
): Decimal {
  // DANDO vs AGARRANDO o viceversa: simétrico
  if (
    (myType === 'DANDO_80' && candidateType === 'AGARRANDO_80') ||
    (myType === 'AGARRANDO_80' && candidateType === 'DANDO_80') ||
    (myType === 'DANDO_90' && candidateType === 'AGARRANDO_90') ||
    (myType === 'AGARRANDO_90' && candidateType === 'DANDO_90')
  ) {
    return candidateStakeConsumed;
  }
  // PAREJA vs PAREJA: 1:1
  if (myType === 'PAREJA' && candidateType === 'PAREJA') {
    return candidateStakeConsumed;
  }
  // DANDO_80 vs PAREJA: el PAREJA aporta 1:1 a nuestro target
  if (
    (myType === 'DANDO_80' || myType === 'DANDO_90') &&
    candidateType === 'PAREJA'
  ) {
    return candidateStakeConsumed;
  }
  // PAREJA vs DANDO_80: el DANDO aporta stake * 0.80 como nuestro target
  if (myType === 'PAREJA' && candidateType === 'DANDO_80') {
    return candidateStakeConsumed.mul('0.80').toDecimalPlaces(2);
  }
  if (myType === 'PAREJA' && candidateType === 'DANDO_90') {
    return candidateStakeConsumed.mul('0.90').toDecimalPlaces(2);
  }
  // Fallback 1:1
  return candidateStakeConsumed;
}

export class MatchmakerService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
  ) {}

  async tryMatch(job: MatchmakerJobData): Promise<void> {
    const { betOrderId, fightId, side, amountStaked, targetWinAmount } = job;
    const oppositeSide = side === 'RED' ? 'GREEN' : 'RED';
    const myStake = new Decimal(amountStaked);
    const myTarget = new Decimal(targetWinAmount);

    await this.prisma.$transaction(async (tx) => {
      // 1. Verificar que nuestra orden sigue vigente
      const myOrder = await tx.betOrder.findUnique({
        where: { id: betOrderId },
      });
      if (!myOrder || myOrder.status === 'MATCHED' || myOrder.status === 'CANCELED') {
        return;
      }

      const myType = myOrder.bet_type as BetType;
      const compatible = compatibleTypes(myType);
      if (compatible.length === 0) return;

      let remaining = new Decimal(myOrder.unmatched_staked_amount);
      let remainingTarget = new Decimal(myTarget);

      // 2. Buscar contrapartes compatibles ordenadas por prioridad de tipo y FIFO
      const candidates = await tx.betOrder.findMany({
        where: {
          fight_id: fightId,
          side: oppositeSide,
          bet_type: { in: compatible as unknown as PrismaBetType[] },
          status: { in: ['OPEN', 'PARTIALLY_MATCHED'] },
          unmatched_staked_amount: { gt: 0 },
        },
        orderBy: { created_at: 'asc' },
      });

      if (candidates.length === 0) return;

      // Ordenar por prioridad de tipo (primero match directo, luego PAREJA)
      const priorityOrder = compatible;
      candidates.sort((a, b) => {
        const pa = priorityOrder.indexOf(a.bet_type as BetType);
        const pb = priorityOrder.indexOf(b.bet_type as BetType);
        if (pa !== pb) return pa - pb;
        return a.created_at.getTime() - b.created_at.getTime();
      });

      // 3. Crear BetMatch
      const betMatch = await tx.betMatch.create({
        data: {
          fight_id: fightId,
          total_red_staked: new Decimal(0),
          total_green_staked: new Decimal(0),
        },
      });

      let totalRedMatched = new Decimal(0);
      let totalGreenMatched = new Decimal(0);

      // 4. Consumir contrapartes hasta llenar nuestra orden
      for (const candidate of candidates) {
        if (remainingTarget.lte(0)) break;

        const candidateType = candidate.bet_type as BetType;
        const candidateUnmatched = new Decimal(candidate.unmatched_staked_amount);

        // Cuánto consume del candidato para satisfacer nuestro remainingTarget
        let candidateStakeToConsume: Decimal;
        if (myType === 'PAREJA' && candidateType === 'DANDO_80') {
          candidateStakeToConsume = remainingTarget.div('0.80').toDecimalPlaces(2);
        } else if (myType === 'PAREJA' && candidateType === 'DANDO_90') {
          candidateStakeToConsume = remainingTarget.div('0.90').toDecimalPlaces(2);
        } else {
          candidateStakeToConsume = remainingTarget;
        }

        const candidateStakeConsumed = Decimal.min(candidateUnmatched, candidateStakeToConsume);

        // Cuánto de nuestro target se satisface con este consumo
        const targetSatisfied = candidateTargetContribution(
          candidateType,
          myType,
          candidateStakeConsumed
        );

        // Cuánto aportamos nosotros de stake proporcionalmente
        const ourContribution = myStake
          .mul(targetSatisfied)
          .div(myTarget)
          .toDecimalPlaces(2);

        // Leg de nuestra orden
        await tx.betMatchLeg.create({
          data: {
            bet_match_id: betMatch.id,
            bet_order_id: betOrderId,
            side,
            amount_staked_contributed: ourContribution,
            target_win_contributed: targetSatisfied,
          },
        });

        // Leg del candidato
        await tx.betMatchLeg.create({
          data: {
            bet_match_id: betMatch.id,
            bet_order_id: candidate.id,
            side: oppositeSide,
            amount_staked_contributed: candidateStakeConsumed,
            target_win_contributed: ourContribution,
          },
        });

        const newCandidateUnmatched = candidateUnmatched.sub(candidateStakeConsumed);
        await tx.betOrder.update({
          where: { id: candidate.id },
          data: {
            unmatched_staked_amount: newCandidateUnmatched,
            status: newCandidateUnmatched.lte(0) ? 'MATCHED' : 'PARTIALLY_MATCHED',
          },
        });

        if (newCandidateUnmatched.lte(0)) {
          await getOrderExpiryQueue(this.redis).remove(`expiry-${candidate.id}`);
        }

        // Acumular totales por lado
        if (side === 'RED') {
          totalRedMatched = totalRedMatched.add(ourContribution);
          totalGreenMatched = totalGreenMatched.add(candidateStakeConsumed);
        } else {
          totalGreenMatched = totalGreenMatched.add(ourContribution);
          totalRedMatched = totalRedMatched.add(candidateStakeConsumed);
        }

        remaining = remaining.sub(ourContribution);
        remainingTarget = remainingTarget.sub(targetSatisfied);
      }

      // 5. Actualizar nuestra orden
      await tx.betOrder.update({
        where: { id: betOrderId },
        data: {
          unmatched_staked_amount: remaining,
          status: remaining.lte(0) ? 'MATCHED' : 'PARTIALLY_MATCHED',
        },
      });

      // 6. Actualizar totales reales del BetMatch
      await tx.betMatch.update({
        where: { id: betMatch.id },
        data: {
          total_red_staked: totalRedMatched,
          total_green_staked: totalGreenMatched,
        },
      });

      // 7. Cancelar job de expiracion si nuestra orden quedo completa
      if (remaining.lte(0)) {
        await getOrderExpiryQueue(this.redis).remove(`expiry-${betOrderId}`);
      }

      console.log(`\u2705 Match procesado: orden ${betOrderId} \u2014 remaining: ${remaining}`);
    });
  }
}
