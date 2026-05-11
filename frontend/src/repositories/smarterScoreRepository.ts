import { prisma } from '@/lib/prisma/client';
import type { SmarterScore } from '@prisma/client';

type SmarterScorePayload = {
  specific: number;
  measurable: number;
  achievable: number;
  relevant: number;
  timebound: number;
  evaluate: number;
  readjust: number;
  average: number;
  passed: boolean;
};

export async function createSmarterScore(
  goalId: string,
  data: SmarterScorePayload
): Promise<SmarterScore> {
  return prisma.smarterScore.create({
    data: {
      goalId,
      ...data,
    },
  });
}

/** Idempotente: re-validar / confirmar de nuevo no debe fallar por goalId único. */
export async function upsertSmarterScore(
  goalId: string,
  data: SmarterScorePayload
): Promise<SmarterScore> {
  return prisma.smarterScore.upsert({
    where: { goalId },
    create: { goalId, ...data },
    update: { ...data },
  });
}

export async function findSmarterScoreByGoalId(goalId: string): Promise<SmarterScore | null> {
  return prisma.smarterScore.findUnique({
    where: { goalId },
  });
}


