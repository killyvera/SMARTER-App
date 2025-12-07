import { prisma } from '@/lib/prisma/client';
import type { MiniTask } from '@prisma/client';
import { ensureGoalHasColor, ensureMiniTaskHasColor } from '@/utils/colorUtils';

export async function createMiniTask(
  goalId: string,
  data: { title: string; description?: string; deadline?: Date; plannedHours?: number; isSingleDayTask?: boolean; color?: string }
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
      orderBy: {
        createdAt: 'desc',
      },
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
      orderBy: {
        createdAt: 'desc',
      },
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
      orderBy: {
        createdAt: 'desc',
      },
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
      orderBy: {
        createdAt: 'desc',
      },
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
      orderBy: {
        createdAt: 'desc',
      },
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
    deadline?: Date;
    status?: string;
    unlocked?: boolean;
    metricsConfig?: string;
    plannedHours?: number;
    isSingleDayTask?: boolean;
    color?: string;
    positionX?: number;
    positionY?: number;
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
