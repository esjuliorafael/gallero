import { FastifyPluginAsync } from 'fastify';
import { requestOtpHandler, verifyOtpHandler, setPinHandler, loginHandler } from './auth.controller';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/request-otp', requestOtpHandler);
  fastify.post('/verify-otp', verifyOtpHandler);
  fastify.post('/set-pin', { preHandler: [fastify.authenticate] }, setPinHandler);
  fastify.post('/login', loginHandler);
};

export default authRoutes;
