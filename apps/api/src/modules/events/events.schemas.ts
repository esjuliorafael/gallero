import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  speaker_name: z.string(),
  speaker_title: z.string().optional(),
  price: z.number().positive(),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.number().int().positive().optional(),
  preview_video_url: z.string().url().optional(),
  stream_key: z.string().optional(),
  playback_id: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const purchaseTicketSchema = z.object({
  payment_proof_url: z.string().url(),
});

export const approveTicketSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export type CreateEventBody = z.infer<typeof createEventSchema>;
export type UpdateEventBody = z.infer<typeof updateEventSchema>;
export type PurchaseTicketBody = z.infer<typeof purchaseTicketSchema>;
export type ApproveTicketBody = z.infer<typeof approveTicketSchema>;
