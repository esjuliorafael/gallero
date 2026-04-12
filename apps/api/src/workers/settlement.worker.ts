import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { SettlementJobData } from '../queues/settlement.queue';
import { SettlementService } from '../services/settlement.service';

export const createSettlementWorker = (
  connection: Redis,
  prisma: PrismaClient
): Worker<SettlementJobData> => {
  const service = new SettlementService(prisma);

  const worker = new Worker<SettlementJobData>(
    'settlement',
    async (job: Job<SettlementJobData>) => {
      console.log(`🏆 Procesando settlement — fightId: ${job.data.fightId}`);
      await service.settle(job.data);
    },
    {
      connection,
      concurrency: 1, // Settlement es crítico — un fight a la vez
    }
  );

  worker.on('completed', (job) => console.log(`✅ Settlement ${job.id} completado`));
  worker.on('failed', (job, err) => console.error(`❌ Settlement ${job?.id} falló:`, err.message));

  return worker;
};