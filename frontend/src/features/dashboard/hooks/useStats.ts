'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface Stats {
  goals: {
    total: number;
    active: number;
    completed: number;
    draft: number;
  };
  miniTasks: {
    total: number;
    draft: number;
    pending: number;
    completed: number;
  };
  progress: {
    percentage: number;
    completed: number;
    total: number;
  };
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiRequest<Stats>('/stats', { method: 'GET' }),
  });
}

