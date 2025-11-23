import { prisma } from '@/lib/prisma/client';
import type { MiniTaskChecklistItem } from '@prisma/client';

export async function createChecklistItem(
  miniTaskId: string,
  data: {
    label: string;
    order?: number;
  }
): Promise<MiniTaskChecklistItem> {
  // Obtener el siguiente orden si no se especifica
  let order = data.order;
  if (order === undefined) {
    const maxOrder = await prisma.miniTaskChecklistItem.findFirst({
      where: { miniTaskId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    order = (maxOrder?.order ?? -1) + 1;
  }

  return prisma.miniTaskChecklistItem.create({
    data: {
      miniTaskId,
      label: data.label,
      order,
    },
  });
}

export async function findChecklistItemsByMiniTask(
  miniTaskId: string
): Promise<MiniTaskChecklistItem[]> {
  return prisma.miniTaskChecklistItem.findMany({
    where: { miniTaskId },
    orderBy: { order: 'asc' },
  });
}

export async function findChecklistItemById(id: string): Promise<MiniTaskChecklistItem | null> {
  return prisma.miniTaskChecklistItem.findUnique({
    where: { id },
  });
}

export async function updateChecklistItem(
  id: string,
  data: {
    label?: string;
    completed?: boolean;
    order?: number;
  }
): Promise<MiniTaskChecklistItem> {
  const updateData: any = {};
  
  if (data.label !== undefined) updateData.label = data.label;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.completed !== undefined) {
    updateData.completed = data.completed;
    updateData.completedAt = data.completed ? new Date() : null;
  }

  return prisma.miniTaskChecklistItem.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await prisma.miniTaskChecklistItem.delete({
    where: { id },
  });
}

export async function toggleChecklistItem(id: string): Promise<MiniTaskChecklistItem> {
  const item = await prisma.miniTaskChecklistItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new Error('Checklist item no encontrado');
  }

  return updateChecklistItem(id, {
    completed: !item.completed,
  });
}

export async function reorderChecklistItems(
  miniTaskId: string,
  itemOrders: Array<{ id: string; order: number }>
): Promise<void> {
  await prisma.$transaction(
    itemOrders.map(({ id, order }) =>
      prisma.miniTaskChecklistItem.update({
        where: { id },
        data: { order },
      })
    )
  );
}

export async function getChecklistProgress(
  miniTaskId: string
): Promise<{ total: number; completed: number; percentage: number; allCompleted: boolean }> {
  const items = await findChecklistItemsByMiniTask(miniTaskId);
  const total = items.length;
  const completed = items.filter(item => item.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allCompleted = total > 0 && completed === total;

  return { total, completed, percentage, allCompleted };
}

