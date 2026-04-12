import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

const jwtPlugin: FastifyPluginAsync = async (fastify, options) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  fastify.register(fastifyJwt, {
    secret: secret
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'No autorizado' });
    }
  });
  
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;
      if (user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Acceso denegado' });
      }
    } catch (err) {
      reply.code(401).send({ error: 'No autorizado' });
    }
  });
};

export default fp(jwtPlugin);