'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MiniTaskResponse } from '@smarter-app/shared';
import { CheckCircle2, Circle, XCircle, Clock, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMiniTaskJournal } from '../hooks/useMiniTaskJournal';
import { startOfDay, isToday } from 'date-fns';

interface MiniTaskCardProps {
  miniTask: MiniTaskResponse & { unlocked?: boolean; plugins?: Array<{ pluginId: string; config?: any }> };
  onStatusChange?: (id: string, status: string) => void;
  onUnlock?: (id: string) => Promise<void>;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const statusIcons: Record<string, typeof Circle> = {
  DRAFT: Circle,
  PENDING: Clock,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export function MiniTaskCard({ miniTask, onStatusChange, onUnlock }: MiniTaskCardProps) {
  const router = useRouter();
  const Icon = statusIcons[miniTask.status] || Circle;
  const isUnlocked = miniTask.unlocked ?? false;

  // Determinar si es diaria basado en plugins calendar
  const isDaily = useMemo(() => {
    if (!isUnlocked || !miniTask.plugins) return false;
    const calendarPlugin = miniTask.plugins.find((p: any) => p.pluginId === 'calendar');
    return calendarPlugin?.config?.frequency === 'diaria';
  }, [isUnlocked, miniTask.plugins]);

  // Obtener entradas del journal para calcular cumplimiento (solo si está desbloqueada)
  const { data: journalEntries } = useMiniTaskJournal(miniTask.id, isUnlocked ? {
    dateFrom: startOfDay(new Date()),
    dateTo: new Date(),
  } : undefined);

  // Verificar si hay entrada de hoy (cumplimiento diario)
  const hasTodayEntry = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return false;
    return journalEntries.some(entry => isToday(new Date(entry.entryDate)));
  }, [journalEntries]);

  // Calcular porcentaje de cumplimiento basado en status
  const completionPercentage = useMemo(() => {
    if (miniTask.status === 'COMPLETED') return 100;
    if (miniTask.status === 'IN_PROGRESS') return 50;
    if (miniTask.status === 'PENDING') return 0;
    return 0;
  }, [miniTask.status]);

  // Para tareas diarias, el cumplimiento se basa en si hay entrada de hoy
  const dailyCompletionPercentage = isDaily && hasTodayEntry ? 100 : isDaily ? 0 : completionPercentage;

  const handleClick = () => {
    router.push(`/minitasks/${miniTask.id}`);
  };

  const taskType = isDaily ? 'Diaria' : miniTask.status === 'COMPLETED' ? 'Completada' : statusLabels[miniTask.status] || 'Pendiente';

  return (
    <div 
      className="bg-card border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-base truncate">{miniTask.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{taskType}</span>
              {!isUnlocked && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
              {isUnlocked && (
                <Unlock className="h-3 w-3 text-green-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cumplimiento</span>
          <span>{dailyCompletionPercentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              dailyCompletionPercentage === 100
                ? 'bg-green-500'
                : dailyCompletionPercentage > 0
                ? 'bg-primary'
                : 'bg-muted-foreground'
            }`}
            style={{ width: `${dailyCompletionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}


