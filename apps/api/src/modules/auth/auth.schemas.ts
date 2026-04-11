import { z } from 'zod';

export const requestOtpBodySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Teléfono inválido")
});

export type RequestOtpBody = z.infer<typeof requestOtpBodySchema>;
