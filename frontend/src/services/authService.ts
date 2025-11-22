import { findUserByEmail, createUser } from '@/repositories/userRepository';
import { hashPassword, verifyPassword } from '@/lib/auth';
import type { RegisterInput, LoginInput } from '@smarter-app/shared';

export async function registerUser(input: RegisterInput) {
  const existingUser = await findUserByEmail(input.email);
  
  if (existingUser) {
    throw new Error('El usuario ya existe');
  }
  
  const passwordHash = await hashPassword(input.password);
  const user = await createUser(input.email, passwordHash);
  
  return {
    id: user.id,
    email: user.email,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  
  if (!user) {
    throw new Error('Credenciales inválidas');
  }
  
  const isValid = await verifyPassword(input.password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Credenciales inválidas');
  }
  
  return {
    id: user.id,
    email: user.email,
  };
}


