import {
  createMiniTaskJournalEntry,
  findMiniTaskJournalEntries,
  findMiniTaskJournalEntryByDate,
  findMiniTaskJournalEntryById,
  updateMiniTaskJournalEntry,
  deleteMiniTaskJournalEntry,
  getJournalMetrics,
} from '@/repositories/miniTaskJournalRepository';
import { findMiniTaskById } from '@/repositories/miniTaskRepository';
import { queryMiniTaskCoach } from '@/clients/aiClient';
import type { MiniTaskCoachContext } from '@/types/miniTaskJournal';
import { createMiniTaskMetric } from '@/repositories/miniTaskRepository';
import { startOfDay } from 'date-fns';
import type { CreateMiniTaskJournalEntryInput, UpdateMiniTaskJournalEntryInput } from '@/types/miniTaskJournal';

export async function createMiniTaskJournalEntryService(
  userId: string,
  miniTaskId: string,
  input: CreateMiniTaskJournalEntryInput
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  // Verificar si ya existe una entrada para esta fecha
  // Normalizar la fecha al inicio del día para evitar problemas de zona horaria
  let entryDate: Date;
  if (input.entryDate) {
    // Si es un Date object, usarlo directamente
    if (input.entryDate instanceof Date) {
      entryDate = new Date(input.entryDate);
    } else if (typeof input.entryDate === 'string') {
      // Si es un string de fecha (YYYY-MM-DD), crear la fecha en zona horaria local
      // para evitar que se interprete como UTC y cambie el día
      const dateStr = input.entryDate.split('T')[0]; // Solo la parte de fecha
      const [year, month, day] = dateStr.split('-').map(Number);
      entryDate = new Date(year, month - 1, day);
    } else {
      entryDate = new Date(input.entryDate);
    }
  } else {
    entryDate = new Date();
  }
  
  // Normalizar al inicio del día usando startOfDay de date-fns
  entryDate = startOfDay(entryDate);
  
  const existingEntry = await findMiniTaskJournalEntryByDate(miniTaskId, entryDate);
  
  if (existingEntry) {
    // Si existe, actualizar en lugar de crear
    return updateMiniTaskJournalEntry(existingEntry.id, {
      progressValue: input.progressValue,
      progressUnit: input.progressUnit,
      notes: input.notes,
      obstacles: input.obstacles,
      mood: input.mood,
      timeSpent: input.timeSpent,
      checklistCompleted: input.checklistCompleted,
      metricsData: input.metricsData,
    });
  }
  
  // Crear nueva entrada
  const entry = await createMiniTaskJournalEntry(miniTaskId, {
    entryDate,
    progressValue: input.progressValue,
    progressUnit: input.progressUnit,
    notes: input.notes,
    obstacles: input.obstacles,
    mood: input.mood,
    timeSpent: input.timeSpent,
    checklistCompleted: input.checklistCompleted,
    metricsData: input.metricsData,
  });
  
  // Si hay progreso registrado, crear métrica automáticamente
  if (input.progressValue !== undefined && miniTask.unlocked) {
    const progressPlugin = miniTask.plugins?.find((p: any) => p.pluginId === 'progress-tracker' && p.enabled);
    if (progressPlugin) {
      try {
        await createMiniTaskMetric(
          miniTaskId,
          'progress-tracker',
          'progress',
          input.progressValue,
          {
            unit: input.progressUnit,
            entryDate: entryDate.toISOString(),
            journalEntryId: entry.id,
          }
        );
      } catch (error) {
        console.warn('Error al crear métrica automática desde journal:', error);
      }
    }
  }
  
  return entry;
}

export async function getMiniTaskJournalEntriesService(
  userId: string,
  miniTaskId: string,
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  return findMiniTaskJournalEntries(miniTaskId, filters);
}

export async function updateMiniTaskJournalEntryService(
  userId: string,
  entryId: string,
  input: UpdateMiniTaskJournalEntryInput
) {
  // Verificar que la entrada pertenece a una minitask del usuario
  const entry = await findMiniTaskJournalEntryById(entryId);
  
  if (!entry) {
    throw new Error('Entrada del journal no encontrada');
  }
  
  const miniTask = await findMiniTaskById(entry.miniTaskId) as any;
  
  if (!miniTask || miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  return updateMiniTaskJournalEntry(entryId, input);
}

export async function deleteMiniTaskJournalEntryService(
  userId: string,
  entryId: string
) {
  // Verificar que la entrada pertenece a una minitask del usuario
  const entry = await findMiniTaskJournalEntryById(entryId);
  
  if (!entry) {
    throw new Error('Entrada del journal no encontrada');
  }
  
  const miniTask = await findMiniTaskById(entry.miniTaskId) as any;
  
  if (!miniTask || miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  return deleteMiniTaskJournalEntry(entryId);
}

export async function queryCoachService(
  userId: string,
  miniTaskId: string,
  query: string,
  includeHistory: boolean = true
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  // Obtener historial del journal si se solicita
  let journalHistory = undefined;
  let currentMetrics = undefined;
  
  if (includeHistory) {
    const entries = await findMiniTaskJournalEntries(miniTaskId, { limit: 14 });
    journalHistory = entries.map(entry => ({
      entryDate: entry.entryDate,
      progressValue: entry.progressValue ?? undefined,
      progressUnit: entry.progressUnit ?? undefined,
      notes: entry.notes ?? undefined,
      obstacles: entry.obstacles ?? undefined,
      mood: entry.mood ?? undefined,
      timeSpent: entry.timeSpent ?? undefined,
    }));
    
    const metrics = await getJournalMetrics(miniTaskId);
    currentMetrics = {
      totalEntries: metrics.totalEntries,
      daysWithEntries: metrics.daysWithEntries,
      avgProgress: metrics.avgProgress,
      totalTimeSpent: metrics.totalTimeSpent,
    };
  }
  
  // Preparar contexto para el coach
  const context: MiniTaskCoachContext = {
    miniTask: {
      id: miniTask.id,
      title: miniTask.title,
      description: miniTask.description,
      deadline: miniTask.deadline,
      status: miniTask.status,
      unlocked: miniTask.unlocked ?? false,
    },
    goal: {
      title: miniTask.goal?.title || '',
      description: miniTask.goal?.description,
    },
    plugins: miniTask.plugins?.map((p: any) => ({
      pluginId: p.pluginId,
      config: typeof p.config === 'string' ? JSON.parse(p.config) : p.config,
      enabled: p.enabled,
    })),
    journalHistory,
    currentMetrics,
  };
  
  // Consultar al coach
  const coachResponse = await queryMiniTaskCoach(context, query);
  
  // Guardar la consulta y respuesta en la última entrada del journal (si existe)
  if (includeHistory && journalHistory && journalHistory.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntry = await findMiniTaskJournalEntryByDate(miniTaskId, today);
    
    if (todayEntry) {
      await updateMiniTaskJournalEntry(todayEntry.id, {
        coachQuery: query,
        coachResponse: coachResponse.feedback,
        coachSuggestions: JSON.stringify(coachResponse.suggestions),
      });
    }
  }
  
  return coachResponse;
}

export async function getJournalMetricsService(
  userId: string,
  miniTaskId: string,
  dateRange?: { from: Date; to: Date }
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }
  
  return getJournalMetrics(miniTaskId, dateRange);
}

