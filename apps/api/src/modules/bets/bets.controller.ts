import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createBetBodySchema, listMyBetsQuerySchema } from './bets.schemas';
import { createBet, getMyBets } from './bets.service';

export async function createBetHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { fight_id, side, bet_type, amount_staked } = createBetBodySchema.parse(request.body);
    const userId = (request.user as any).sub;

    // 👇 se pasa fastify.redis al service
    const bet = await createBet(userId, fight_id, side, bet_type, amount_staked, request.server.redis);

    return reply.code(201).send(bet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Datos inválidos' });
    }
    if (error instanceof Error) {
      if (error.message === 'Pelea no encontrada')    return reply.code(404).send({ error: error.message });
      if (error.message === 'Pelea no está abierta') return reply.code(409).send({ error: error.message });
      if (error.message === 'Saldo insuficiente')     return reply.code(422).send({ error: error.message });
    }
    throw error;
  }
}

export async function getMyBetsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { page, limit } = listMyBetsQuerySchema.parse(request.query);
    const userId = (request.user as any).sub;
    const result = await getMyBets(userId, page, limit);
    return reply.code(200).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Parámetros inválidos' });
    }
    throw error;
  }
}