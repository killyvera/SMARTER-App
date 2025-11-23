'use client';

import { Bell, Plus, X } from 'lucide-react';
import type { BasePlugin, PluginConfig, MetricData } from '../base/BasePlugin';
import type { PluginType, ReminderPluginConfig } from '@smarter-app/shared';
import { ReminderPluginConfigSchema } from '@smarter-app/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

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
    const reminderTimes = remConfig.reminderTimes || ['09:00'];

    const addReminderTime = () => {
      const newTimes = [...reminderTimes, '09:00'];
      onConfigChange({ ...config, reminderTimes: newTimes });
    };

    const removeReminderTime = (index: number) => {
      const newTimes = reminderTimes.filter((_, i) => i !== index);
      if (newTimes.length === 0) {
        onConfigChange({ ...config, reminderTimes: ['09:00'] });
      } else {
        onConfigChange({ ...config, reminderTimes: newTimes });
      }
    };

    const updateReminderTime = (index: number, value: string) => {
      // Validar formato HH:mm
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (value === '' || timeRegex.test(value)) {
        const newTimes = [...reminderTimes];
        newTimes[index] = value || '09:00';
        onConfigChange({ ...config, reminderTimes: newTimes });
      }
    };

    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Configuración de Recordatorios</h3>
        </div>

        <div className="space-y-2">
          <Label>Horas de Recordatorio</Label>
          <div className="space-y-2">
            {reminderTimes.map((time, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateReminderTime(index, e.target.value)}
                  className="flex-1"
                />
                {reminderTimes.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeReminderTime(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addReminderTime}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Recordatorio
            </Button>
          </div>
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

