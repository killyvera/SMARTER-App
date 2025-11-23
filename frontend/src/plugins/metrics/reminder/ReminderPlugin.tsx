'use client';

import { Bell } from 'lucide-react';
import type { BasePlugin, PluginConfig, MetricData } from '../base/BasePlugin';
import type { PluginType, ReminderPluginConfig } from '@smarter-app/shared';
import { ReminderPluginConfigSchema } from '@smarter-app/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export class ReminderPlugin implements BasePlugin {
  id: PluginType = 'reminder';
  name = 'Recordatorios';
  description = 'Configura recordatorios personalizados para la minitask';
  icon = <Bell className="h-4 w-4" />;

  validateConfig(config: Record<string, any>): boolean {
    try {
      ReminderPluginConfigSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  renderComponent(
    config: PluginConfig,
    onConfigChange: (config: PluginConfig) => void
  ): React.ReactNode {
    const remConfig = config as ReminderPluginConfig;

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Configuración de Recordatorios</h3>
        </div>

        <div className="space-y-2">
          <Label>Horas de Recordatorio (HH:mm, separadas por comas)</Label>
          <Input
            value={remConfig.reminderTimes?.join(', ') || ''}
            onChange={(e) =>
              onConfigChange({
                ...config,
                reminderTimes: e.target.value.split(',').map((t) => t.trim()),
              })
            }
            placeholder="09:00, 14:00, 18:00"
          />
        </div>

        <div className="space-y-2">
          <Label>Mensaje Personalizado</Label>
          <Input
            value={remConfig.message || ''}
            onChange={(e) =>
              onConfigChange({ ...config, message: e.target.value })
            }
            placeholder="No olvides completar esta tarea"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={remConfig.sound ?? false}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, sound: checked })
            }
          />
          <Label>Activar sonido</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={remConfig.enabled ?? true}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, enabled: checked })
            }
          />
          <Label>Activar recordatorios</Label>
        </div>
      </div>
    );
  }

  async trackMetric(data: MetricData, config: PluginConfig): Promise<void> {
    console.log('Reminder metric tracked:', data, config);
  }

  async getMetrics(
    config: PluginConfig,
    timeRange?: { start: Date; end: Date }
  ): Promise<MetricData[]> {
    return [];
  }

  async initialize(config: PluginConfig): Promise<void> {
    console.log('Reminder plugin initialized:', config);
  }

  async cleanup(config: PluginConfig): Promise<void> {
    console.log('Reminder plugin cleaned up:', config);
  }
}

