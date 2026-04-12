import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { OrderExpiryJobData } from '../queues/order-expiry.queue';
import { OrderExpiryService } from '../services/order-expiry.service';

export const createOrderExpiryWorker = (
  connection: Redis,
  prisma: PrismaClient
): Worker<OrderExpiryJobData> => {
  const service = new OrderExpiryService(prisma);

  const worker = new Worker<OrderExpiryJobData>(
    'order-expiry',
    async (job: Job<OrderExpiryJobData>) => {
      console.log(`⏰ Procesando expiración — betOrderId: ${job.data.betOrderId}`);
      await service.expireOrder(job.data);
    },
    { connection, concurrency: 10 }
  );

  worker.on('completed', (job) => console.log(`✅ Expiración ${job.id} completada`));
  worker.on('failed', (job, err) => console.error(`❌ Expiración ${job?.id} falló:`, err.message));

  return worker;
};