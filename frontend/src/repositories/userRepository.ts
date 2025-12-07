import { prisma } from '@/lib/prisma/client';
import type { User } from '@prisma/client';

export async function createUser(email: string, passwordHash: string): Promise<User> {
  return prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUserBiometricEnabled(
  userId: string,
  enabled: boolean
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { biometricEnabled: enabled },
  });
}


