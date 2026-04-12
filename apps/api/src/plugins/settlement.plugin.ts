import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { createSettlementWorker } from '../workers/settlement.worker';
import { getSettlementQueue } from '../queues/settlement.queue';
import { SettlementJobData } from '../queues/settlement.queue';

declare module 'fastify' {
  interface FastifyInstance {
    settlementQueue: Queue<SettlementJobData>;
  }
}

const settlementPlugin: FastifyPluginAsync = async (fastify) => {
  const bullRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const queue  = getSettlementQueue(bullRedis);
  const worker = createSettlementWorker(bullRedis, fastify.prisma);

  fastify.decorate('settlementQueue', queue);

  fastify.addHook('onClose', async () => {
    await worker.close();
    await queue.close();
    await bullRedis.quit();
  });
};

export default fp(settlementPlugin);