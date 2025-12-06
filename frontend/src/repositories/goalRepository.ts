import { prisma } from '@/lib/prisma/client';
import type { Goal } from '@prisma/client';

export async function createGoal(
  userId: string,
  data: { title: string; description?: string; deadline?: Date; plannedHours?: number; isSingleDayGoal?: boolean }
): Promise<Goal> {
  return prisma.goal.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      plannedHours: data.plannedHours,
      isSingleDayGoal: data.isSingleDayGoal ?? false,
      status: 'DRAFT',
    },
  });
}

export async function findGoalById(id: string, userId: string): Promise<Goal | null> {
  return prisma.goal.findFirst({
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
}

export async function findGoalsByUser(
  userId: string,
  filters?: { status?: string }
): Promise<Goal[]> {
  return prisma.goal.findMany({
    where: {
      userId,
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      smarterScore: true,
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

export async function updateGoal(
  id: string,
  userId: string,
  data: { title?: string; description?: string; deadline?: Date; status?: string; plannedHours?: number; isSingleDayGoal?: boolean }
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

