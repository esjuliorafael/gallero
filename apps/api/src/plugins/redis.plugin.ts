import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify, options) => {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async (fastifyInstance) => {
    await fastifyInstance.redis.quit();
  });
};

export default fp(redisPlugin);
