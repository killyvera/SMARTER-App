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
import type { CreateMiniTaskChecklistItemInput, UpdateMiniTaskChecklistItemInput } from '@/types/miniTaskChecklist';

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

