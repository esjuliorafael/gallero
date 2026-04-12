import { FastifyPluginAsync } from 'fastify';
import { getMeHandler, updateMeHandler } from './users.controller';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: [fastify.authenticate] }, getMeHandler);
  fastify.patch('/me', { preHandler: [fastify.authenticate] }, updateMeHandler);
};

export default usersRoutes;