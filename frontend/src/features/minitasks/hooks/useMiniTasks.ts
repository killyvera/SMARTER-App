'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type {
  MiniTaskResponse,
  CreateMiniTaskInput,
  UpdateMiniTaskInput,
} from '@smarter-app/shared';

export function useMiniTasks(filters?: { goalId?: string; status?: string }) {
  return useQuery({
    queryKey: ['minitasks', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.goalId) params.append('goalId', filters.goalId);
      if (filters?.status) params.append('status', filters.status);
      return apiRequest<MiniTaskResponse[]>(`/minitasks?${params.toString()}`, {
        method: 'GET',
      });
    },
    enabled: !!(filters?.goalId || filters?.status),
  });
}

export function useMiniTask(id: string) {
  return useQuery({
    queryKey: ['minitasks', id],
    queryFn: () => apiRequest<MiniTaskResponse>(`/minitasks/${id}`, {
      method: 'GET',
    }),
    enabled: !!id,
  });
}

export function useCreateMiniTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMiniTaskInput) =>
      apiRequest<MiniTaskResponse>('/minitasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
    },
  });
}

export function useUpdateMiniTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMiniTaskInput }) =>
      apiRequest<MiniTaskResponse>(`/minitasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
      queryClient.invalidateQueries({ queryKey: ['minitasks', variables.id] });
    },
  });
}

export function useValidateMiniTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ score: any; feedback: string; passed: boolean }>(
        `/minitasks/${id}/validate`,
        {
          method: 'POST',
        }
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['minitasks', id] });
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
    },
  });
}


