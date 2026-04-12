import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createFightBodySchema, listFightsQuerySchema, resolveFightBodySchema } from './fights.schemas';
import { createFight, listFights, getFightById, resolveFight } from './fights.service';

export async function createFightHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { red_party_name, green_party_name } = createFightBodySchema.parse(request.body);
    const fight = await createFight(red_party_name, green_party_name);
    return reply.code(201).send(fight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Datos inválidos' });
    }
    throw error;
  }
}

export async function listFightsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, page, limit } = listFightsQuerySchema.parse(request.query);
    const result = await listFights(status, page, limit);
    return reply.code(200).send(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Parámetros inválidos' });
    }
    throw error;
  }
}

export async function getFightByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };
    const fight = await getFightById(id);
    return reply.code(200).send(fight);
  } catch (error) {
    if (error instanceof Error && error.message === 'Pelea no encontrada') {
      return reply.code(404).send({ error: 'Pelea no encontrada' });
    }
    throw error;
  }
}

export async function resolveFightHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id }     = request.params as { id: string };
    const { result } = resolveFightBodySchema.parse(request.body);

    const response = await resolveFight(id, result, request.server.redis);
    return reply.code(200).send(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Datos inválidos' });
    }
    if (error instanceof Error) {
      if (error.message === 'Pelea no encontrada')             return reply.code(404).send({ error: error.message });
      if (error.message === 'La pelea no puede ser resuelta') return reply.code(409).send({ error: error.message });
    }
    throw error;
  }
}