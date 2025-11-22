import { prisma } from '@/lib/prisma/client';
import type { SmarterScore } from '@prisma/client';

export async function createSmarterScore(
  goalId: string,
  data: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
    evaluate: number;
    readjust: number;
    average: number;
    passed: boolean;
  }
): Promise<SmarterScore> {
  return prisma.smarterScore.create({
    data: {
      goalId,
      ...data,
    },
  });
}

export async function findSmarterScoreByGoalId(goalId: string): Promise<SmarterScore | null> {
  return prisma.smarterScore.findUnique({
    where: { goalId },
  });
}


