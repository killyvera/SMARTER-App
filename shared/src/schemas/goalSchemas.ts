import { z } from 'zod';

export const goalStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);

export const createGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(1000).optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
});

export const updateGoalSchema = createGoalSchema.partial();

export const smarterScoreSchema = z.object({
  specific: z.number().min(0).max(100),
  measurable: z.number().min(0).max(100),
  achievable: z.number().min(0).max(100),
  relevant: z.number().min(0).max(100),
  timebound: z.number().min(0).max(100),
  evaluate: z.number().min(0).max(100),
  readjust: z.number().min(0).max(100),
  average: z.number().min(0).max(100),
  passed: z.boolean(),
});

export const goalResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: goalStatusSchema,
  deadline: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  smarterScore: smarterScoreSchema.nullable().optional(),
});


