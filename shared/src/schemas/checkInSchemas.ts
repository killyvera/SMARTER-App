import { z } from 'zod';

export const createCheckInSchema = z.object({
  goalId: z.string(),
  progressPercentage: z.number().min(0).max(100),
  currentValue: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  mood: z.string().max(50).optional(),
});

export const checkInResponseSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  progressPercentage: z.number(),
  currentValue: z.string().nullable(),
  notes: z.string().nullable(),
  mood: z.string().nullable(),
  createdAt: z.date(),
});


