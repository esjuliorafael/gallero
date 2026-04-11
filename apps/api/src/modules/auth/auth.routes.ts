import { FastifyPluginAsync } from 'fastify';
import { requestOtpHandler, verifyOtpHandler } from './auth.controller';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/request-otp', requestOtpHandler);
  fastify.post('/verify-otp', verifyOtpHandler);
};

export default authRoutes;
