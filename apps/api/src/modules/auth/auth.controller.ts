import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requestOtpBodySchema, verifyOtpBodySchema, setPinBodySchema, loginBodySchema } from './auth.schemas';
import { requestOtp, verifyOtp, setPin, loginWithPin } from './auth.service';

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

export async function setPinHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { pin } = setPinBodySchema.parse(request.body);
    const userId = (request.user as any).sub;
    await setPin(userId, pin);
    return reply.code(200).send({ message: "PIN configurado correctamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: "PIN inválido" });
    }
    throw error;
  }
}

export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { phone, pin } = loginBodySchema.parse(request.body);
    const { token } = await loginWithPin(phone, pin);
    return reply.code(200).send({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: "Datos inválidos" });
    }
    if (error instanceof Error) {
      if (error.message === "Credenciales inválidas") {
        return reply.code(401).send({ error: "Teléfono o PIN incorrecto" });
      }
      if (error.message === "PIN no configurado") {
        return reply.code(403).send({ error: "Debes configurar tu PIN primero" });
      }
    }
    throw error;
  }
}
