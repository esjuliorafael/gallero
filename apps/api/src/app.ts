import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma.plugin';
import redisPlugin from './plugins/redis.plugin';
import jwtPlugin from './plugins/jwt.plugin';
import matchmakerPlugin from './plugins/matchmaker.plugin';
import orderExpiryPlugin from './plugins/order-expiry.plugin';
import settlementPlugin from './plugins/settlement.plugin';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import walletsRoutes from './modules/wallets/wallets.routes';
import fightsRoutes from './modules/fights/fights.routes';
import betsRoutes from './modules/bets/bets.routes';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors);
  app.register(prismaPlugin);
  app.register(redisPlugin);
  app.register(jwtPlugin);
  app.register(matchmakerPlugin);
  app.register(orderExpiryPlugin);
  app.register(settlementPlugin);

  app.register(authRoutes,   { prefix: '/auth' });
  app.register(usersRoutes,  { prefix: '/users' });
  app.register(walletsRoutes,{ prefix: '/wallets' });
  app.register(fightsRoutes, { prefix: '/fights' });
  app.register(betsRoutes,   { prefix: '/bets' });

  return app;
}