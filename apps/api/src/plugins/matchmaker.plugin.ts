import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { createMatchmakerWorker } from '../workers/matchmaker.worker';
import { getMatchmakerQueue } from '../queues/matchmaker.queue';
import { MatchmakerJobData } from '../queues/matchmaker.queue';

declare module 'fastify' {
  interface FastifyInstance {
    matchmakerQueue: Queue<MatchmakerJobData>;
  }
}

const matchmakerPlugin: FastifyPluginAsync = async (fastify) => {
  const bullRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const queue  = getMatchmakerQueue(bullRedis);
  const worker = createMatchmakerWorker(bullRedis, fastify.prisma, bullRedis); // 👈 tercer parámetro

  fastify.decorate('matchmakerQueue', queue);

  fastify.addHook('onClose', async () => {
    await worker.close();
    await queue.close();
    await bullRedis.quit();
  });
};

export default fp(matchmakerPlugin);