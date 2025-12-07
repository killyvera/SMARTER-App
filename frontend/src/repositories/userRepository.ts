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

export async function updateUserProfile(
  userId: string,
  data: { name?: string | null; phone?: string | null; avatarUrl?: string | null }
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
    },
  });
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}


