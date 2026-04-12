import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;