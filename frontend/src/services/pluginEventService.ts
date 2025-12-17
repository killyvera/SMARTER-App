import { findMiniTaskById } from '@/repositories/miniTaskRepository';
import { createMiniTaskMetric } from '@/repositories/miniTaskRepository';
import type { MiniTaskJournalEntry } from '@/types/miniTaskJournal';

/**
 * Servicio de eventos para notificar a los plugins cuando cambia el journal.
 * 
 * Flujo de datos: Journal → Plugins
 * - Cuando se crea/actualiza una entrada del journal, los plugins son notificados
 * - Cada plugin reacciona según su tipo y configuración
 */

interface MiniTaskWithPlugins {
  id: string;
  plugins?: Array<{
    pluginId: string;
    config: any;
    enabled: boolean;
  }>;
}

/**
 * Notifica a los plugins cuando se crea una entrada del journal
 */
export async function notifyJournalEntryCreated(
  entry: MiniTaskJournalEntry,
  miniTask: MiniTaskWithPlugins
): Promise<void> {
  if (!miniTask.plugins || miniTask.plugins.length === 0) {
    return;
  }

  const activePlugins = miniTask.plugins.filter(p => p.enabled);

  // Notificar a cada plugin según su tipo
  for (const plugin of activePlugins) {
    try {
      await handlePluginNotification(plugin, entry, miniTask, 'created');
    } catch (error) {
      console.error(`Error al notificar plugin ${plugin.pluginId} sobre entrada creada:`, error);
      // No fallar si un plugin tiene error, continuar con los demás
    }
  }
}

/**
 * Notifica a los plugins cuando se actualiza una entrada del journal
 */
export async function notifyJournalEntryUpdated(
  entry: MiniTaskJournalEntry,
  miniTask: MiniTaskWithPlugins
): Promise<void> {
  if (!miniTask.plugins || miniTask.plugins.length === 0) {
    return;
  }

  const activePlugins = miniTask.plugins.filter(p => p.enabled);

  // Notificar a cada plugin según su tipo
  for (const plugin of activePlugins) {
    try {
      await handlePluginNotification(plugin, entry, miniTask, 'updated');
    } catch (error) {
      console.error(`Error al notificar plugin ${plugin.pluginId} sobre entrada actualizada:`, error);
      // No fallar si un plugin tiene error, continuar con los demás
    }
  }
}

/**
 * Notifica a los plugins cuando se elimina una entrada del journal
 */
export async function notifyJournalEntryDeleted(
  entryId: string,
  miniTaskId: string
): Promise<void> {
  // Obtener la minitask con sus plugins
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask || !miniTask.plugins || miniTask.plugins.length === 0) {
    return;
  }

  const activePlugins = miniTask.plugins.filter((p: any) => p.enabled);

  // Notificar a cada plugin según su tipo
  for (const plugin of activePlugins) {
    try {
      // Para eliminaciones, principalmente necesitamos invalidar cache/estado
      // El chart y calendar se actualizarán cuando se refresque la UI
      if (plugin.pluginId === 'chart' || plugin.pluginId === 'calendar') {
        // Estos plugins se actualizarán automáticamente cuando se refresque la query
        // No necesitamos hacer nada especial aquí
        console.log(`Plugin ${plugin.pluginId} será actualizado en el próximo refresh`);
      }
    } catch (error) {
      console.error(`Error al notificar plugin ${plugin.pluginId} sobre entrada eliminada:`, error);
    }
  }
}

/**
 * Maneja la notificación para un plugin específico
 */
async function handlePluginNotification(
  plugin: { pluginId: string; config: any; enabled: boolean },
  entry: MiniTaskJournalEntry,
  miniTask: MiniTaskWithPlugins,
  eventType: 'created' | 'updated'
): Promise<void> {
  switch (plugin.pluginId) {
    case 'progress-tracker':
      // Si hay progressValue, crear métrica automáticamente
      if (entry.progressValue !== undefined && entry.progressValue !== null) {
        await createMiniTaskMetric(
          miniTask.id,
          'progress-tracker',
          'progress',
          entry.progressValue,
          {
            unit: entry.progressUnit || 'unidades',
            entryDate: entry.entryDate.toISOString(),
            journalEntryId: entry.id,
            eventType,
          }
        );
        console.log(`✅ Métrica creada para progress-tracker desde journal entry ${entry.id}`);
      }
      break;

    case 'chart':
      // El chart se actualizará automáticamente cuando se refresque la query
      // No necesitamos hacer nada especial aquí, solo log para debugging
      console.log(`📊 Chart plugin será actualizado con nueva entrada del journal`);
      break;

    case 'calendar':
      // El calendar se actualizará automáticamente cuando se refresque la query
      // El estado visual del día se actualizará basado en las entradas del journal
      console.log(`📅 Calendar plugin será actualizado con nueva entrada del journal`);
      break;

    case 'checklist':
      // Si checklistCompleted=true, el checklist ya debería estar sincronizado
      // Este caso se maneja principalmente en el servicio de checklist
      if (entry.checklistCompleted) {
        console.log(`✅ Checklist completado registrado en journal entry ${entry.id}`);
      }
      break;

    default:
      // Otros plugins (reminder, timer, notification, mobile-push) no necesitan
      // reaccionar directamente a cambios en el journal
      break;
  }
}

