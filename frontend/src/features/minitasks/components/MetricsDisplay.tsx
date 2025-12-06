'use client';

import { useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, TrendingUp, Bell, ListChecks, Timer, Smartphone, BellRing, Clock } from 'lucide-react';
import { BarChart, LineChart, PieChart, AreaChart, Bar, Line, Pie, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { MiniTaskResponse } from '@smarter-app/shared';
import { CalendarView } from './CalendarView';
import { ProgressTrackerView } from './ProgressTrackerView';
import { ChecklistView } from './ChecklistView';
import { TimeBlockingView } from './TimeBlockingView';
import { useMiniTaskJournal } from '../hooks/useMiniTaskJournal';
import { startOfMonth, endOfMonth } from 'date-fns';
import { PluginSection } from '@/components/plugins/PluginSection';

// Mapeo de IDs de plugins a nombres y iconos amigables
const pluginInfo: Record<string, { name: string; icon: typeof Calendar; description: string }> = {
  'calendar': {
    name: 'Calendario',
    icon: Calendar,
    description: 'Recordatorios y seguimiento temporal',
  },
  'reminder': {
    name: 'Recordatorio',
    icon: Bell,
    description: 'Alertas en momentos específicos',
  },
  'progress-tracker': {
    name: 'Seguimiento de Progreso',
    icon: TrendingUp,
    description: 'Medición de avance numérico',
  },
  'checklist': {
    name: 'Lista de Verificación',
    icon: ListChecks,
    description: 'Pasos y tareas específicas',
  },
  'timer': {
    name: 'Temporizador',
    icon: Timer,
    description: 'Control de duración',
  },
  'notification': {
    name: 'Notificaciones',
    icon: BellRing,
    description: 'Alertas del navegador',
  },
  'mobile-push': {
    name: 'Notificaciones Móviles',
    icon: Smartphone,
    description: 'Alertas en dispositivo móvil',
  },
  'chart': {
    name: 'Gráficas',
    icon: BarChart3,
    description: 'Visualización de progreso',
  },
};

interface MetricsDisplayProps {
  miniTask: MiniTaskResponse & { 
    unlocked?: boolean;
    metricsConfig?: string | null | {
      unlocked?: boolean;
      unlockedAt?: string;
      plugins?: Array<{
        id: string;
        config: any;
        enabled: boolean;
      }>;
      metrics?: Array<{
        type: string;
        target?: number;
        unit?: string;
      }>;
    };
    plugins?: Array<{
      id: string; // ID de Prisma
      pluginId: string; // Tipo de plugin (calendar, chart, etc.)
      config: any;
      enabled: boolean;
    }>;
    metrics?: Array<{
      id: string;
      pluginId: string;
      metricType: string;
      value: string;
      recordedAt: Date;
    }>;
  };
}

export function MetricsDisplay({ miniTask }: MetricsDisplayProps) {
  // Obtener entradas del journal para el mes actual - usar ref para mantener fechas estables
  const dateRangeRef = useRef<{ dateFrom: Date; dateTo: Date }>();
  if (!dateRangeRef.current) {
    const today = new Date();
    dateRangeRef.current = {
      dateFrom: startOfMonth(today),
      dateTo: endOfMonth(today),
    };
  }
  
  const { data: journalEntries } = useMiniTaskJournal(miniTask.id, dateRangeRef.current);

  // Preparar datos para la gráfica
  const chartData = useMemo(() => {
    if (!miniTask.unlocked || !miniTask.metrics || miniTask.metrics.length === 0) {
      return [];
    }

    return miniTask.metrics.map(m => {
      try {
        const value = typeof m.value === 'string' ? JSON.parse(m.value) : m.value;
        const date = new Date(m.recordedAt);
        return {
          fecha: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          valor: typeof value === 'number' ? value : 0,
          fechaCompleta: date,
        };
      } catch {
        return {
          fecha: new Date(m.recordedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          valor: 0,
          fechaCompleta: new Date(m.recordedAt),
        };
      }
    }).reverse(); // Ordenar cronológicamente
  }, [miniTask.metrics, miniTask.unlocked]);

  if (!miniTask.unlocked) {
    return null;
  }

  const activePlugins = miniTask.plugins?.filter(p => p.enabled) || [];
  const calendarPlugin = activePlugins.find(p => p.pluginId === 'calendar');
  const chartPlugin = activePlugins.find(p => p.pluginId === 'chart');
  const progressPlugin = activePlugins.find(p => p.pluginId === 'progress-tracker');
  
  // Detectar si tiene horas planificadas (de la mini-task o del plugin calendar)
  const plannedHours = miniTask.plannedHours || calendarPlugin?.config?.plannedHours;
  const isSingleDayTask = miniTask.isSingleDayTask ?? false;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Seguimiento y Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seguimiento por horas si tiene horas planificadas */}
          {(plannedHours || isSingleDayTask) && (
            <PluginSection
              miniTaskId={miniTask.id}
              pluginId="time-blocking"
              title="Seguimiento por Horas"
              icon={<Clock className="h-5 w-5 text-primary" />}
            >
              <TimeBlockingView
                plannedHours={plannedHours}
                journalEntries={journalEntries || []}
              />
            </PluginSection>
          )}

          {/* Checklist si está habilitado */}
          {calendarPlugin && calendarPlugin.config?.checklistEnabled && (
            <PluginSection
              miniTaskId={miniTask.id}
              pluginId="checklist"
              title={
                calendarPlugin.config?.checklistType === 'multi-item' 
                  ? 'Checklist de Elementos'
                  : calendarPlugin.config?.checklistType === 'single'
                  ? 'Checklist'
                  : 'Checklist Diario'
              }
              icon={<ListChecks className="h-5 w-5 text-primary" />}
            >
              <ChecklistView
                miniTaskId={miniTask.id}
                checklistLabel={calendarPlugin.config?.checklistLabel}
                checklistType={calendarPlugin.config?.checklistType || 'daily'}
                checklistItems={calendarPlugin.config?.checklistItems || []}
                journalEntries={journalEntries || []}
              />
            </PluginSection>
          )}

          {/* Calendario visual */}
          {calendarPlugin && (
            <PluginSection
              miniTaskId={miniTask.id}
              pluginId="calendar"
              title="Calendario"
              icon={<Calendar className="h-5 w-5 text-primary" />}
            >
              <CalendarView
                frequency={calendarPlugin.config?.frequency}
                alarmTime={calendarPlugin.config?.alarmTime}
                alarmTimes={calendarPlugin.config?.alarmTimes}
                checklistEnabled={calendarPlugin.config?.checklistEnabled}
                checklistType={calendarPlugin.config?.checklistType}
                journalEntries={journalEntries || []}
              />
            </PluginSection>
          )}

          {/* Seguimiento de progreso visual */}
          {progressPlugin && (
            <PluginSection
              miniTaskId={miniTask.id}
              pluginId="progress-tracker"
              title="Seguimiento de Progreso"
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            >
              <ProgressTrackerView
                targetValue={progressPlugin.config?.targetValue}
                unit={progressPlugin.config?.unit}
                journalEntries={journalEntries || []}
                metricsConfig={miniTask.metricsConfig ? (typeof miniTask.metricsConfig === 'string' ? JSON.parse(miniTask.metricsConfig) : miniTask.metricsConfig) : undefined}
              />
            </PluginSection>
          )}

          {/* Gráfica de progreso */}
          {chartPlugin && (
            <PluginSection
              miniTaskId={miniTask.id}
              pluginId="chart"
              title={`Gráfica de Progreso: ${chartPlugin.config?.metricType || 'Progreso'}`}
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
            >
              {chartData.length > 0 ? (
                <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                  <ResponsiveContainer width="100%" height={300}>
                    {chartPlugin.config?.chartType === 'line' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} name={chartPlugin.config?.metricType || 'Progreso'} />
                      </LineChart>
                    ) : chartPlugin.config?.chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="valor"
                          nameKey="fecha"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#fbbf24', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    ) : chartPlugin.config?.chartType === 'area' ? (
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name={chartPlugin.config?.metricType || 'Progreso'} />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="valor" fill="#3b82f6" name={chartPlugin.config?.metricType || 'Progreso'} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Aún no hay datos de seguimiento. Los datos aparecerán aquí cuando comiences a trabajar en la tarea.
                  </p>
                </div>
              )}
            </PluginSection>
          )}

          {/* Lista de plugins activos - OCULTO/COMENTADO */}
          {/* {activePlugins.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Plugins Activos:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePlugins.map((plugin) => {
                  const info = pluginInfo[plugin.pluginId];
                  if (!info) {
                    return (
                      <div
                        key={plugin.id}
                        className="p-3 border rounded-lg bg-muted/50"
                      >
                        <span className="text-sm font-medium">{plugin.pluginId}</span>
                      </div>
                    );
                  }
                  const Icon = info.icon;
                  return (
                    <div
                      key={plugin.id}
                      className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{info.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}

