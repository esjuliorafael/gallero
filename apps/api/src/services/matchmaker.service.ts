// src/services/matchmaker.service.ts
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Redis } from 'ioredis';
import { MatchmakerJobData } from '../queues/matchmaker.queue';
import { getOrderExpiryQueue } from '../queues/order-expiry.queue';

// Tipos de apuesta compatibles entre sí
function getCompatibleTypes(myType: string): string[] {
  if (myType === 'DANDO_80')     return ['AGARRANDO_80', 'PAREJA'];
  if (myType === 'AGARRANDO_80') return ['DANDO_80'];
  if (myType === 'PAREJA')       return ['PAREJA', 'DANDO_80'];
  return [];
}

export class MatchmakerService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
  ) {}

  async tryMatch(job: MatchmakerJobData): Promise<void> {
    const { betOrderId, fightId, side, amountStaked, targetWinAmount, betType } = job;

    const oppositeSide = side === 'RED' ? 'GREEN' : 'RED';
    const myStake      = new Decimal(amountStaked);
    const myTarget     = new Decimal(targetWinAmount);
    const compatibleTypes = getCompatibleTypes(betType);

    await this.prisma.$transaction(async (tx) => {
      // 1. Verificar que nuestra orden sigue vigente
      const myOrder = await tx.betOrder.findUnique({
        where: { id: betOrderId },
      });

      if (!myOrder || myOrder.status === 'MATCHED' || myOrder.status === 'CANCELED') {
        return;
      }

      let remaining       = new Decimal(myOrder.unmatched_staked_amount);
      let remainingTarget = new Decimal(myTarget);

      // 2. Buscar contrapartes compatibles (FIFO), filtrando por bet_type
      const candidates = await tx.betOrder.findMany({
        where: {
          fight_id: fightId,
          side: oppositeSide,
          bet_type: { in: compatibleTypes as any },
          status: { in: ['OPEN', 'PARTIALLY_MATCHED'] },
          unmatched_staked_amount: { gt: 0 },
        },
        orderBy: { created_at: 'asc' },
      });

      if (candidates.length === 0) return;

      // 3. Crear BetMatch
      const betMatch = await tx.betMatch.create({
        data: {
          fight_id: fightId,
          total_red_staked: new Decimal(0),
          total_green_staked: new Decimal(0),
        },
      });

      let totalRedMatched   = new Decimal(0);
      let totalGreenMatched = new Decimal(0);

      // 4. Consumir contrapartes hasta llenar nuestra orden
      for (const candidate of candidates) {
        if (remainingTarget.lte(0)) break;

        const candidateUnmatched = new Decimal(candidate.unmatched_staked_amount);
        const candidateType      = candidate.bet_type as string;

        // Cuánto puede aportar el candidato hacia mi target
        const contributedByCandidate = Decimal.min(candidateUnmatched, remainingTarget);

        // Cuánto aporto yo de mi stake proporcionalmente
        // ratio = contributedByCandidate / myTarget
        // ourContribution = myStake * ratio
        const ourContribution = myStake
          .mul(contributedByCandidate)
          .div(myTarget)
          .toDecimalPlaces(2);

        // ─────────────────────────────────────────────────────────────
        // Calcular target_win del candidato segun la combinacion de tipos
        //
        // DANDO_80 vs AGARRANDO_80 (match directo):
        //   El que agarra gana lo que el que da aportó (ourContribution)
        //
        // DANDO_80 vs PAREJA (match asimétrico):
        //   El PAREJA gana 1:1 lo que él mismo aportó (contributedByCandidate)
        //   El spread (ourContribution - contributedByCandidate) va a la casa
        //
        // PAREJA vs PAREJA:
        //   Ambos ganan 1:1 lo que el otro aportó
        // ─────────────────────────────────────────────────────────────
        let candidateTargetWin: Decimal;

        if (betType === 'DANDO_80' && candidateType === 'PAREJA') {
          // El PAREJA gana exactamente lo que aportó (1:1)
          candidateTargetWin = contributedByCandidate;
        } else if (betType === 'PAREJA' && candidateType === 'DANDO_80') {
          // Nosotros somos PAREJA, el candidato es DANDO_80
          // El candidato DANDO_80 gana 1:1 lo que nosotros aportamos
          candidateTargetWin = ourContribution;
        } else {
          // Match directo: DANDO_80 vs AGARRANDO_80 o PAREJA vs PAREJA
          candidateTargetWin = ourContribution;
        }

        await tx.betMatchLeg.create({
          data: {
            bet_match_id:              betMatch.id,
            bet_order_id:              betOrderId,
            side,
            amount_staked_contributed: ourContribution,
            target_win_contributed:    contributedByCandidate,
          },
        });

        await tx.betMatchLeg.create({
          data: {
            bet_match_id:              betMatch.id,
            bet_order_id:              candidate.id,
            side:                      oppositeSide,
            amount_staked_contributed: contributedByCandidate,
            target_win_contributed:    candidateTargetWin,
          },
        });

        const newCandidateUnmatched = candidateUnmatched.sub(contributedByCandidate);
        await tx.betOrder.update({
          where: { id: candidate.id },
          data: {
            unmatched_staked_amount: newCandidateUnmatched,
            status: newCandidateUnmatched.lte(0) ? 'MATCHED' : 'PARTIALLY_MATCHED',
          },
        });

        // Cancelar job de expiración si quedó completamente matcheado
        if (newCandidateUnmatched.lte(0)) {
          await getOrderExpiryQueue(this.redis).remove(`expiry-${candidate.id}`);
        }

        // Acumular totales por lado
        if (side === 'RED') {
          totalRedMatched   = totalRedMatched.add(ourContribution);
          totalGreenMatched = totalGreenMatched.add(contributedByCandidate);
        } else {
          totalGreenMatched = totalGreenMatched.add(ourContribution);
          totalRedMatched   = totalRedMatched.add(contributedByCandidate);
        }

        remaining       = remaining.sub(ourContribution);
        remainingTarget = remainingTarget.sub(contributedByCandidate);
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
          total_red_staked:   totalRedMatched,
          total_green_staked: totalGreenMatched,
        },
      });

      // 7. Cancelar job de expiración si nuestra orden quedó completa
      if (remaining.lte(0)) {
        await getOrderExpiryQueue(this.redis).remove(`expiry-${betOrderId}`);
      }

      console.log(`✅ Match procesado: orden ${betOrderId} — remaining: ${remaining}`);
    });
  }
}
