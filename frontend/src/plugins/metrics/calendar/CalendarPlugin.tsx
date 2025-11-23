'use client';

import { Calendar, Clock } from 'lucide-react';
import type { BasePlugin, PluginConfig, MetricData } from '../base/BasePlugin';
import type { PluginType, CalendarPluginConfig } from '@smarter-app/shared';
import { CalendarPluginConfigSchema } from '@smarter-app/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
// Select component will be added later

export class CalendarPlugin implements BasePlugin {
  id: PluginType = 'calendar';
  name = 'Calendario con Alarmas';
  description = 'Programa recordatorios y alarmas para la minitask en fechas específicas';
  icon = <Calendar className="h-4 w-4" />;

  validateConfig(config: Record<string, any>): boolean {
    try {
      CalendarPluginConfigSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  renderComponent(
    config: PluginConfig,
    onConfigChange: (config: PluginConfig) => void
  ): React.ReactNode {
    const calConfig = config as CalendarPluginConfig;

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="font-semibold">Configuración de Calendario</h3>
        </div>

        <div className="space-y-2">
          <Label>Frecuencia de Seguimiento</Label>
          <select
            value={calConfig.frequency || 'daily'}
            onChange={(e) =>
              onConfigChange({ ...config, frequency: e.target.value })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {calConfig.frequency === 'custom' && (
          <div className="space-y-2">
            <Label>Frecuencia Personalizada</Label>
            <Input
              value={calConfig.customFrequency || ''}
              onChange={(e) =>
                onConfigChange({ ...config, customFrequency: e.target.value })
              }
              placeholder="Ej: Cada 3 días"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Hora de Alarma</Label>
          <Input
            type="time"
            value={calConfig.alarmTime || '09:00'}
            onChange={(e) =>
              onConfigChange({ ...config, alarmTime: e.target.value })
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={calConfig.enabled ?? true}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, enabled: checked })
            }
          />
          <Label>Activar alarmas</Label>
        </div>
      </div>
    );
  }

  async trackMetric(data: MetricData, config: PluginConfig): Promise<void> {
    // Implementar registro de métricas de calendario
    console.log('Calendar metric tracked:', data, config);
  }

  async getMetrics(
    config: PluginConfig,
    timeRange?: { start: Date; end: Date }
  ): Promise<MetricData[]> {
    // Implementar obtención de métricas
    return [];
  }

  async initialize(config: PluginConfig): Promise<void> {
    // Configurar alarmas/recordatorios
    console.log('Calendar plugin initialized:', config);
  }

  async cleanup(config: PluginConfig): Promise<void> {
    // Limpiar alarmas/recordatorios
    console.log('Calendar plugin cleaned up:', config);
  }
}

