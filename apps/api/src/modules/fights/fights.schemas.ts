import { z } from 'zod';

export const createFightBodySchema = z.object({
  red_party_name:   z.string().min(2).max(100),
  green_party_name: z.string().min(2).max(100),
});

export const listFightsQuerySchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'RESOLVING', 'FINISHED_RED', 'FINISHED_GREEN', 'FINISHED_DRAW', 'CANCELED']).optional(),
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(50).default(10),
});

// 👇 nuevo
export const resolveFightBodySchema = z.object({
  result: z.enum(['RED', 'GREEN', 'DRAW']),
});

export type CreateFightBody  = z.infer<typeof createFightBodySchema>;
export type ListFightsQuery  = z.infer<typeof listFightsQuerySchema>;
export type ResolveFightBody = z.infer<typeof resolveFightBodySchema>;