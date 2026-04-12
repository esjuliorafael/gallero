import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrderExpiryJobData } from '../queues/order-expiry.queue';

export class OrderExpiryService {
  constructor(private readonly prisma: PrismaClient) {}

  async expireOrder(job: OrderExpiryJobData): Promise<void> {
    const { betOrderId, userId, walletId, amount } = job;
    const stakeToRelease = new Decimal(amount);

    await this.prisma.$transaction(async (tx) => {
      // 1. Verificar que la orden sigue siendo expirable
      const order = await tx.betOrder.findUnique({
        where: { id: betOrderId },
      });

      if (!order) return;

      // Si ya fue matcheada o cancelada, no hacer nada
      if (order.status === 'MATCHED' || order.status === 'CANCELED') return;

      // El monto a liberar es solo el unmatched (puede haber sido parcialmente matcheada)
      const amountToRelease = new Decimal(order.unmatched_staked_amount);
      if (amountToRelease.lte(0)) return;

      // 2. Cancelar la orden
      await tx.betOrder.update({
        where: { id: betOrderId },
        data: {
          status:                  'CANCELED',
          unmatched_staked_amount: new Decimal(0),
        },
      });

      // 3. Devolver saldo congelado → disponible
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance_available: { increment: amountToRelease },
          balance_frozen:    { decrement: amountToRelease },
        },
      });

      // 4. Registrar en ledger
      await tx.ledgerEntry.create({
        data: {
          wallet_id:      walletId,
          type:           'BET_STAKE_RELEASED',
          amount:         amountToRelease,
          reference_type: 'bet_order',
          reference_id:   betOrderId,
        },
      });

      console.log(`⏰ Orden ${betOrderId} expirada — liberados $${amountToRelease}`);
    });
  }
}