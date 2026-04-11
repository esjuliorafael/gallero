import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma.plugin';
import redisPlugin from './plugins/redis.plugin';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors);
  app.register(prismaPlugin);
  app.register(redisPlugin);

  return app;
}
