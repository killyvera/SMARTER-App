'use client';

import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';

interface CalendarViewProps {
  frequency?: string;
  alarmTime?: string;
  alarmTimes?: string[];
  checklistEnabled?: boolean;
  checklistType?: 'single' | 'daily' | 'multi-item';
  journalEntries?: MiniTaskJournalEntry[];
}

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function CalendarView({ frequency = 'diaria', alarmTime, alarmTimes, checklistEnabled, checklistType, journalEntries = [] }: CalendarViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

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
    const entry = entriesByDate.get(dateKey);
    const hasEntry = !!entry;
    const isExpected = expectedDays.some(d => isSameDay(d, day));
    const isTodayDate = isToday(day);
    const checklistCompleted = entry?.checklistCompleted ?? false;
    
    // Detectar si hay progreso parcial (timeSpent o progressValue)
    const hasProgress = hasEntry && (
      (entry.timeSpent && entry.timeSpent > 0) || 
      (entry.progressValue !== null && entry.progressValue > 0)
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
                  className={`
                    aspect-square rounded sm:rounded-md flex flex-col items-center justify-center text-[10px] sm:text-xs
                    transition-colors cursor-pointer hover:opacity-80
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
                        ? `Checklist: ${entry.checklistCompleted ? 'Completado' : 'Pendiente'}${entry.progressValue !== null ? ` | Progreso: ${entry.progressValue} ${entry.progressUnit || ''}` : ''}`
                        : `Entrada: ${entry.progressValue || 0} ${entry.progressUnit || ''}`
                      : format(day, 'dd/MM/yyyy')
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
    </div>
  );
}

