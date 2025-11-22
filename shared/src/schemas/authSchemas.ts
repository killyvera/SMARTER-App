import { z } from 'zod';

// Validación de email más flexible para permitir emails locales (ej: user@local)
const emailSchema = z.string().refine(
  (val) => {
    // Permitir formato estándar de email
    if (z.string().email().safeParse(val).success) {
      return true;
    }
    // Permitir formato local (ej: user@local)
    return /^[^\s@]+@[^\s@]+$/.test(val);
  },
  { message: 'Email inválido' }
);

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
  }),
});


