'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { GoalResponse, CreateGoalInput, UpdateGoalInput } from '@smarter-app/shared';

export function useGoals(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: () => apiRequest<GoalResponse[]>('/goals', {
      method: 'GET',
    }),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: () => apiRequest<GoalResponse>(`/goals/${id}`, {
      method: 'GET',
    }),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalInput) =>
      apiRequest<GoalResponse>('/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalInput }) =>
      apiRequest<GoalResponse>(`/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', variables.id] });
      // Invalidar stats cuando se actualiza una goal (puede afectar el progreso)
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useValidateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{
        score: any | null;
        feedback: string;
        suggestedTitle?: string | null;
        suggestedDescription?: string | null;
        suggestedMiniTasks: any[];
        previewScores?: any;
        previewAverage?: number;
        previewPassed?: boolean;
      }>(`/goals/${id}/validate`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['goals', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useConfirmGoalValidation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      goalId: string;
      acceptedTitle?: string;
      acceptedDescription?: string;
      acceptedMiniTasks?: Array<{ title: string; description?: string; priority: number }>;
    }) =>
      apiRequest<{ score: any; feedback: string; suggestedMiniTasks: any[] }>(
        `/goals/${data.goalId}/validate`,
        {
          method: 'POST',
          body: JSON.stringify({
            acceptedTitle: data.acceptedTitle,
            acceptedDescription: data.acceptedDescription,
            acceptedMiniTasks: data.acceptedMiniTasks,
          }),
        }
      ),
    onSuccess: (_, variables) => {
      console.log('🔄 [CONFIRM VALIDATION] Invalidando queries después de confirmar:', {
        goalId: variables.goalId,
        hasAcceptedMiniTasks: !!(variables.acceptedMiniTasks && variables.acceptedMiniTasks.length > 0),
        acceptedMiniTasksCount: variables.acceptedMiniTasks?.length || 0,
      });
      
      // Invalidar queries de goals
      queryClient.invalidateQueries({ queryKey: ['goals', variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Invalidar queries de minitasks para que se actualicen las nuevas minitasks creadas
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
      queryClient.invalidateQueries({ queryKey: ['minitasks', { goalId: variables.goalId }] });
    },
  });
}

export function useActivateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<GoalResponse>(`/goals/${id}/activate`, {
        method: 'PATCH',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['goals', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // Invalidar stats cuando se activa una goal
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}


