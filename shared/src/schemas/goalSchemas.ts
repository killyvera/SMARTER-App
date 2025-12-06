import { z } from 'zod';

export const goalStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']);

// Schema para fecha en formato datetime-local (YYYY-MM-DDTHH:mm)
const datetimeLocalSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
  'Formato de fecha inválido. Use YYYY-MM-DDTHH:mm'
).optional();

export const createGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(1000).optional(),
  deadline: datetimeLocalSchema.or(z.string().datetime().optional()).or(z.date().optional()),
  plannedHours: z.number().positive().optional(),
  isSingleDayGoal: z.boolean().optional(),
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
  plannedHours: z.number().nullable().optional(),
  isSingleDayGoal: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  smarterScore: smarterScoreSchema.nullable().optional(),
});


