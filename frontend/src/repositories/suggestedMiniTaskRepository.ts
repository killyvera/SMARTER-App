import { prisma } from '@/lib/prisma/client';
import type { SuggestedMiniTask } from '@prisma/client';

export async function createSuggestedMiniTask(
  goalId: string,
  data: { title: string; description?: string; priority: number }
): Promise<SuggestedMiniTask> {
  return prisma.suggestedMiniTask.create({
    data: {
      goalId,
      ...data,
    },
  });
}

export async function findSuggestedMiniTasksByGoal(goalId: string): Promise<SuggestedMiniTask[]> {
  return prisma.suggestedMiniTask.findMany({
    where: { goalId },
    orderBy: {
      priority: 'desc',
    },
  });
}


