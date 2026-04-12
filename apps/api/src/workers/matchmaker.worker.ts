import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { MatchmakerJobData } from '../queues/matchmaker.queue';
import { MatchmakerService } from '../services/matchmaker.service';

export const createMatchmakerWorker = (
  connection: Redis,
  prisma: PrismaClient,
  redis: Redis              // 👈 para pasarle al service
): Worker<MatchmakerJobData> => {
  const service = new MatchmakerService(prisma, redis); // 👈

  const worker = new Worker<MatchmakerJobData>(
    'matchmaker',
    async (job: Job<MatchmakerJobData>) => {
      console.log(`🔄 Procesando job ${job.id} — betOrderId: ${job.data.betOrderId}`);
      await service.tryMatch(job.data);
    },
    { connection, concurrency: 5 }
  );

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} completado`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} falló:`, err.message));

  return worker;
};