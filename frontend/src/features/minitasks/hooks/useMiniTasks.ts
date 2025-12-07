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
    queryKey: ['minitasks', filters || 'all'],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.goalId) params.append('goalId', filters.goalId);
      if (filters?.status) params.append('status', filters.status);
      const queryString = params.toString();
      return apiRequest<MiniTaskResponse[]>(`/minitasks${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
      });
    },
    // Habilitar siempre - el endpoint ahora soporta obtener todas sin filtros
    enabled: true,
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
      // Invalidar stats cuando se actualiza una minitask (puede afectar el progreso de goals)
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useValidateMiniTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔵 [VALIDATE MINITASK] Iniciando validación:', { miniTaskId: id });
      try {
        const result = await apiRequest<{ score: any; feedback: string; passed: boolean; isAction?: boolean }>(
          `/minitasks/${id}/validate`,
          {
            method: 'POST',
          }
        );
        console.log('✅ [VALIDATE MINITASK] Validación exitosa:', {
          miniTaskId: id,
          hasScore: !!result.score,
          passed: result.passed,
          feedback: result.feedback,
        });
        return result;
      } catch (error) {
        console.error('❌ [VALIDATE MINITASK] Error en validación:', {
          miniTaskId: id,
          error: error instanceof Error ? error.message : String(error),
          errorObject: error,
        });
        throw error;
      }
    },
    onSuccess: (_, id) => {
      console.log('🔄 [VALIDATE MINITASK] Invalidando queries después de validación:', { miniTaskId: id });
      queryClient.invalidateQueries({ queryKey: ['minitasks', id] });
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
    },
    onError: (error, id) => {
      console.error('❌ [VALIDATE MINITASK] Error en mutation:', {
        miniTaskId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}

export function useUnlockMiniTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{
        improvedTitle: string;
        improvedDescription?: string;
        metrics: any[];
        plugins: any[];
        smarterAnalysis: any;
      }>(`/minitasks/${id}/unlock`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['minitasks', id] });
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
    },
  });
}


