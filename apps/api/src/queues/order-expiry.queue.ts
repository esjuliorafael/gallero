import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface OrderExpiryJobData {
  betOrderId: string;
  userId:     string;
  walletId:   string;
  amount:     string; // Decimal serializado
}

let orderExpiryQueue: Queue<OrderExpiryJobData> | null = null;

export const getOrderExpiryQueue = (connection: Redis) => {
  if (!orderExpiryQueue) {
    orderExpiryQueue = new Queue<OrderExpiryJobData>('order-expiry', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return orderExpiryQueue;
};