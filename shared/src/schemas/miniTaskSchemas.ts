import { z } from 'zod';

export const miniTaskStatusSchema = z.enum(['DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

export const createMiniTaskSchema = z.object({
  goalId: z.string(),
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(500).optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
  plannedHours: z.number().positive().optional(),
  isSingleDayTask: z.boolean().optional(),
});

export const updateMiniTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  deadline: z.string().datetime().optional().or(z.date().optional()),
  status: miniTaskStatusSchema.optional(),
  plannedHours: z.number().positive().optional(),
  isSingleDayTask: z.boolean().optional(),
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
  unlocked: z.boolean().optional(),
  plannedHours: z.number().nullable().optional(),
  isSingleDayTask: z.boolean().optional(),
  metricsConfig: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  score: miniTaskScoreSchema.nullable().optional(),
});

export const createMiniTaskJournalEntrySchema = z.object({
  entryDate: z.string().datetime().optional().or(z.date().optional()),
  progressValue: z.number().optional(),
  progressUnit: z.string().optional(),
  notes: z.string().max(2000).optional(),
  obstacles: z.string().max(1000).optional(),
  mood: z.enum(['positivo', 'neutral', 'negativo']).optional(),
  timeSpent: z.number().int().min(0).optional(),
  checklistCompleted: z.boolean().optional(),
  metricsData: z.record(z.any()).optional(),
});

export const updateMiniTaskJournalEntrySchema = z.object({
  progressValue: z.number().optional(),
  progressUnit: z.string().optional(),
  notes: z.string().max(2000).optional(),
  obstacles: z.string().max(1000).optional(),
  mood: z.enum(['positivo', 'neutral', 'negativo']).optional(),
  timeSpent: z.number().int().min(0).optional(),
  checklistCompleted: z.boolean().optional(),
  metricsData: z.record(z.any()).optional(),
});

export const coachQuerySchema = z.object({
  query: z.string().min(1, 'La pregunta es requerida').max(500),
  includeHistory: z.boolean().optional().default(true),
});

export const miniTaskJournalEntryResponseSchema = z.object({
  id: z.string(),
  miniTaskId: z.string(),
  entryDate: z.date(),
  progressValue: z.number().nullable(),
  progressUnit: z.string().nullable(),
  notes: z.string().nullable(),
  obstacles: z.string().nullable(),
  mood: z.string().nullable(),
  timeSpent: z.number().nullable(),
  checklistCompleted: z.boolean().nullable(),
  metricsData: z.string().nullable(),
  coachQuery: z.string().nullable(),
  coachResponse: z.string().nullable(),
  coachSuggestions: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});


