'use client';

import { useMemo } from 'react';
import { Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MiniTaskResponse } from '@smarter-app/shared';

interface GoalTimeTrackingProps {
  plannedHours?: number | null;
  isSingleDayGoal?: boolean;
  miniTasks?: Array<MiniTaskResponse & { 
    journalEntries?: Array<{ timeSpent?: number | null }>;
  }>;
}

export function GoalTimeTracking({ plannedHours, isSingleDayGoal, miniTasks = [] }: GoalTimeTrackingProps) {
  // Calcular horas totales de todas las mini-tasks relacionadas
  const totalHoursSpent = useMemo(() => {
    let totalMinutes = 0;
    miniTasks.forEach(task => {
      if (task.journalEntries) {
        task.journalEntries.forEach(entry => {
          totalMinutes += entry.timeSpent || 0;
        });
      }
    });
    return totalMinutes / 60; // Convertir minutos a horas
  }, [miniTasks]);

  // Calcular porcentaje de cumplimiento
  const completionPercentage = useMemo(() => {
    if (!plannedHours || plannedHours === 0) return 0;
    return Math.min((totalHoursSpent / plannedHours) * 100, 100);
  }, [totalHoursSpent, plannedHours]);

  if (!isSingleDayGoal || !plannedHours) {
    return null; // Solo mostrar si es un goal de un solo día con horas planificadas
  }

  const remainingHours = Math.max(0, plannedHours - totalHoursSpent);
  const isOverTime = totalHoursSpent > plannedHours;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          Seguimiento de Horas del Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Objetivo y progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Horas planificadas:</span>
            </div>
            <span className="font-semibold">{plannedHours} horas</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Horas dedicadas:</span>
            <span className={`font-semibold ${
              isOverTime ? 'text-green-600' : 
              completionPercentage >= 100 ? 'text-green-600' : 
              completionPercentage >= 80 ? 'text-yellow-600' : 
              'text-primary'
            }`}>
              {totalHoursSpent.toFixed(2)} horas
            </span>
          </div>
          {!isOverTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Restante:</span>
              <span className="font-medium">
                {remainingHours.toFixed(2)} horas
              </span>
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cumplimiento</span>
            <span>{completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 sm:h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                completionPercentage >= 100 || isOverTime
                  ? 'bg-green-500'
                  : completionPercentage >= 80
                  ? 'bg-yellow-500'
                  : completionPercentage >= 50
                  ? 'bg-orange-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Las horas se calculan sumando el tiempo registrado en todas las mini-tasks relacionadas a este goal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

