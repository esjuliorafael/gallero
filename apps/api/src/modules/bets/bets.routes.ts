import { FastifyPluginAsync } from 'fastify';
import { createBetHandler, getMyBetsHandler } from './bets.controller';

const betsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { preHandler: [fastify.authenticate] }, createBetHandler);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getMyBetsHandler);
};

export default betsRoutes;