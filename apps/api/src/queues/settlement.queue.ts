import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface SettlementJobData {
  fightId: string;
  result:  'RED' | 'GREEN' | 'DRAW';
}

let settlementQueue: Queue<SettlementJobData> | null = null;

export const getSettlementQueue = (connection: Redis) => {
  if (!settlementQueue) {
    settlementQueue = new Queue<SettlementJobData>('settlement', {
      connection,
      defaultJobOptions: {
        attempts: 5, // Más reintentos — es dinero real
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    });
  }
  return settlementQueue;
};