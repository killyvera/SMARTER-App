'use client';

import { Bell } from 'lucide-react';
import { useAlarmStore } from '@/stores/alarmStore';
import { usePendingTasks } from '@/features/alarms/hooks/usePendingTasks';
import { useEffect } from 'react';

export function AlarmBadge() {
  const { pendingCount } = useAlarmStore();
  const { refetch } = usePendingTasks();

  // Refrescar al montar el componente
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (pendingCount === 0) {
    return (
      <div className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-muted-foreground" />
      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
        {pendingCount > 9 ? '9+' : pendingCount}
      </span>
    </div>
  );
}

