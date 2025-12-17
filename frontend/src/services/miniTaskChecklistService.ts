import {
  createChecklistItem,
  findChecklistItemsByMiniTask,
  findChecklistItemById,
  updateChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  reorderChecklistItems,
  getChecklistProgress,
} from '@/repositories/miniTaskChecklistRepository';
import { findMiniTaskById } from '@/repositories/miniTaskRepository';
import { updateMiniTask } from '@/repositories/miniTaskRepository';
import { checkAndUpdateGoalCompletion } from '@/services/goalService';
import type { CreateMiniTaskChecklistItemInput, UpdateMiniTaskChecklistItemInput } from '@/types/miniTaskChecklist';
import { findMiniTaskJournalEntryByDate, findMiniTaskJournalEntryById, createMiniTaskJournalEntry, updateMiniTaskJournalEntry } from '@/repositories/miniTaskJournalRepository';
import { startOfDay } from 'date-fns';
import { notifyJournalEntryCreated, notifyJournalEntryUpdated } from './pluginEventService';

export async function createChecklistItemService(
  userId: string,
  miniTaskId: string,
  input: CreateMiniTaskChecklistItemInput
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }

  return createChecklistItem(miniTaskId, input);
}

export async function getChecklistItemsService(
  userId: string,
  miniTaskId: string
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }

  const items = await findChecklistItemsByMiniTask(miniTaskId);
  const progress = await getChecklistProgress(miniTaskId);

  return {
    items,
    progress,
  };
}

export async function updateChecklistItemService(
  userId: string,
  itemId: string,
  input: UpdateMiniTaskChecklistItemInput
) {
  // Verificar que el item pertenece a una minitask del usuario
  const item = await findChecklistItemById(itemId);
  
  if (!item) {
    throw new Error('Checklist item no encontrado');
  }
  
  const miniTask = await findMiniTaskById(item.miniTaskId) as any;
  
  if (!miniTask || miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }

  const updatedItem = await updateChecklistItem(itemId, input);

  // Si se completó un item, sincronizar con journal
  if (input.completed !== undefined && input.completed) {
    await syncChecklistToJournal(item.miniTaskId, miniTask, userId);
  }

  // Si es un evento único multi-item y todos los items están completados, marcar minitask como COMPLETED
  if (input.completed !== undefined) {
    const progress = await getChecklistProgress(item.miniTaskId);
    
    if (progress.allCompleted && miniTask.status !== 'COMPLETED') {
      // Verificar que el plugin calendar tenga checklistType 'multi-item'
      const calendarPlugin = (miniTask.plugins || []).find((p: any) => 
        p.pluginId === 'calendar' && p.enabled
      );
      
      if (calendarPlugin) {
        const config = typeof calendarPlugin.config === 'string' 
          ? JSON.parse(calendarPlugin.config) 
          : calendarPlugin.config;
        
        if (config.checklistType === 'multi-item' || config.checklistType === 'single') {
          await updateMiniTask(item.miniTaskId, {
            status: 'COMPLETED',
          });
          
          // Verificar si la goal debe marcarse como completada
          if (miniTask.goalId) {
            try {
              await checkAndUpdateGoalCompletion(miniTask.goalId, userId);
            } catch (error) {
              console.error('Error al verificar completitud de goal:', error);
            }
          }
        }
      }
    }
  }

  return updatedItem;
}

export async function deleteChecklistItemService(
  userId: string,
  itemId: string
) {
  // Verificar que el item pertenece a una minitask del usuario
  const item = await findChecklistItemById(itemId);
  
  if (!item) {
    throw new Error('Checklist item no encontrado');
  }
  
  const miniTask = await findMiniTaskById(item.miniTaskId) as any;
  
  if (!miniTask || miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }

  return deleteChecklistItem(itemId);
}

export async function toggleChecklistItemService(
  userId: string,
  itemId: string
) {
  // Verificar que el item pertenece a una minitask del usuario
  const item = await findChecklistItemById(itemId);
  
  if (!item) {
    throw new Error('Checklist item no encontrado');
  }
  
  const miniTask = await findMiniTaskById(item.miniTaskId) as any;
  
  if (!miniTask || miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }

  const updatedItem = await toggleChecklistItem(itemId);

  // Sincronizar con journal cuando se completa un item
  if (updatedItem.completed) {
    await syncChecklistToJournal(item.miniTaskId, miniTask, userId);
  }

  // Verificar si todos los items están completados
  const progress = await getChecklistProgress(item.miniTaskId);
  
  if (progress.allCompleted && miniTask.status !== 'COMPLETED') {
    // Verificar que el plugin calendar tenga checklistType 'multi-item' o 'single'
    const calendarPlugin = (miniTask.plugins || []).find((p: any) => 
      p.pluginId === 'calendar' && p.enabled
    );
    
    if (calendarPlugin) {
      const config = typeof calendarPlugin.config === 'string' 
        ? JSON.parse(calendarPlugin.config) 
        : calendarPlugin.config;
      
      if (config.checklistType === 'multi-item' || config.checklistType === 'single') {
        await updateMiniTask(item.miniTaskId, {
          status: 'COMPLETED',
        });
        
        // Verificar si la goal debe marcarse como completada
        if (miniTask.goalId) {
          try {
            await checkAndUpdateGoalCompletion(miniTask.goalId, userId);
          } catch (error) {
            console.error('Error al verificar completitud de goal:', error);
          }
        }
      }
    }
  }

  return updatedItem;
}

export async function reorderChecklistItemsService(
  userId: string,
  miniTaskId: string,
  itemOrders: Array<{ id: string; order: number }>
) {
  // Verificar que la minitask pertenece al usuario
  const miniTask = await findMiniTaskById(miniTaskId) as any;
  
  if (!miniTask) {
    throw new Error('MiniTask no encontrada');
  }
  
  if (miniTask.goal?.userId !== userId) {
    throw new Error('No autorizado');
  }

  return reorderChecklistItems(miniTaskId, itemOrders);
}

/**
 * Sincroniza el estado del checklist con el journal.
 * Crea o actualiza una entrada del journal cuando se completa un checklist.
 * 
 * Flujo: Checklist → Journal → Plugins
 */
async function syncChecklistToJournal(
  miniTaskId: string,
  miniTask: any,
  userId: string
): Promise<void> {
  if (!miniTask.unlocked) {
    return; // No sincronizar si la minitask no está desbloqueada
  }

  // Obtener el plugin calendar para determinar el tipo de checklist
  const calendarPlugin = (miniTask.plugins || []).find((p: any) => 
    p.pluginId === 'calendar' && p.enabled
  );

  if (!calendarPlugin || !calendarPlugin.config?.checklistEnabled) {
    return; // No hay checklist habilitado
  }

  const config = typeof calendarPlugin.config === 'string' 
    ? JSON.parse(calendarPlugin.config) 
    : calendarPlugin.config;

  const checklistType = config.checklistType || 'daily';
  const today = startOfDay(new Date());

  // Para checklists diarios, siempre crear/actualizar entrada del día actual
  // Para eventos únicos (single/multi-item), crear entrada cuando todos están completados
  if (checklistType === 'daily') {
    // Para checklists diarios, crear/actualizar entrada del día actual
    const existingEntry = await findMiniTaskJournalEntryByDate(miniTaskId, today);
    
    if (existingEntry) {
      // Actualizar entrada existente
      const updatedEntry = await updateMiniTaskJournalEntry(existingEntry.id, {
        checklistCompleted: true,
      });
      
      // Notificar a plugins
      const fullEntry = await findMiniTaskJournalEntryById(updatedEntry.id);
      if (fullEntry) {
        await notifyJournalEntryUpdated(fullEntry, miniTask);
      }
    } else {
      // Crear nueva entrada
      const entry = await createMiniTaskJournalEntry(miniTaskId, {
        entryDate: today,
        checklistCompleted: true,
      });
      
      // Notificar a plugins
      const fullEntry = await findMiniTaskJournalEntryById(entry.id);
      if (fullEntry) {
        await notifyJournalEntryCreated(fullEntry, miniTask);
      }
    }
  } else if (checklistType === 'single' || checklistType === 'multi-item') {
    // Para eventos únicos, verificar si todos los items están completados
    const progress = await getChecklistProgress(miniTaskId);
    
    if (progress.allCompleted) {
      // Crear o actualizar entrada del journal
      const existingEntry = await findMiniTaskJournalEntryByDate(miniTaskId, today);
      
      if (existingEntry) {
        const updatedEntry = await updateMiniTaskJournalEntry(existingEntry.id, {
          checklistCompleted: true,
        });
        
        // Notificar a plugins
        const fullEntry = await findMiniTaskJournalEntryById(updatedEntry.id);
        if (fullEntry) {
          await notifyJournalEntryUpdated(fullEntry, miniTask);
        }
      } else {
        const entry = await createMiniTaskJournalEntry(miniTaskId, {
          entryDate: today,
          checklistCompleted: true,
        });
        
        // Notificar a plugins
        const fullEntry = await findMiniTaskJournalEntryById(entry.id);
        if (fullEntry) {
          await notifyJournalEntryCreated(fullEntry, miniTask);
        }
      }
    }
  }
}

