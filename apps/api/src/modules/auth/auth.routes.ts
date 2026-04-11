import { FastifyPluginAsync } from 'fastify';
import { requestOtpHandler } from './auth.controller';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/request-otp', requestOtpHandler);
};

export default authRoutes;
