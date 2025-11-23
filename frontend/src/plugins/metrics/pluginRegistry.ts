import type { BasePlugin, PluginConfig } from './base/BasePlugin';
import type { PluginType } from '@smarter-app/shared';

class PluginRegistry {
  private plugins: Map<PluginType, BasePlugin> = new Map();

  register(plugin: BasePlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} ya está registrado. Sobrescribiendo...`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(pluginId: PluginType): BasePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAll(): BasePlugin[] {
    return Array.from(this.plugins.values());
  }

  has(pluginId: PluginType): boolean {
    return this.plugins.has(pluginId);
  }

  validateConfig(pluginId: PluginType, config: PluginConfig): boolean {
    const plugin = this.get(pluginId);
    if (!plugin) {
      return false;
    }
    return plugin.validateConfig(config);
  }
}

// Instancia singleton del registro
export const pluginRegistry = new PluginRegistry();

// Función helper para registrar plugins
export function registerPlugin(plugin: BasePlugin): void {
  pluginRegistry.register(plugin);
}

