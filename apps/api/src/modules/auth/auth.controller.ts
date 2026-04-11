import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requestOtpBodySchema, verifyOtpBodySchema } from './auth.schemas';
import { requestOtp, verifyOtp } from './auth.service';

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

export async function verifyOtpHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { phone, code } = verifyOtpBodySchema.parse(request.body);
    const { token, isNewUser } = await verifyOtp(phone, code);
    return reply.code(200).send({ token, isNewUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: "Datos inválidos" });
    }
    if (error instanceof Error && error.message === "OTP inválido o expirado") {
      return reply.code(401).send({ error: "Código incorrecto o expirado" });
    }
    throw error;
  }
}
