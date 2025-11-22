import { z } from 'zod';

export const createReadjustmentSchema = z.object({
  goalId: z.string(),
  reason: z.string().max(500).optional(),
});

export const readjustmentResponseSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  previousSnapshot: z.string(),
  newSnapshot: z.string(),
  reason: z.string().nullable(),
  createdAt: z.date(),
});


