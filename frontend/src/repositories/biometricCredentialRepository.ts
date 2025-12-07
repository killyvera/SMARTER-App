import { prisma } from '@/lib/prisma/client';
import type { BiometricCredential } from '@prisma/client';

export async function createBiometricCredential(
  userId: string,
  credentialId: string,
  publicKey: string,
  deviceName?: string,
  authenticatorType?: string
): Promise<BiometricCredential> {
  return prisma.biometricCredential.create({
    data: {
      userId,
      credentialId,
      publicKey,
      counter: 0,
      deviceName: deviceName || null,
      authenticatorType: authenticatorType || null,
      enabled: true,
    },
  });
}

export async function findBiometricCredentialByCredentialId(
  credentialId: string
): Promise<BiometricCredential | null> {
  return prisma.biometricCredential.findUnique({
    where: { credentialId },
  });
}

export async function findBiometricCredentialsByUserId(
  userId: string,
  onlyEnabled: boolean = false
): Promise<BiometricCredential[]> {
  return prisma.biometricCredential.findMany({
    where: {
      userId,
      ...(onlyEnabled && { enabled: true }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateBiometricCredentialEnabled(
  credentialId: string,
  enabled: boolean
): Promise<BiometricCredential> {
  return prisma.biometricCredential.update({
    where: { credentialId },
    data: { enabled },
  });
}

export async function updateBiometricCredentialDeviceName(
  credentialId: string,
  deviceName: string
): Promise<BiometricCredential> {
  return prisma.biometricCredential.update({
    where: { credentialId },
    data: { deviceName },
  });
}

export async function updateBiometricCredentialCounter(
  credentialId: string,
  counter: number,
  lastUsedAt: Date
): Promise<BiometricCredential> {
  return prisma.biometricCredential.update({
    where: { credentialId },
    data: {
      counter,
      lastUsedAt,
    },
  });
}

export async function deleteBiometricCredentialsByUserId(
  userId: string
): Promise<void> {
  await prisma.biometricCredential.deleteMany({
    where: { userId },
  });
}

export async function deleteBiometricCredential(
  credentialId: string
): Promise<void> {
  await prisma.biometricCredential.delete({
    where: { credentialId },
  });
}

