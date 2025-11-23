'use client';

import { useMemo } from 'react';
import { TrendingUp, Target } from 'lucide-react';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';

interface ProgressTrackerViewProps {
  targetValue?: number;
  unit?: string;
  journalEntries?: MiniTaskJournalEntry[];
  metricsConfig?: {
    metrics?: Array<{
      type: string;
      target?: number;
      unit?: string;
    }>;
  };
}

export function ProgressTrackerView({ 
  targetValue, 
  unit = '', 
  journalEntries = [],
  metricsConfig
}: ProgressTrackerViewProps) {
  // Intentar obtener el objetivo de las métricas si no está en el plugin config
  const finalTargetValue = useMemo(() => {
    if (targetValue) return targetValue;
    
    // Buscar en las métricas generadas por la IA
    if (metricsConfig?.metrics && metricsConfig.metrics.length > 0) {
      const progressMetric = metricsConfig.metrics.find(m => 
        m.type === 'progreso' || m.type === 'progress' || m.type === 'completitud'
      );
      if (progressMetric?.target) {
        return progressMetric.target;
      }
      // Si no hay métrica de progreso, usar la primera que tenga target
      const metricWithTarget = metricsConfig.metrics.find(m => m.target);
      if (metricWithTarget?.target) {
        return metricWithTarget.target;
      }
    }
    
    return undefined;
  }, [targetValue, metricsConfig]);

  // Intentar obtener la unidad de las métricas si no está en el plugin config
  const finalUnit = useMemo(() => {
    if (unit) return unit;
    
    if (metricsConfig?.metrics && metricsConfig.metrics.length > 0) {
      const progressMetric = metricsConfig.metrics.find(m => 
        m.type === 'progreso' || m.type === 'progress' || m.type === 'completitud'
      );
      if (progressMetric?.unit) {
        return progressMetric.unit;
      }
      const metricWithUnit = metricsConfig.metrics.find(m => m.unit);
      if (metricWithUnit?.unit) {
        return metricWithUnit.unit;
      }
    }
    
    return '';
  }, [unit, metricsConfig]);
  // Calcular progreso total desde las entradas del journal
  const currentProgress = useMemo(() => {
    return journalEntries.reduce((sum, entry) => {
      return sum + (entry.progressValue || 0);
    }, 0);
  }, [journalEntries]);

  // Calcular porcentaje de progreso
  const progressPercentage = useMemo(() => {
    if (!finalTargetValue || finalTargetValue === 0) return 0;
    return Math.min((currentProgress / finalTargetValue) * 100, 100);
  }, [currentProgress, finalTargetValue]);

  // Calcular promedio diario
  const averageDaily = useMemo(() => {
    if (journalEntries.length === 0) return 0;
    return currentProgress / journalEntries.length;
  }, [currentProgress, journalEntries.length]);

  // Calcular días restantes estimados (si hay progreso)
  const estimatedDaysRemaining = useMemo(() => {
    if (!finalTargetValue || averageDaily === 0) return null;
    const remaining = finalTargetValue - currentProgress;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / averageDaily);
  }, [finalTargetValue, currentProgress, averageDaily]);

  if (!finalTargetValue) {
    // Mostrar información útil incluso sin objetivo
    const hasEntries = journalEntries.length > 0;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Seguimiento de Progreso</h3>
        </div>
        <div className="border rounded-lg p-4 bg-card space-y-3">
          {hasEntries ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progreso registrado:</span>
                  <span className="font-semibold text-primary">
                    {currentProgress.toFixed(1)} {finalUnit || 'unidades'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entradas:</span>
                  <span className="font-medium">{journalEntries.length}</span>
                </div>
                {averageDaily > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Promedio diario:</span>
                    <span className="font-medium">
                      {averageDaily.toFixed(1)} {finalUnit || 'unidades'}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Configura un objetivo en la configuración del plugin para ver tu progreso visualmente y calcular días estimados restantes.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                El plugin de seguimiento de progreso está activo. Comienza a registrar tu progreso en el journal para ver estadísticas aquí.
              </p>
              {finalUnit && (
                <p className="text-xs text-muted-foreground">
                  Unidad configurada: <span className="font-medium">{finalUnit}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Seguimiento de Progreso</h3>
      </div>

      <div className="border rounded-lg p-4 bg-card space-y-4">
        {/* Objetivo y progreso actual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Objetivo:</span>
            </div>
            <span className="font-semibold">{finalTargetValue} {finalUnit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progreso actual:</span>
            <span className="font-semibold text-primary">
              {currentProgress.toFixed(1)} {finalUnit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Restante:</span>
            <span className="font-medium">
              {Math.max(0, (finalTargetValue - currentProgress).toFixed(1))} {finalUnit}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progressPercentage === 100
                  ? 'bg-green-500'
                  : progressPercentage >= 75
                  ? 'bg-primary'
                  : progressPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Entradas registradas</p>
            <p className="text-lg font-semibold">{journalEntries.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Promedio diario</p>
            <p className="text-lg font-semibold">
              {averageDaily.toFixed(1)} {finalUnit}
            </p>
          </div>
          {estimatedDaysRemaining !== null && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">
                {estimatedDaysRemaining === 0 
                  ? '¡Objetivo alcanzado! 🎉' 
                  : `Días estimados restantes: ${estimatedDaysRemaining}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

