'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MiniTaskResponse } from '@smarter-app/shared';
import { CheckCircle2, Circle, XCircle, Clock, Lock, Unlock, ArrowRight, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef } from 'react';
import { useMiniTaskJournal } from '../hooks/useMiniTaskJournal';
import { startOfDay, isToday } from 'date-fns';

interface MiniTaskCardProps {
  miniTask: MiniTaskResponse & { 
    unlocked?: boolean; 
    plugins?: Array<{ pluginId: string; config?: any }>;
    order?: number;
    priority?: string | null;
    dependsOn?: string | null;
    schedulingType?: string | null;
  };
  onStatusChange?: (id: string, status: string) => void;
  onUnlock?: (id: string) => Promise<void>;
  dependencyTask?: { id: string; title: string } | null; // Tarea de la que depende
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

// Función helper para truncar texto por palabras completas
function truncateByWords(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Truncar hasta maxLength caracteres
  const truncated = text.substring(0, maxLength);
  
  // Buscar el último espacio para no cortar palabras
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Si hay un espacio y no está muy cerca del inicio, usar ese punto
  if (lastSpace > maxLength * 0.5) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  // Si no hay espacio razonable, simplemente truncar y agregar puntos
  return truncated + '...';
}

export function MiniTaskCard({ miniTask, onStatusChange, onUnlock, dependencyTask }: MiniTaskCardProps) {
  const router = useRouter();
  const Icon = statusIcons[miniTask.status] || Circle;
  const isUnlocked = miniTask.unlocked ?? false;
  
  // Prioridad con colores
  const priorityColor = useMemo(() => {
    if (miniTask.priority === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (miniTask.priority === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (miniTask.priority === 'low') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }, [miniTask.priority]);
  
  const priorityLabel = useMemo(() => {
    if (miniTask.priority === 'high') return 'Alta';
    if (miniTask.priority === 'medium') return 'Media';
    if (miniTask.priority === 'low') return 'Baja';
    return null;
  }, [miniTask.priority]);
  
  // Scheduling type label
  const schedulingLabel = useMemo(() => {
    if (miniTask.schedulingType === 'sequential') return 'Secuencial';
    if (miniTask.schedulingType === 'parallel') return 'Paralela';
    if (miniTask.schedulingType === 'daily') return 'Diaria';
    if (miniTask.schedulingType === 'scheduled') return 'Programada';
    return null;
  }, [miniTask.schedulingType]);

  // Determinar si es diaria basado en plugins calendar
  const isDaily = useMemo(() => {
    if (!isUnlocked || !miniTask.plugins) return false;
    const calendarPlugin = miniTask.plugins.find((p: any) => p.pluginId === 'calendar');
    return calendarPlugin?.config?.frequency === 'diaria';
  }, [isUnlocked, miniTask.plugins]);

  // Obtener entradas del journal para calcular cumplimiento (solo si está desbloqueada)
  // Usar ref para mantener fechas estables y evitar re-fetches infinitos
  const todayRangeRef = useRef<{ dateFrom: Date; dateTo: Date }>();
  if (!todayRangeRef.current) {
    const today = new Date();
    todayRangeRef.current = {
      dateFrom: startOfDay(today),
      dateTo: today,
    };
  }
  
  const { data: journalEntries } = useMiniTaskJournal(miniTask.id, isUnlocked ? todayRangeRef.current : undefined);

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
      className="bg-card border rounded-lg p-3 sm:p-4 cursor-pointer hover:border-primary transition-colors w-full"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1 mt-0.5">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />
            {miniTask.order !== undefined && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span>{miniTask.order + 1}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h4 
                className="font-semibold text-base sm:text-lg break-words overflow-wrap-anywhere flex-1" 
                title={miniTask.title}
              >
                {miniTask.title}
              </h4>
              {priorityLabel && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${priorityColor}`}>
                  {priorityLabel}
                </span>
              )}
            </div>
            {miniTask.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words overflow-wrap-anywhere">
                {miniTask.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{taskType}</span>
              {schedulingLabel && (
                <span className="text-xs text-muted-foreground">• {schedulingLabel}</span>
              )}
              {miniTask.dependsOn && dependencyTask && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  <span className="truncate max-w-[100px]" title={dependencyTask.title}>
                    Depende de: {dependencyTask.title}
                  </span>
                </div>
              )}
              {!isUnlocked && (
                <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              {isUnlocked && (
                <Unlock className="h-3 w-3 text-green-600 flex-shrink-0" />
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


