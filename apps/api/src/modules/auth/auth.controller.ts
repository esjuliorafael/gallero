import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requestOtpBodySchema } from './auth.schemas';
import { requestOtp } from './auth.service';

export async function requestOtpHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { phone } = requestOtpBodySchema.parse(request.body);
    await requestOtp(phone);
    return reply.code(200).send({ message: "Código enviado por WhatsApp" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: "Teléfono inválido" });
    }
    throw error;
  }
}
