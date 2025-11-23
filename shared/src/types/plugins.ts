import { z } from 'zod';

// Tipos de plugins disponibles
export const PluginType = z.enum([
  'calendar',
  'reminder',
  'progress-tracker',
  'checklist',
  'timer',
  'notification',
  'mobile-push',
  'chart',
]);

export type PluginType = z.infer<typeof PluginType>;

// Configuración base de plugin
export const BasePluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'custom']).optional(),
  customFrequency: z.string().optional(),
});

export type BasePluginConfig = z.infer<typeof BasePluginConfigSchema>;

// Configuración específica de Calendar Plugin
export const CalendarPluginConfigSchema = BasePluginConfigSchema.extend({
  alarmTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(), // Array de horas HH:mm
  alarmTime: z.string().optional(), // HH:mm format (deprecated, usar alarmTimes)
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  reminderBefore: z.number().optional(), // minutos antes
  checklistEnabled: z.boolean().default(false), // Activar checklist
  checklistType: z.enum(['single', 'daily', 'multi-item']).optional(), // Tipo de checklist
  checklistLabel: z.string().optional(), // Etiqueta personalizada para el check (ej: "Tomar medicamento")
  checklistItems: z.array(z.string()).optional(), // Etiquetas iniciales para multi-item (ej: ["Lienzo", "Pinturas"])
});

export type CalendarPluginConfig = z.infer<typeof CalendarPluginConfigSchema>;

// Configuración específica de Reminder Plugin
export const ReminderPluginConfigSchema = BasePluginConfigSchema.extend({
  reminderTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(), // Array de horas HH:mm (formato validado)
  message: z.string().optional(),
  sound: z.boolean().default(false),
});

export type ReminderPluginConfig = z.infer<typeof ReminderPluginConfigSchema>;

// Configuración específica de Progress Tracker Plugin
export const ProgressTrackerPluginConfigSchema = BasePluginConfigSchema.extend({
  targetValue: z.number().optional(),
  unit: z.string().optional(), // e.g., "hours", "pages", "items"
  increment: z.number().default(1),
  showChart: z.boolean().default(true),
});

export type ProgressTrackerPluginConfig = z.infer<typeof ProgressTrackerPluginConfigSchema>;

// Configuración específica de Chart Plugin
export const ChartPluginConfigSchema = BasePluginConfigSchema.extend({
  chartType: z.enum(['bar', 'line', 'pie', 'area']).default('bar'),
  metricType: z.string(), // Tipo de métrica a graficar
  timeRange: z.enum(['day', 'week', 'month', 'all']).default('week'),
});

export type ChartPluginConfig = z.infer<typeof ChartPluginConfigSchema>;

// Configuración de métricas de minitask
export const MiniTaskMetricsConfigSchema = z.object({
  unlocked: z.boolean().default(false),
  unlockedAt: z.string().datetime().optional(),
  plugins: z.array(
    z.object({
      id: PluginType,
      config: z.record(z.any()), // Configuración específica del plugin
      enabled: z.boolean().default(true),
    })
  ),
  metrics: z.array(
    z.object({
      type: z.string(),
      pluginId: PluginType,
      target: z.any().optional(),
      unit: z.string().optional(),
    })
  ),
});

export type MiniTaskMetricsConfig = z.infer<typeof MiniTaskMetricsConfigSchema>;

// Respuesta de IA para unlock de minitask
export interface UnlockMiniTaskResponse {
  improvedTitle: string;
  improvedDescription?: string;
  metrics: Array<{
    type: string;
    description: string;
    target?: number;
    unit?: string;
  }>;
  plugins: Array<{
    id: PluginType;
    reason: string;
    config: Record<string, any>;
  }>;
  smarterAnalysis: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
    average: number;
    passed: boolean;
    feedback: string;
  };
}

