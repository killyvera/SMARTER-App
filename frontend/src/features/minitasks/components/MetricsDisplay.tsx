'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, TrendingUp, Bell, ListChecks, Timer, Smartphone, BellRing } from 'lucide-react';
import { BarChart, LineChart, PieChart, AreaChart, Bar, Line, Pie, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { MiniTaskResponse } from '@smarter-app/shared';

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
          {/* Información de plugins activos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendarPlugin && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Calendario</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Frecuencia: {calendarPlugin.config?.frequency || 'diaria'}
                </p>
                {calendarPlugin.config?.alarmTime && (
                  <p className="text-sm text-muted-foreground">
                    Alarma: {calendarPlugin.config.alarmTime}
                  </p>
                )}
              </div>
            )}

            {progressPlugin && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Seguimiento de Progreso</span>
                </div>
                {progressPlugin.config?.targetValue && (
                  <p className="text-sm text-muted-foreground">
                    Objetivo: {progressPlugin.config.targetValue} {progressPlugin.config?.unit || ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Gráfica de progreso */}
          {chartPlugin && chartData.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Gráfica de Progreso: {chartPlugin.config?.metricType || 'Progreso'}</span>
              </div>
              <div className="border rounded-lg p-4 bg-white">
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
            </div>
          )}

          {chartPlugin && chartData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Aún no hay datos de seguimiento. Los datos aparecerán aquí cuando comiences a trabajar en la tarea.
              </p>
            </div>
          )}

          {/* Lista de plugins activos */}
          {activePlugins.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Plugins Activos:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePlugins.map((plugin) => {
                  // Usar pluginId (tipo de plugin) en lugar de id (ID de Prisma)
                  const info = pluginInfo[plugin.pluginId];
                  if (!info) {
                    // Si no hay info, mostrar el pluginId como fallback
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

