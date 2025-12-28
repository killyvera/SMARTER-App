import { prisma } from '@/lib/prisma/client';
import type { MiniTask } from '@prisma/client';
import { ensureGoalHasColor, ensureMiniTaskHasColor } from '@/utils/colorUtils';

/**
 * Calcula el orden automático para una nueva minitask basado en:
 * - deadline (más cercana primero)
 * - schedulingType (daily al final)
 * - dependsOn (después de dependencia)
 * - isSingleDayTask (por fecha/hora)
 * - Por defecto: ordenar por createdAt
 */
export async function calculateMiniTaskOrder(
  goalId: string,
  data: {
    deadline?: Date | null;
    isSingleDayTask?: boolean;
    schedulingType?: string | null;
    scheduledDate?: Date | null;
    scheduledTime?: string | null;
    dependsOn?: string | null;
  }
): Promise<number> {
  // Obtener todas las minitasks del goal ordenadas
  const existingTasks = await prisma.miniTask.findMany({
    where: { goalId },
    select: {
      id: true,
      order: true,
      deadline: true,
      schedulingType: true,
      scheduledDate: true,
      scheduledTime: true,
      dependsOn: true,
      isSingleDayTask: true,
    },
    orderBy: [
      { order: 'asc' },
      { deadline: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  if (existingTasks.length === 0) {
    return 0; // Primera minitask
  }

  // Si tiene dependencia, ordenar después de la dependencia
  if (data.dependsOn) {
    const dependencyTask = existingTasks.find(t => t.id === data.dependsOn);
    if (dependencyTask) {
      // Buscar la siguiente posición después de la dependencia
      const dependencyOrder = dependencyTask.order;
      // Encontrar el siguiente order disponible después de la dependencia
      const nextOrder = Math.max(...existingTasks
        .filter(t => t.order > dependencyOrder)
        .map(t => t.order), dependencyOrder) + 1;
      return nextOrder;
    }
  }

  // Si es daily, poner al final
  if (data.schedulingType === 'daily') {
    const maxOrder = Math.max(...existingTasks.map(t => t.order), -1);
    return maxOrder + 1;
  }

  // Si tiene deadline, ordenar por fecha (más cercana primero)
  if (data.deadline) {
    const now = new Date();
    const taskDeadline = new Date(data.deadline);
    
    // Encontrar posición basada en deadline
    const tasksWithDeadline = existingTasks
      .filter(t => t.deadline)
      .sort((a, b) => {
        const dateA = new Date(a.deadline!);
        const dateB = new Date(b.deadline!);
        return dateA.getTime() - dateB.getTime();
      });

    // Encontrar donde insertar esta tarea
    for (let i = 0; i < tasksWithDeadline.length; i++) {
      const taskDeadlineDate = new Date(tasksWithDeadline[i].deadline!);
      if (taskDeadline.getTime() < taskDeadlineDate.getTime()) {
        // Insertar antes de esta tarea
        return tasksWithDeadline[i].order;
      }
    }
    
    // Si no hay tareas con deadline más cercanas, insertar después de todas
    const maxDeadlineOrder = Math.max(...tasksWithDeadline.map(t => t.order), -1);
    return maxDeadlineOrder + 1;
  }

  // Si es single day task con scheduledDate/scheduledTime
  if (data.isSingleDayTask && (data.scheduledDate || data.scheduledTime)) {
    const scheduledDateTime = data.scheduledDate 
      ? new Date(data.scheduledDate)
      : new Date();
    
    // Ajustar hora si hay scheduledTime
    if (data.scheduledTime) {
      const [hours, minutes] = data.scheduledTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
    }

    // Ordenar por fecha/hora
    const singleDayTasks = existingTasks
      .filter(t => t.isSingleDayTask && (t.scheduledDate || t.scheduledTime))
      .sort((a, b) => {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date();
        const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date();
        if (a.scheduledTime) {
          const [hours, minutes] = a.scheduledTime.split(':').map(Number);
          dateA.setHours(hours, minutes);
        }
        if (b.scheduledTime) {
          const [hours, minutes] = b.scheduledTime.split(':').map(Number);
          dateB.setHours(hours, minutes);
        }
        return dateA.getTime() - dateB.getTime();
      });

    // Encontrar posición
    for (let i = 0; i < singleDayTasks.length; i++) {
      const taskDate = singleDayTasks[i].scheduledDate 
        ? new Date(singleDayTasks[i].scheduledDate!)
        : new Date();
      if (singleDayTasks[i].scheduledTime) {
        const [hours, minutes] = singleDayTasks[i].scheduledTime!.split(':').map(Number);
        taskDate.setHours(hours, minutes);
      }
      
      if (scheduledDateTime.getTime() < taskDate.getTime()) {
        return singleDayTasks[i].order;
      }
    }
    
    const maxSingleDayOrder = Math.max(...singleDayTasks.map(t => t.order), -1);
    return maxSingleDayOrder + 1;
  }

  // Por defecto: agregar al final
  const maxOrder = Math.max(...existingTasks.map(t => t.order), -1);
  return maxOrder + 1;
}

export async function createMiniTask(
  goalId: string,
  data: { 
    title: string; 
    description?: string; 
    deadline?: Date | null; 
    plannedHours?: number; 
    isSingleDayTask?: boolean; 
    color?: string;
    priority?: string | null;
    dependsOn?: string | null;
    schedulingType?: string | null;
    scheduledDate?: Date | null;
    scheduledTime?: string | null;
    order?: number; // Si se proporciona, usar este order; si no, calcular automáticamente
  }
): Promise<MiniTask> {
  // Obtener el goal para heredar su color si no se proporciona uno
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { color: true } as any,
  });
  
  // Asegurar que el goal tenga color
  const goalColor = goal ? ensureGoalHasColor(goal as any) : '#3b82f6'; // Color por defecto si no hay goal
  
  // Si el goal no tenía color, actualizarlo
  if (goal && !(goal as any).color) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { color: goalColor } as any,
    });
  }
  
  // Heredar color del goal si no se proporciona uno
  const color = data.color || goalColor;
  
  // Calcular order automáticamente si no se proporciona
  const order = data.order !== undefined 
    ? data.order 
    : await calculateMiniTaskOrder(goalId, {
        deadline: data.deadline,
        isSingleDayTask: data.isSingleDayTask,
        schedulingType: data.schedulingType,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        dependsOn: data.dependsOn,
      });
  
  return prisma.miniTask.create({
    data: {
      goalId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      plannedHours: data.plannedHours,
      isSingleDayTask: data.isSingleDayTask ?? false,
      color: color as any,
      status: 'DRAFT',
      order,
      priority: data.priority ?? undefined,
      dependsOn: data.dependsOn ?? undefined,
      schedulingType: data.schedulingType ?? undefined,
      scheduledDate: data.scheduledDate ?? undefined,
      scheduledTime: data.scheduledTime ?? undefined,
    },
  });
}

export async function findMiniTaskById(
  id: string,
  goalId?: string
) {
  try {
    const task = await prisma.miniTask.findFirst({
      where: {
        id,
        ...(goalId && { goalId }),
      },
      include: {
        score: true,
        plugins: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        metrics: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 50, // Últimas 50 métricas
        },
        goal: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });
    if (!task) return null;
    // Asegurar que unlocked tenga valor por defecto y parsear configs
    return {
      ...task,
      unlocked: task.unlocked ?? false,
      plugins: task.plugins?.map(plugin => ({
        ...plugin,
        config: typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config,
      })) || [],
      metrics: task.metrics?.map(metric => ({
        ...metric,
        value: typeof metric.value === 'string' ? JSON.parse(metric.value) : metric.value,
        metadata: metric.metadata ? (typeof metric.metadata === 'string' ? JSON.parse(metric.metadata) : metric.metadata) : null,
        recordedAt: new Date(metric.recordedAt),
      })) || [],
    };
  } catch (error) {
    // Si las tablas de plugins no existen aún, hacer query sin ellas
    console.warn('Error al incluir plugins/metrics, usando query básica:', error);
    const task = await prisma.miniTask.findFirst({
      where: {
        id,
        ...(goalId && { goalId }),
      },
      include: {
        score: true,
        goal: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });
    if (!task) return null;
    // Asegurar que unlocked tenga valor por defecto
    return {
      ...task,
      unlocked: task.unlocked ?? false,
      plugins: [],
      metrics: [],
    };
  }
}

export async function findMiniTasksByGoal(goalId: string): Promise<MiniTask[]> {
  try {
    const tasks = await prisma.miniTask.findMany({
      where: { goalId },
      include: {
        score: true,
        plugins: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        metrics: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 50, // Últimas 50 métricas
        },
      },
      orderBy: [
        { order: 'asc' },
        { priority: 'desc' }, // high > medium > low (null al final)
        { deadline: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    // Asegurar que todas las minitasks tengan unlocked con valor por defecto y parsear configs de plugins
    return tasks.map(task => ({
      ...task,
      unlocked: task.unlocked ?? false,
      plugins: task.plugins?.map(plugin => ({
        ...plugin,
        config: typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config,
      })) || [],
      metrics: task.metrics?.map(metric => ({
        ...metric,
        value: typeof metric.value === 'string' ? JSON.parse(metric.value) : metric.value,
        metadata: metric.metadata ? (typeof metric.metadata === 'string' ? JSON.parse(metric.metadata) : metric.metadata) : null,
        recordedAt: new Date(metric.recordedAt),
      })) || [],
    })) as MiniTask[];
  } catch (error) {
    // Si las tablas de plugins no existen aún, hacer query sin ellas
    console.warn('Error al incluir plugins/metrics, usando query básica:', error);
    const tasks = await prisma.miniTask.findMany({
      where: { goalId },
      include: {
        score: true,
      },
      orderBy: [
        { order: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    // Asegurar que todas las minitasks tengan unlocked con valor por defecto
    return tasks.map(task => ({
      ...task,
      unlocked: task.unlocked ?? false,
      plugins: [],
      metrics: [],
    })) as MiniTask[];
  }
}

export async function findMiniTasksByStatus(
  userId: string,
  status: string
): Promise<MiniTask[]> {
  return prisma.miniTask.findMany({
    where: {
      status,
      goal: {
        userId,
      },
    },
    include: {
      goal: {
        select: {
          id: true,
          title: true,
        },
      },
      score: true,
    },
    orderBy: {
      deadline: 'asc',
    },
  });
}

export async function findMiniTasksByUser(userId: string): Promise<MiniTask[]> {
  try {
    const tasks = await prisma.miniTask.findMany({
      where: {
        goal: {
          userId,
        },
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            userId: true,
            color: true,
          },
        },
        score: true,
        plugins: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    
    // Asegurar que todos los goals tengan color y que todas las minitasks hereden el color
    const tasksToUpdate: Array<{ id: string; color: string }> = [];
    
    for (const task of tasks) {
      // Asegurar que el goal tenga color
      const goalColor = task.goal ? ensureGoalHasColor(task.goal as any) : '#3b82f6';
      
      // Si el goal no tenía color, actualizarlo
      if (task.goal && !(task.goal as any).color) {
        await prisma.goal.update({
          where: { id: task.goal.id },
          data: { color: goalColor } as any,
        });
      }
      
      // Asegurar que la minitask tenga color (heredado del goal)
      const taskColor = ensureMiniTaskHasColor(task as any, goalColor);
      if (!(task as any).color || (task as any).color !== taskColor) {
        tasksToUpdate.push({ id: task.id, color: taskColor });
      }
    }
    
    // Actualizar minitasks sin color
    if (tasksToUpdate.length > 0) {
      await Promise.all(
        tasksToUpdate.map(({ id, color }) =>
          prisma.miniTask.update({
            where: { id },
            data: { color },
          })
        )
      );
    }
    
    // Refetch para obtener los colores actualizados
    const updatedTasks = await prisma.miniTask.findMany({
      where: {
        goal: {
          userId,
        },
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            userId: true,
            color: true,
          },
        },
        score: true,
        plugins: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    
    // Parsear configs de plugins y asegurar valores por defecto
    return updatedTasks.map(task => ({
      ...task,
      unlocked: task.unlocked ?? false,
      plugins: task.plugins?.map(plugin => ({
        ...plugin,
        config: typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config,
      })) || [],
    })) as MiniTask[];
  } catch (error) {
    // Si las tablas de plugins no existen aún, hacer query sin ellas
    console.warn('Error al incluir plugins en findMiniTasksByUser, usando query básica:', error);
    const tasks = await prisma.miniTask.findMany({
      where: {
        goal: {
          userId,
        },
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            userId: true,
            color: true,
          },
        },
        score: true,
      },
      orderBy: [
        { order: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    
    // Asegurar colores básicos
    for (const task of tasks) {
      const goalColor = task.goal ? ensureGoalHasColor(task.goal as any) : '#3b82f6';
      if (task.goal && !(task.goal as any).color) {
        await prisma.goal.update({
          where: { id: task.goal.id },
          data: { color: goalColor } as any,
        });
      }
      const taskColor = ensureMiniTaskHasColor(task as any, goalColor);
      if (!(task as any).color || (task as any).color !== taskColor) {
        await prisma.miniTask.update({
          where: { id: task.id },
          data: { color: taskColor } as any,
        });
      }
    }
    
    return tasks.map(task => ({
      ...task,
      unlocked: task.unlocked ?? false,
      plugins: [],
    })) as MiniTask[];
  }
}

export async function updateMiniTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    deadline?: Date | null;
    status?: string;
    unlocked?: boolean;
    metricsConfig?: string;
    plannedHours?: number;
    isSingleDayTask?: boolean;
    color?: string;
    positionX?: number;
    positionY?: number;
    order?: number;
    priority?: string | null;
    dependsOn?: string | null;
    schedulingType?: string | null;
    scheduledDate?: Date | null;
    scheduledTime?: string | null;
  }
): Promise<MiniTask> {
  return prisma.miniTask.update({
    where: { id },
    data: data as any,
  });
}

export async function createMiniTaskPlugin(
  miniTaskId: string,
  pluginId: string,
  config: Record<string, any>
) {
  return prisma.miniTaskPlugin.create({
    data: {
      miniTaskId,
      pluginId,
      config: JSON.stringify(config),
      enabled: true,
    },
  });
}

export async function createMiniTaskMetric(
  miniTaskId: string,
  pluginId: string,
  metricType: string,
  value: any,
  metadata?: Record<string, any>
) {
  return prisma.miniTaskMetric.create({
    data: {
      miniTaskId,
      pluginId,
      metricType,
      value: JSON.stringify(value),
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Reordena minitasks dentro de un goal
 * Actualiza el campo order de múltiples minitasks
 */
export async function reorderMiniTasks(
  goalId: string,
  orders: Array<{ id: string; order: number }>
): Promise<void> {
  // Actualizar cada minitask con su nuevo order
  await Promise.all(
    orders.map(({ id, order }) =>
      prisma.miniTask.update({
        where: { id },
        data: { order },
      })
    )
  );
}
