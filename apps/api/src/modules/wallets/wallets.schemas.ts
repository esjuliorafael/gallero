import { z } from 'zod';

export const ledgerQuerySchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// 👇 nuevo
export const depositBodySchema = z.object({
  amount: z.number().positive().multipleOf(0.01).max(100000),
});

export type LedgerQuery   = z.infer<typeof ledgerQuerySchema>;
export type DepositBody   = z.infer<typeof depositBodySchema>;