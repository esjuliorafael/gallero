import { z } from 'zod';

export const requestOtpBodySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Teléfono inválido")
});

export type RequestOtpBody = z.infer<typeof requestOtpBodySchema>;

export const verifyOtpBodySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Teléfono inválido"),
  code: z.string().regex(/^\d{6}$/, "Código inválido")
});

export type VerifyOtpBody = z.infer<typeof verifyOtpBodySchema>;
