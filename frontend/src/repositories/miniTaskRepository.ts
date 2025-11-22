import { prisma } from '@/lib/prisma/client';
import type { MiniTask } from '@prisma/client';

export async function createMiniTask(
  goalId: string,
  data: { title: string; description?: string; deadline?: Date }
): Promise<MiniTask> {
  return prisma.miniTask.create({
    data: {
      goalId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      status: 'DRAFT',
    },
  });
}

export async function findMiniTaskById(
  id: string,
  goalId?: string
) {
  return prisma.miniTask.findFirst({
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
}

export async function findMiniTasksByGoal(goalId: string): Promise<MiniTask[]> {
  return prisma.miniTask.findMany({
    where: { goalId },
    include: {
      score: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
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
  return prisma.miniTask.findMany({
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
        },
      },
      score: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function updateMiniTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    deadline?: Date;
    status?: string;
  }
): Promise<MiniTask> {
  return prisma.miniTask.update({
    where: { id },
    data,
  });
}
