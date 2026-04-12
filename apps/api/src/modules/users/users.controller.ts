import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { updateProfileBodySchema } from './users.schemas';
import { getProfile, updateProfile } from './users.service';

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any).sub;
  const user = await getProfile(userId);
  return reply.code(200).send(user);
}

export async function updateMeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { full_name } = updateProfileBodySchema.parse(request.body);
    const userId = (request.user as any).sub;

    if (!full_name) {
      return reply.code(400).send({ error: 'No hay datos para actualizar' });
    }

    const user = await updateProfile(userId, full_name);
    return reply.code(200).send(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Datos inválidos' });
    }
    throw error;
  }
}