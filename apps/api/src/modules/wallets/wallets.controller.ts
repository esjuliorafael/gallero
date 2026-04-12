import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ledgerQuerySchema, depositBodySchema } from './wallets.schemas';
import { getWallet, getLedger, deposit } from './wallets.service';

export async function getWalletHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any).sub;
  const wallet = await getWallet(userId);
  return reply.code(200).send(wallet);
}

export async function getLedgerHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { page, limit } = ledgerQuerySchema.parse(request.query);
    const userId = (request.user as any).sub;
    const result = await getLedger(userId, page, limit);
    return reply.code(200).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Parámetros inválidos' });
    }
    throw error;
  }
}

// 👇 nuevo handler
export async function depositHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { amount } = depositBodySchema.parse(request.body);
    const userId = (request.user as any).sub;
    const wallet = await deposit(userId, amount);
    return reply.code(200).send(wallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Datos inválidos' });
    }
    if (error instanceof Error && error.message === 'Wallet no encontrada') {
      return reply.code(404).send({ error: error.message });
    }
    throw error;
  }
}