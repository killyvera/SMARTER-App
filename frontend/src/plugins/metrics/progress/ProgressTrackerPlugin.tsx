'use client';

import { TrendingUp } from 'lucide-react';
import type { BasePlugin, PluginConfig, MetricData } from '../base/BasePlugin';
import type { PluginType, ProgressTrackerPluginConfig } from '@smarter-app/shared';
import { ProgressTrackerPluginConfigSchema } from '@smarter-app/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export class ProgressTrackerPlugin implements BasePlugin {
  id: PluginType = 'progress-tracker';
  name = 'Seguimiento de Progreso';
  description = 'Rastrea el progreso numérico de la minitask con métricas específicas';
  icon = <TrendingUp className="h-4 w-4" />;

  validateConfig(config: Record<string, any>): boolean {
    try {
      ProgressTrackerPluginConfigSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  renderComponent(
    config: PluginConfig,
    onConfigChange: (config: PluginConfig) => void
  ): React.ReactNode {
    const progConfig = config as ProgressTrackerPluginConfig;

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Configuración de Progreso</h3>
        </div>

        <div className="space-y-2">
          <Label>Valor Objetivo</Label>
          <Input
            type="number"
            value={progConfig.targetValue || ''}
            onChange={(e) =>
              onConfigChange({
                ...config,
                targetValue: parseFloat(e.target.value) || undefined,
              })
            }
            placeholder="100"
          />
        </div>

        <div className="space-y-2">
          <Label>Unidad de Medida</Label>
          <Input
            value={progConfig.unit || ''}
            onChange={(e) =>
              onConfigChange({ ...config, unit: e.target.value })
            }
            placeholder="horas, páginas, items, etc."
          />
        </div>

        <div className="space-y-2">
          <Label>Incremento</Label>
          <Input
            type="number"
            value={progConfig.increment || 1}
            onChange={(e) =>
              onConfigChange({
                ...config,
                increment: parseFloat(e.target.value) || 1,
              })
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={progConfig.showChart ?? true}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, showChart: checked })
            }
          />
          <Label>Mostrar gráfica</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={progConfig.enabled ?? true}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, enabled: checked })
            }
          />
          <Label>Activar seguimiento</Label>
        </div>
      </div>
    );
  }

  async trackMetric(data: MetricData, config: PluginConfig): Promise<void> {
    console.log('Progress tracker metric tracked:', data, config);
  }

  async getMetrics(
    config: PluginConfig,
    timeRange?: { start: Date; end: Date }
  ): Promise<MetricData[]> {
    return [];
  }

  async initialize(config: PluginConfig): Promise<void> {
    console.log('Progress tracker plugin initialized:', config);
  }

  async cleanup(config: PluginConfig): Promise<void> {
    console.log('Progress tracker plugin cleaned up:', config);
  }
}

