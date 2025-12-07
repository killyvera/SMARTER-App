'use client';

import { useMemo, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';
import { useCreateMiniTaskJournalEntry, useUpdateMiniTaskJournalEntry, useDeleteMiniTaskJournalEntry } from '@/features/minitasks/hooks/useMiniTaskJournal';
import { useUpdateMiniTask } from '@/features/minitasks/hooks/useMiniTasks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock as ClockIcon, AlertCircle, XCircle, Circle } from 'lucide-react';

interface CalendarViewProps {
  miniTaskId: string;
  frequency?: string;
  alarmTime?: string;
  alarmTimes?: string[];
  checklistEnabled?: boolean;
  checklistType?: 'single' | 'daily' | 'multi-item';
  journalEntries?: MiniTaskJournalEntry[];
  miniTaskStatus?: string;
}

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function CalendarView({ 
  miniTaskId, 
  frequency = 'diaria', 
  alarmTime, 
  alarmTimes, 
  checklistEnabled, 
  checklistType, 
  journalEntries = [],
  miniTaskStatus 
}: CalendarViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Estado local para mantener los cambios de estado antes de que se recarguen los datos
  const [localDayStatuses, setLocalDayStatuses] = useState<Map<string, string>>(new Map());
  
  const createJournalEntry = useCreateMiniTaskJournalEntry();
  const updateJournalEntry = useUpdateMiniTaskJournalEntry();
  const deleteJournalEntry = useDeleteMiniTaskJournalEntry();
  const updateMiniTask = useUpdateMiniTask();

  // Crear un mapa de fechas con entradas del journal
  const entriesByDate = useMemo(() => {
    const map = new Map<string, MiniTaskJournalEntry>();
    journalEntries.forEach(entry => {
      const dateKey = format(new Date(entry.entryDate), 'yyyy-MM-dd');
      map.set(dateKey, entry);
    });
    return map;
  }, [journalEntries]);

  // Determinar qué días deberían estar marcados según la frecuencia
  const getDaysToMark = () => {
    const days: Date[] = [];
    const currentDate = new Date(monthStart);
    
    while (currentDate <= monthEnd) {
      if (frequency === 'diaria' || frequency === 'daily') {
        days.push(new Date(currentDate));
      } else if (frequency === 'semanal' || frequency === 'weekly') {
        // Cada lunes (día 1)
        if (getDay(currentDate) === 1) {
          days.push(new Date(currentDate));
        }
      } else if (frequency === 'mensual' || frequency === 'monthly') {
        // Primer día del mes
        if (currentDate.getDate() === 1) {
          days.push(new Date(currentDate));
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const expectedDays = getDaysToMark();

  const getDayStatus = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    
    // Verificar si hay un estado local (cambio pendiente)
    const localStatus = localDayStatuses.get(dateKey);
    if (localStatus) {
      return localStatus;
    }
    
    const entry = entriesByDate.get(dateKey);
    const hasEntry = !!entry;
    const isExpected = expectedDays.some(d => isSameDay(d, day));
    const isTodayDate = isToday(day);
    const checklistCompleted = entry?.checklistCompleted ?? false;
    
    // Detectar si hay progreso parcial (timeSpent o progressValue)
    const hasProgress = hasEntry && (
      (entry.timeSpent && entry.timeSpent > 0) || 
      (entry.progressValue !== null && entry.progressValue !== undefined && entry.progressValue > 0)
    );

    // Si el checklist está habilitado, priorizar el estado del checklist
    if (checklistEnabled) {
      if (hasEntry && checklistCompleted && isExpected) {
        return 'completed'; // Verde: checklist completado
      } else if (hasEntry && hasProgress && !checklistCompleted && isExpected) {
        return 'in-progress'; // Naranja: entrada con progreso pero sin completar checklist
      } else if (hasEntry && !checklistCompleted && isExpected) {
        return 'partial'; // Amarillo: entrada pero sin checklist ni progreso
      } else if (isExpected && !hasEntry && day <= today) {
        return 'missed'; // Rojo: día esperado sin entrada ni checklist
      } else if (isExpected && !hasEntry) {
        return 'pending'; // Gris: día esperado futuro
      }
    } else {
      // Lógica sin checklist: verificar progreso parcial
      if (hasEntry && isExpected) {
        // Si hay progreso pero no está completo (basado en timeSpent o progressValue)
        if (hasProgress) {
          // Considerar completo si hay suficiente progreso o si no hay objetivo definido
          return 'completed'; // Verde: día esperado con entrada y progreso
        }
        return 'completed'; // Verde: día esperado con entrada
      } else if (hasEntry && !isExpected && hasProgress) {
        return 'in-progress'; // Naranja: entrada adicional con progreso
      } else if (hasEntry && !isExpected) {
        return 'extra'; // Azul: entrada adicional sin progreso
      } else if (isExpected && !hasEntry && day <= today) {
        return 'missed'; // Rojo: día esperado sin entrada
      } else if (isExpected && !hasEntry) {
        return 'pending'; // Amarillo: día esperado futuro
      }
    }
    return 'normal';
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDay) return;

    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const existingEntry = entriesByDate.get(dateKey);

    // Actualizar el estado local inmediatamente para cambiar el color
    setLocalDayStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(dateKey, newStatus);
      return newMap;
    });

    try {
      if (newStatus === 'completed') {
        // Completar: crear o actualizar entrada con checklistCompleted=true o progressValue
        const entryData = {
          entryDate: selectedDay,
          checklistCompleted: checklistEnabled ? true : undefined,
          progressValue: checklistEnabled ? undefined : 100,
          progressUnit: checklistEnabled ? undefined : '%',
        };

        if (existingEntry) {
          await updateJournalEntry.mutateAsync({
            miniTaskId,
            entryId: existingEntry.id,
            data: entryData,
          });
        } else {
          await createJournalEntry.mutateAsync({
            miniTaskId,
            data: entryData,
          });
        }

        // Actualizar estado de la minitask a COMPLETED si está en PENDING o IN_PROGRESS
        if (miniTaskStatus && (miniTaskStatus === 'PENDING' || miniTaskStatus === 'IN_PROGRESS')) {
          await updateMiniTask.mutateAsync({
            id: miniTaskId,
            data: { status: 'COMPLETED' },
          });
        }
      } else if (newStatus === 'in-progress') {
        // En progreso: crear o actualizar entrada con progreso parcial
        const entryData = {
          entryDate: selectedDay,
          progressValue: 50,
          progressUnit: '%',
          checklistCompleted: false,
        };

        if (existingEntry) {
          await updateJournalEntry.mutateAsync({
            miniTaskId,
            entryId: existingEntry.id,
            data: entryData,
          });
        } else {
          await createJournalEntry.mutateAsync({
            miniTaskId,
            data: entryData,
          });
        }

        // Actualizar estado de la minitask a IN_PROGRESS si está en PENDING
        if (miniTaskStatus === 'PENDING') {
          await updateMiniTask.mutateAsync({
            id: miniTaskId,
            data: { status: 'IN_PROGRESS' },
          });
        }
      } else if (newStatus === 'partial') {
        // Parcial: crear entrada sin checklist ni progreso
        const entryData = {
          entryDate: selectedDay,
          checklistCompleted: false,
        };

        if (existingEntry) {
          await updateJournalEntry.mutateAsync({
            miniTaskId,
            entryId: existingEntry.id,
            data: entryData,
          });
        } else {
          await createJournalEntry.mutateAsync({
            miniTaskId,
            data: entryData,
          });
        }
      } else if (newStatus === 'missed' || newStatus === 'pending') {
        // Faltante o Pendiente: eliminar entrada si existe
        if (existingEntry) {
          await deleteJournalEntry.mutateAsync({
            miniTaskId,
            entryId: existingEntry.id,
          });
        }
      } else if (newStatus === 'extra') {
        // Extra: crear entrada para día no esperado
        const entryData = {
          entryDate: selectedDay,
          progressValue: 100,
          progressUnit: '%',
        };

        if (existingEntry) {
          await updateJournalEntry.mutateAsync({
            miniTaskId,
            entryId: existingEntry.id,
            data: entryData,
          });
        } else {
          await createJournalEntry.mutateAsync({
            miniTaskId,
            data: entryData,
          });
        }
      }

      setIsDialogOpen(false);
      setSelectedDay(null);
      
      // Limpiar el estado local después de un breve delay para permitir que se recarguen los datos
      setTimeout(() => {
        setLocalDayStatuses(prev => {
          const newMap = new Map(prev);
          newMap.delete(dateKey);
          return newMap;
        });
      }, 1000);
    } catch (error) {
      console.error('Error al cambiar estado del día:', error);
      // Revertir el estado local en caso de error
      setLocalDayStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(dateKey);
        return newMap;
      });
    }
  };

  const statusOptions = [
    { value: 'completed', label: 'Completado', icon: CheckCircle2, color: 'bg-green-500' },
    { value: 'in-progress', label: 'En Progreso', icon: ClockIcon, color: 'bg-orange-500' },
    { value: 'partial', label: 'Parcial', icon: AlertCircle, color: 'bg-yellow-300' },
    { value: 'missed', label: 'Faltante', icon: XCircle, color: 'bg-red-500' },
    { value: 'pending', label: 'Pendiente', icon: Circle, color: 'bg-yellow-500' },
    { value: 'extra', label: 'Extra', icon: Circle, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">Calendario de Seguimiento</h3>
      </div>

      <div className="border rounded-lg p-3 sm:p-4 bg-card">
        {/* Información de configuración */}
        <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">Frecuencia:</span>
            <span className="font-medium capitalize">
              {frequency === 'diaria' || frequency === 'daily' ? 'Diaria' :
               frequency === 'semanal' || frequency === 'weekly' ? 'Semanal' :
               frequency === 'mensual' || frequency === 'monthly' ? 'Mensual' :
               frequency}
            </span>
          </div>
          {(alarmTimes && alarmTimes.length > 0) || alarmTime ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Alarmas:</span>
              <span className="font-medium break-words">
                {(alarmTimes && alarmTimes.length > 0) ? alarmTimes.join(', ') : alarmTime}
              </span>
            </div>
          ) : null}
          {checklistEnabled && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Checklist:</span>
              <span className="font-medium text-green-600">
                {checklistType === 'multi-item' 
                  ? 'Multi-elementos' 
                  : checklistType === 'single' 
                  ? 'Evento único' 
                  : 'Diario'}
              </span>
            </div>
          )}
        </div>

        {/* Calendario */}
        <div className="space-y-2">
          {/* Encabezado con mes y año */}
          <div className="text-center text-sm sm:text-base font-semibold mb-2 sm:mb-3">
            {format(today, 'MMMM yyyy', { locale: es })}
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-0.5 sm:py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {/* Espacios vacíos al inicio */}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Días del mes */}
            {daysInMonth.map(day => {
              const status = getDayStatus(day);
              const dateKey = format(day, 'yyyy-MM-dd');
              const entry = entriesByDate.get(dateKey);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateKey}
                  onClick={() => handleDayClick(day)}
                  className={`
                    aspect-square rounded sm:rounded-md flex flex-col items-center justify-center text-[10px] sm:text-xs
                    transition-colors cursor-pointer hover:opacity-80 hover:scale-105
                    ${status === 'completed' ? 'bg-green-500 text-white' :
                      status === 'in-progress' ? 'bg-orange-500 text-white' :
                      status === 'missed' ? 'bg-red-500 text-white' :
                      status === 'pending' ? 'bg-yellow-500 text-white' :
                      status === 'partial' ? 'bg-yellow-300 text-yellow-900' :
                      status === 'extra' ? 'bg-blue-500 text-white' :
                      isTodayDate ? 'bg-primary/10 border border-primary sm:border-2' :
                      'bg-muted hover:bg-muted/80'}
                  `}
                  title={
                    entry
                      ? checklistEnabled
                        ? `Checklist: ${entry.checklistCompleted ? 'Completado' : 'Pendiente'}${entry.progressValue !== null ? ` | Progreso: ${entry.progressValue} ${entry.progressUnit || ''}` : ''} - Click para cambiar`
                        : `Entrada: ${entry.progressValue || 0} ${entry.progressUnit || ''} - Click para cambiar`
                      : `${format(day, 'dd/MM/yyyy')} - Click para cambiar estado`
                  }
                >
                  <span className="font-medium">{format(day, 'd')}</span>
                  {checklistEnabled && entry && (
                    <span className="text-[8px] sm:text-[10px]">
                      {entry.checklistCompleted ? '✓' : '○'}
                    </span>
                  )}
                  {!checklistEnabled && entry && entry.progressValue !== null && (
                    <span className="text-[8px] sm:text-[10px] opacity-90">
                      {entry.progressValue}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs">
          {checklistEnabled ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Checklist Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span>En Proceso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-300" />
                <span>Entrada sin Checklist</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Faltante</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span>En Proceso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Faltante</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>Extra</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Diálogo para cambiar estado del día */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cambiar Estado - {selectedDay ? format(selectedDay, 'dd/MM/yyyy') : ''}
            </DialogTitle>
            <DialogDescription>
              Selecciona el nuevo estado para este día
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const currentStatus = selectedDay ? getDayStatus(selectedDay) : 'normal';
              const isSelected = currentStatus === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(option.value)}
                  className={`flex items-center gap-2 justify-start ${option.color} ${isSelected ? 'opacity-100' : 'opacity-70'}`}
                  disabled={createJournalEntry.isPending || updateJournalEntry.isPending || deleteJournalEntry.isPending}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

