import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { createOrderExpiryWorker } from '../workers/order-expiry.worker';
import { getOrderExpiryQueue } from '../queues/order-expiry.queue';
import { OrderExpiryJobData } from '../queues/order-expiry.queue';

declare module 'fastify' {
  interface FastifyInstance {
    orderExpiryQueue: Queue<OrderExpiryJobData>;
  }
}

const orderExpiryPlugin: FastifyPluginAsync = async (fastify) => {
  const bullRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const queue  = getOrderExpiryQueue(bullRedis);
  const worker = createOrderExpiryWorker(bullRedis, fastify.prisma);

  fastify.decorate('orderExpiryQueue', queue);

  fastify.addHook('onClose', async () => {
    await worker.close();
    await queue.close();
    await bullRedis.quit();
  });
};

export default fp(orderExpiryPlugin);