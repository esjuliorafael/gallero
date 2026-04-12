import { FastifyPluginAsync } from 'fastify';
import { getWalletHandler, getLedgerHandler, depositHandler } from './wallets.controller';

const walletsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me',         { preHandler: [fastify.authenticate] }, getWalletHandler);
  fastify.get('/me/ledger',  { preHandler: [fastify.authenticate] }, getLedgerHandler);
  fastify.post('/me/deposit',{ preHandler: [fastify.authenticate] }, depositHandler); // 👈
};

export default walletsRoutes;