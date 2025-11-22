'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { CheckInResponse, CreateCheckInInput } from '@smarter-app/shared';

export function useCheckIns(goalId: string) {
  return useQuery({
    queryKey: ['checkins', goalId],
    queryFn: () =>
      apiRequest<CheckInResponse[]>(`/checkins/goal/${goalId}`, {
        method: 'GET',
      }),
    enabled: !!goalId,
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCheckInInput) =>
      apiRequest<CheckInResponse>('/checkins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checkins', variables.goalId] });
    },
  });
}


