import { prisma } from '@/lib/prisma/client';
import type { MiniTaskJournalEntry } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

export async function createMiniTaskJournalEntry(
  miniTaskId: string,
  data: {
    entryDate?: Date;
    progressValue?: number;
    progressUnit?: string;
    notes?: string;
    obstacles?: string;
    mood?: string;
    timeSpent?: number;
    metricsData?: Record<string, any>;
  }
): Promise<MiniTaskJournalEntry> {
  const entryDate = data.entryDate ? startOfDay(data.entryDate) : startOfDay(new Date());
  
  return prisma.miniTaskJournalEntry.create({
    data: {
      miniTaskId,
      entryDate,
      progressValue: data.progressValue,
      progressUnit: data.progressUnit,
      notes: data.notes,
      obstacles: data.obstacles,
      mood: data.mood,
      timeSpent: data.timeSpent,
      metricsData: data.metricsData ? JSON.stringify(data.metricsData) : null,
    },
  });
}

export async function findMiniTaskJournalEntryById(id: string): Promise<MiniTaskJournalEntry | null> {
  const entry = await prisma.miniTaskJournalEntry.findUnique({
    where: { id },
  });
  
  if (!entry) return null;
  
  return {
    ...entry,
    metricsData: entry.metricsData ? JSON.parse(entry.metricsData) : null,
  } as any;
}

export async function findMiniTaskJournalEntries(
  miniTaskId: string,
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }
): Promise<MiniTaskJournalEntry[]> {
  const where: any = { miniTaskId };
  
  if (filters?.dateFrom || filters?.dateTo) {
    where.entryDate = {};
    if (filters.dateFrom) {
      where.entryDate.gte = startOfDay(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.entryDate.lte = endOfDay(filters.dateTo);
    }
  }
  
  const entries = await prisma.miniTaskJournalEntry.findMany({
    where,
    orderBy: {
      entryDate: 'desc',
    },
    take: filters?.limit,
  });
  
  return entries.map(entry => ({
    ...entry,
    metricsData: entry.metricsData ? JSON.parse(entry.metricsData) : null,
  })) as any;
}

export async function findMiniTaskJournalEntryByDate(
  miniTaskId: string,
  date: Date
): Promise<MiniTaskJournalEntry | null> {
  const entryDate = startOfDay(date);
  
  const entry = await prisma.miniTaskJournalEntry.findUnique({
    where: {
      miniTaskId_entryDate: {
        miniTaskId,
        entryDate,
      },
    },
  });
  
  if (!entry) return null;
  
  return {
    ...entry,
    metricsData: entry.metricsData ? JSON.parse(entry.metricsData) : null,
  } as any;
}

export async function updateMiniTaskJournalEntry(
  id: string,
  data: {
    progressValue?: number;
    progressUnit?: string;
    notes?: string;
    obstacles?: string;
    mood?: string;
    timeSpent?: number;
    metricsData?: Record<string, any>;
    coachQuery?: string;
    coachResponse?: string;
    coachSuggestions?: string;
  }
): Promise<MiniTaskJournalEntry> {
  const updateData: any = {};
  
  if (data.progressValue !== undefined) updateData.progressValue = data.progressValue;
  if (data.progressUnit !== undefined) updateData.progressUnit = data.progressUnit;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.obstacles !== undefined) updateData.obstacles = data.obstacles;
  if (data.mood !== undefined) updateData.mood = data.mood;
  if (data.timeSpent !== undefined) updateData.timeSpent = data.timeSpent;
  if (data.metricsData !== undefined) updateData.metricsData = JSON.stringify(data.metricsData);
  if (data.coachQuery !== undefined) updateData.coachQuery = data.coachQuery;
  if (data.coachResponse !== undefined) updateData.coachResponse = data.coachResponse;
  if (data.coachSuggestions !== undefined) updateData.coachSuggestions = JSON.stringify(data.coachSuggestions);
  
  const entry = await prisma.miniTaskJournalEntry.update({
    where: { id },
    data: updateData,
  });
  
  return {
    ...entry,
    metricsData: entry.metricsData ? JSON.parse(entry.metricsData) : null,
  } as any;
}

export async function deleteMiniTaskJournalEntry(id: string): Promise<void> {
  await prisma.miniTaskJournalEntry.delete({
    where: { id },
  });
}

export async function getJournalMetrics(
  miniTaskId: string,
  dateRange?: { from: Date; to: Date }
) {
  const where: any = { miniTaskId };
  
  if (dateRange) {
    where.entryDate = {
      gte: startOfDay(dateRange.from),
      lte: endOfDay(dateRange.to),
    };
  }
  
  const entries = await prisma.miniTaskJournalEntry.findMany({
    where,
    orderBy: {
      entryDate: 'asc',
    },
  });
  
  const totalEntries = entries.length;
  const daysWithEntries = new Set(entries.map(e => e.entryDate.toISOString().split('T')[0])).size;
  const totalTimeSpent = entries.reduce((sum, e) => sum + (e.timeSpent || 0), 0);
  const avgProgress = entries.length > 0
    ? entries.reduce((sum, e) => sum + (e.progressValue || 0), 0) / entries.length
    : 0;
  
  const progressByDate = entries
    .filter(e => e.progressValue !== null)
    .map(e => ({
      date: e.entryDate.toISOString().split('T')[0],
      value: e.progressValue!,
      unit: e.progressUnit || 'unidades',
    }));
  
  return {
    totalEntries,
    daysWithEntries,
    totalTimeSpent,
    avgProgress,
    progressByDate,
    entries: entries.map(entry => ({
      ...entry,
      metricsData: entry.metricsData ? JSON.parse(entry.metricsData) : null,
    })),
  };
}

