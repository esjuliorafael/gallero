import { FastifyPluginAsync } from 'fastify';
import { createFightHandler, listFightsHandler, getFightByIdHandler, resolveFightHandler } from './fights.controller';

const fightsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { preHandler: [fastify.requireAdmin] }, createFightHandler);
  fastify.get('/', { preHandler: [fastify.authenticate] }, listFightsHandler);
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, getFightByIdHandler);
  fastify.patch('/:id/resolve', { preHandler: [fastify.requireAdmin] }, resolveFightHandler);
};

export default fightsRoutes;