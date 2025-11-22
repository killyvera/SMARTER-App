import { z } from 'zod';

export const miniTaskStatusSchema = z.enum(['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

export const createMiniTaskSchema = z.object({
  goalId: z.string(),
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(500).optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
});

export const updateMiniTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
  status: miniTaskStatusSchema.optional(),
});

export const miniTaskScoreSchema = z.object({
  specific: z.number().min(0).max(100),
  measurable: z.number().min(0).max(100),
  achievable: z.number().min(0).max(100),
  relevant: z.number().min(0).max(100),
  timebound: z.number().min(0).max(100),
  average: z.number().min(0).max(100),
  passed: z.boolean(),
});

export const miniTaskResponseSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: miniTaskStatusSchema,
  deadline: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  score: miniTaskScoreSchema.nullable().optional(),
});


