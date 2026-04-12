import { z } from 'zod';

export const createBetBodySchema = z.object({
  fight_id: z.string().uuid(),
  side: z.enum(['RED', 'GREEN']),
  bet_type: z.enum(['PAREJA', 'DANDO_90', 'DANDO_80', 'AGARRANDO_90', 'AGARRANDO_80']),
  amount_staked: z.number().positive().multipleOf(0.01),
});

export const listMyBetsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type CreateBetBody = z.infer<typeof createBetBodySchema>;
export type ListMyBetsQuery = z.infer<typeof listMyBetsQuerySchema>;