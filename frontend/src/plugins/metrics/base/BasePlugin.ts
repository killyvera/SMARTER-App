import type { PluginType } from '@smarter-app/shared';
import type { ReactNode } from 'react';

export interface PluginConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface MetricData {
  value: number | string | boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BasePlugin {
  id: PluginType;
  name: string;
  description: string;
  icon?: ReactNode;
  
  // Validar configuración del plugin
  validateConfig(config: Record<string, any>): boolean;
  
  // Renderizar componente de UI del plugin
  renderComponent(config: PluginConfig, onConfigChange: (config: PluginConfig) => void): ReactNode;
  
  // Registrar una métrica
  trackMetric(data: MetricData, config: PluginConfig): Promise<void>;
  
  // Obtener métricas históricas
  getMetrics(config: PluginConfig, timeRange?: { start: Date; end: Date }): Promise<MetricData[]>;
  
  // Inicializar plugin (setup, listeners, etc.)
  initialize?(config: PluginConfig): Promise<void>;
  
  // Limpiar recursos del plugin
  cleanup?(config: PluginConfig): Promise<void>;
}

