'use client';

import { BarChart3 } from 'lucide-react';
import type { BasePlugin, PluginConfig, MetricData } from '../base/BasePlugin';
import type { PluginType, ChartPluginConfig } from '@smarter-app/shared';
import { ChartPluginConfigSchema } from '@smarter-app/shared';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export class ChartPlugin implements BasePlugin {
  id: PluginType = 'chart';
  name = 'Gráficas de Progreso';
  description = 'Genera visualizaciones gráficas del progreso de la minitask';
  icon = <BarChart3 className="h-4 w-4" />;

  validateConfig(config: Record<string, any>): boolean {
    try {
      ChartPluginConfigSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  renderComponent(
    config: PluginConfig,
    onConfigChange: (config: PluginConfig) => void
  ): React.ReactNode {
    const chartConfig = config as ChartPluginConfig;

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h3 className="font-semibold">Configuración de Gráficas</h3>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Gráfica</Label>
          <select
            value={chartConfig.chartType || 'bar'}
            onChange={(e) =>
              onConfigChange({ ...config, chartType: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="bar">Barras</option>
            <option value="line">Líneas</option>
            <option value="pie">Circular</option>
            <option value="area">Área</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Métrica</Label>
          <input
            type="text"
            value={chartConfig.metricType || ''}
            onChange={(e) =>
              onConfigChange({ ...config, metricType: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="progreso, completitud, tiempo, etc."
          />
        </div>

        <div className="space-y-2">
          <Label>Rango de Tiempo</Label>
          <select
            value={chartConfig.timeRange || 'week'}
            onChange={(e) =>
              onConfigChange({ ...config, timeRange: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="all">Todo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={chartConfig.enabled ?? true}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, enabled: checked })
            }
          />
          <Label>Activar gráficas</Label>
        </div>
      </div>
    );
  }

  async trackMetric(data: MetricData, config: PluginConfig): Promise<void> {
    console.log('Chart metric tracked:', data, config);
  }

  async getMetrics(
    config: PluginConfig,
    timeRange?: { start: Date; end: Date }
  ): Promise<MetricData[]> {
    return [];
  }

  async initialize(config: PluginConfig): Promise<void> {
    console.log('Chart plugin initialized:', config);
  }

  async cleanup(config: PluginConfig): Promise<void> {
    console.log('Chart plugin cleaned up:', config);
  }
}

