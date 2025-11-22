import { prisma } from '@/lib/prisma/client';
import type { CheckIn } from '@prisma/client';

export async function createCheckIn(
  goalId: string,
  data: {
    progressPercentage: number;
    currentValue?: string;
    notes?: string;
    mood?: string;
  }
): Promise<CheckIn> {
  return prisma.checkIn.create({
    data: {
      goalId,
      ...data,
    },
  });
}

export async function findCheckInsByGoal(goalId: string): Promise<CheckIn[]> {
  return prisma.checkIn.findMany({
    where: { goalId },
    orderBy: {
      createdAt: 'desc',
    },
  });
}


