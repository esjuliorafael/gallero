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

export const setPinBodySchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN inválido")
});

export type SetPinBody = z.infer<typeof setPinBodySchema>;

export const loginBodySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Teléfono inválido"),
  pin: z.string().regex(/^\d{4}$/, "PIN inválido")
});

export type LoginBody = z.infer<typeof loginBodySchema>;
