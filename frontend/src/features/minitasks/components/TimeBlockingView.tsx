'use client';

import { useMemo } from 'react';
import { Clock, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';

interface TimeBlockingViewProps {
  plannedHours?: number | null;
  journalEntries?: MiniTaskJournalEntry[];
}

export function TimeBlockingView({ plannedHours, journalEntries = [] }: TimeBlockingViewProps) {
  // Calcular horas totales dedicadas (timeSpent está en minutos)
  const totalHoursSpent = useMemo(() => {
    const totalMinutes = journalEntries.reduce((sum, entry) => {
      return sum + (entry.timeSpent || 0);
    }, 0);
    return totalMinutes / 60; // Convertir minutos a horas
  }, [journalEntries]);

  // Calcular porcentaje de cumplimiento
  const completionPercentage = useMemo(() => {
    if (!plannedHours || plannedHours === 0) return 0;
    return Math.min((totalHoursSpent / plannedHours) * 100, 100);
  }, [totalHoursSpent, plannedHours]);

  // Determinar estado
  const status = useMemo(() => {
    if (!plannedHours) return 'no-plan';
    if (totalHoursSpent >= plannedHours) return 'completed';
    if (totalHoursSpent >= plannedHours * 0.8) return 'almost';
    if (totalHoursSpent >= plannedHours * 0.5) return 'halfway';
    return 'pending';
  }, [totalHoursSpent, plannedHours]);

  if (!plannedHours) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Seguimiento de Tiempo</h3>
        </div>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Horas registradas:</span>
                <span className="font-semibold text-primary">
                  {totalHoursSpent.toFixed(2)} horas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Entradas:</span>
                <span className="font-medium">{journalEntries.length}</span>
              </div>
              {journalEntries.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    💡 Registra tu tiempo en las entradas del journal. Las horas se sumarán automáticamente.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingHours = Math.max(0, plannedHours - totalHoursSpent);
  const isOverTime = totalHoursSpent > plannedHours;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <h3 className="text-base sm:text-lg font-semibold">Seguimiento por Horas</h3>
      </div>

      <Card>
        <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
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
                status === 'completed' ? 'text-green-600' : 
                status === 'almost' ? 'text-yellow-600' : 
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
            {isOverTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Excedente:</span>
                <span className="font-medium text-green-600">
                  +{(totalHoursSpent - plannedHours).toFixed(2)} horas
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
                  status === 'completed' || isOverTime
                    ? 'bg-green-500'
                    : status === 'almost'
                    ? 'bg-yellow-500'
                    : status === 'halfway'
                    ? 'bg-orange-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(completionPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Entradas registradas</p>
              <p className="text-base sm:text-lg font-semibold">{journalEntries.length}</p>
            </div>
            {journalEntries.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Promedio por entrada</p>
                <p className="text-base sm:text-lg font-semibold">
                  {(totalHoursSpent / journalEntries.length).toFixed(2)} horas
                </p>
              </div>
            )}
          </div>

          {/* Mensaje de estado */}
          {status === 'completed' && !isOverTime && (
            <div className="p-2 sm:p-3 bg-green-100 border border-green-300 rounded-lg text-green-900 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">¡Objetivo cumplido!</span>
              </div>
            </div>
          )}
          {isOverTime && (
            <div className="p-2 sm:p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-900 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Has superado el objetivo planificado</span>
              </div>
            </div>
          )}
          {status === 'almost' && (
            <div className="p-2 sm:p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-900 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Casi alcanzas el objetivo</span>
              </div>
            </div>
          )}
          {status === 'pending' && journalEntries.length === 0 && (
            <div className="p-2 sm:p-3 bg-muted border rounded-lg text-xs sm:text-sm">
              <p className="text-muted-foreground">
                Comienza a registrar tu tiempo en las entradas del journal para ver tu progreso.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

