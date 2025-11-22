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
    },
  });
}

export function useValidateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ score: any; feedback: string }>(`/goals/${id}/validate`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['goals', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
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
    },
  });
}


