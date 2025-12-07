import { prisma } from '@/lib/prisma/client';
import type { Goal } from '@prisma/client';
import { generateRandomColor } from '@/utils/colorUtils';

export async function createGoal(
  userId: string,
  data: { title: string; description?: string; deadline?: Date; plannedHours?: number; isSingleDayGoal?: boolean; color?: string }
): Promise<Goal> {
  // Generar color aleatorio si no se proporciona
  const color = data.color || generateRandomColor();
  
  return prisma.goal.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      plannedHours: data.plannedHours,
      isSingleDayGoal: data.isSingleDayGoal ?? false,
      color,
      status: 'DRAFT',
    },
  });
}

export async function findGoalById(id: string, userId: string): Promise<Goal | null> {
  const goal = await prisma.goal.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      smarterScore: true,
      miniTasks: {
        include: {
          score: true,
        },
      },
      readjustments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      suggestedTasks: {
        orderBy: {
          priority: 'desc',
        },
      },
    },
  });
  
  // Verificar y generar color si no existe
  if (goal && !(goal as any).color) {
    const color = generateRandomColor();
    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: { color } as any,
    });
    return { ...goal, color: (updated as any).color };
  }
  
  return goal;
}

export async function findGoalsByUser(
  userId: string,
  filters?: { status?: string }
): Promise<Goal[]> {
  const goals = await prisma.goal.findMany({
    where: {
      userId,
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      smarterScore: true,
      miniTasks: {
        select: {
          id: true,
          status: true,
        },
      },
      _count: {
        select: {
          miniTasks: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Verificar y generar colores para goals sin color
  const goalsToUpdate = goals.filter(g => !(g as any).color);
  if (goalsToUpdate.length > 0) {
    await Promise.all(
      goalsToUpdate.map(goal =>
        prisma.goal.update({
          where: { id: goal.id },
          data: { color: generateRandomColor() },
        })
      )
    );
    // Refetch para obtener los colores actualizados
    return prisma.goal.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        smarterScore: true,
        miniTasks: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            miniTasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  
  return goals;
}

export async function updateGoal(
  id: string,
  userId: string,
  data: { title?: string; description?: string; deadline?: Date; status?: string; plannedHours?: number; isSingleDayGoal?: boolean; color?: string }
): Promise<Goal> {
  return prisma.goal.update({
    where: {
      id,
      userId,
    },
    data,
  });
}

export async function getGoalSnapshot(id: string): Promise<string> {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      smarterScore: true,
    },
  });
  
  if (!goal) {
    throw new Error('Goal no encontrado');
  }
  
  return JSON.stringify(goal);
}

