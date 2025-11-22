import { prisma } from '@/lib/prisma/client';
import type { Readjustment } from '@prisma/client';

export async function createReadjustment(
  goalId: string,
  previousSnapshot: string,
  newSnapshot: string,
  reason?: string
): Promise<Readjustment> {
  return prisma.readjustment.create({
    data: {
      goalId,
      previousSnapshot,
      newSnapshot,
      reason,
    },
  });
}

export async function findReadjustmentsByGoal(goalId: string): Promise<Readjustment[]> {
  return prisma.readjustment.findMany({
    where: { goalId },
    orderBy: {
      createdAt: 'desc',
    },
  });
}


