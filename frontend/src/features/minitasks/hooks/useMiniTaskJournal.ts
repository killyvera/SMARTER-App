'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type {
  MiniTaskJournalEntry,
  CreateMiniTaskJournalEntryInput,
  UpdateMiniTaskJournalEntryInput,
  CoachQueryRequest,
  CoachQueryResponse,
} from '@/types/miniTaskJournal';

export function useMiniTaskJournal(
  miniTaskId: string,
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }
) {
  const queryParams = new URLSearchParams();
  if (filters?.dateFrom) {
    queryParams.append('dateFrom', filters.dateFrom.toISOString());
  }
  if (filters?.dateTo) {
    queryParams.append('dateTo', filters.dateTo.toISOString());
  }
  if (filters?.limit) {
    queryParams.append('limit', filters.limit.toString());
  }
  
  const queryString = queryParams.toString();
  const url = `/minitasks/${miniTaskId}/journal${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: ['minitask-journal', miniTaskId, filters],
    queryFn: () =>
      apiRequest<MiniTaskJournalEntry[]>(url, {
        method: 'GET',
      }),
    enabled: !!miniTaskId,
  });
}

export function useCreateMiniTaskJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ miniTaskId, data }: { miniTaskId: string; data: CreateMiniTaskJournalEntryInput }) =>
      apiRequest<MiniTaskJournalEntry>(`/minitasks/${miniTaskId}/journal`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['minitask-journal', variables.miniTaskId] });
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
      queryClient.invalidateQueries({ queryKey: ['minitasks', { goalId: variables.miniTaskId }] });
    },
  });
}

export function useUpdateMiniTaskJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      miniTaskId,
      entryId,
      data,
    }: {
      miniTaskId: string;
      entryId: string;
      data: UpdateMiniTaskJournalEntryInput;
    }) =>
      apiRequest<MiniTaskJournalEntry>(`/minitasks/${miniTaskId}/journal/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['minitask-journal', variables.miniTaskId] });
    },
  });
}

export function useDeleteMiniTaskJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ miniTaskId, entryId }: { miniTaskId: string; entryId: string }) =>
      apiRequest(`/minitasks/${miniTaskId}/journal/${entryId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['minitask-journal', variables.miniTaskId] });
    },
  });
}

export function useQueryCoach() {
  return useMutation({
    mutationFn: ({ miniTaskId, query, includeHistory }: { miniTaskId: string } & CoachQueryRequest) =>
      apiRequest<CoachQueryResponse>(`/minitasks/${miniTaskId}/journal/coach`, {
        method: 'POST',
        body: JSON.stringify({ query, includeHistory }),
      }),
  });
}

export function useJournalMetrics(
  miniTaskId: string,
  dateRange?: { from: Date; to: Date }
) {
  const queryParams = new URLSearchParams();
  if (dateRange?.from) {
    queryParams.append('dateFrom', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    queryParams.append('dateTo', dateRange.to.toISOString());
  }
  
  const queryString = queryParams.toString();
  const url = `/minitasks/${miniTaskId}/journal/metrics${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: ['minitask-journal-metrics', miniTaskId, dateRange],
    queryFn: () =>
      apiRequest<{
        totalEntries: number;
        daysWithEntries: number;
        totalTimeSpent: number;
        avgProgress: number;
        progressByDate: Array<{ date: string; value: number; unit: string }>;
        entries: MiniTaskJournalEntry[];
      }>(url, {
        method: 'GET',
      }),
    enabled: !!miniTaskId,
  });
}

