'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface UpdatePositionInput {
  positionX: number;
  positionY: number;
}

export function useUpdateNotePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ miniTaskId, position }: { miniTaskId: string; position: UpdatePositionInput }) => {
      return apiRequest(`/minitasks/${miniTaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          positionX: position.positionX,
          positionY: position.positionY,
        }),
      });
    },
    onSuccess: () => {
      // Invalidar queries de minitasks para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['minitasks'] });
    },
  });
}

