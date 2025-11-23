'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAlarmStore } from '@/stores/alarmStore';
import { useEffect } from 'react';
import { startOfDay, endOfDay, isToday, format, parse } from 'date-fns';

export interface PendingTaskResponse {
  id: string;
  title: string;
  goalTitle?: string;
  alarmTime?: string;
  pluginId: string;
  checklistEnabled?: boolean;
  checklistCompleted?: boolean;
  message?: string;
}

export function usePendingTasks() {
  const { setPendingTasks, updateLastChecked } = useAlarmStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-tasks-today'],
    queryFn: async () => {
      const today = new Date();
      const response = await apiRequest<PendingTaskResponse[]>('/alarms/pending-today', {
        method: 'GET',
      });
      return response;
    },
    refetchInterval: 60000, // Refrescar cada minuto
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setPendingTasks(data);
      updateLastChecked();
    }
  }, [data, setPendingTasks, updateLastChecked]);

  return {
    pendingTasks: data || [],
    isLoading,
    refetch,
  };
}

