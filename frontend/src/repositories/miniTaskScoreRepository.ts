import { prisma } from '@/lib/prisma/client';
import type { MiniTaskScore } from '@prisma/client';

export async function createMiniTaskScore(
  miniTaskId: string,
  data: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timebound: number;
    average: number;
    passed: boolean;
  }
): Promise<MiniTaskScore> {
  return prisma.miniTaskScore.create({
    data: {
      miniTaskId,
      ...data,
    },
  });
}


