'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useAlarmStore } from '@/stores/alarmStore';
import { usePendingTasks } from '@/features/alarms/hooks/usePendingTasks';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

export function PendingTasksNotification() {
  const { pendingTasks, pendingCount } = useAlarmStore();
  const { isLoading } = usePendingTasks();
  const router = useRouter();

  if (isLoading || pendingCount === 0) {
    return null;
  }

  const handleTaskClick = (taskId: string) => {
    router.push(`/minitasks/${taskId}`);
  };

  const handleDismiss = (taskId: string) => {
    useAlarmStore.getState().removePendingTask(taskId);
  };

  const formatAlarmTime = (time?: string) => {
    if (!time) return '';
    try {
      const parsed = parse(time, 'HH:mm', new Date());
      return format(parsed, 'HH:mm', { locale: es });
    } catch {
      return time;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-orange-900 dark:text-orange-100">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Tareas Pendientes de Hoy</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => useAlarmStore.getState().clearAll()}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3">
          {pendingTasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between gap-2 rounded-lg border bg-white p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-800"
              onClick={() => handleTaskClick(task.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  <h4 className="font-medium text-xs sm:text-sm truncate">{task.title}</h4>
                  {task.checklistEnabled && (
                    <div className="flex items-center gap-1">
                      {task.checklistCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  )}
                  {task.alarmTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatAlarmTime(task.alarmTime)}</span>
                    </div>
                  )}
                </div>
                {task.goalTitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    Meta: {task.goalTitle}
                  </p>
                )}
                {task.message && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.message}
                  </p>
                )}
                {task.checklistEnabled && (
                  <p className="text-xs mt-1">
                    <span className={task.checklistCompleted ? 'text-green-600' : 'text-yellow-600'}>
                      Checklist: {task.checklistCompleted ? 'Completado' : 'Pendiente'}
                    </span>
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(task.id);
                }}
                className="h-6 w-6 p-0 ml-2 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {pendingTasks.length > 5 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Y {pendingTasks.length - 5} más...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

