import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal('')), // Puede ser URL o base64
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const userProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  biometricEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Los tipos se exportan desde types/index.ts para evitar duplicados

