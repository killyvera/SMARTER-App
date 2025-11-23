'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, Calendar } from 'lucide-react';
import { useJournalMetrics } from '../hooks/useMiniTaskJournal';
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface JournalMetricsProps {
  miniTaskId: string;
  dateRange?: { from: Date; to: Date };
}

export function JournalMetrics({ miniTaskId, dateRange }: JournalMetricsProps) {
  const { data: metrics, isLoading } = useJournalMetrics(miniTaskId, dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando métricas...
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const chartData = metrics.progressByDate.map(item => ({
    fecha: format(new Date(item.date), 'dd MMM', { locale: es }),
    valor: item.value,
    fechaCompleta: item.date,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas del Journal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Entradas</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalEntries}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Días Activos</span>
              </div>
              <p className="text-2xl font-bold">{metrics.daysWithEntries}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Progreso Promedio</span>
              </div>
              <p className="text-2xl font-bold">{metrics.avgProgress.toFixed(1)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tiempo Total</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(metrics.totalTimeSpent / 60)}h</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Progreso Diario</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Progreso"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aún no hay datos de progreso para graficar.</p>
              <p className="text-xs mt-1">Registra entradas en el journal para ver las métricas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

