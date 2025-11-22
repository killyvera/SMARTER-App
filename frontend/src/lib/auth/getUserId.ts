import { findUserByEmail } from '@/repositories/userRepository';

/**
 * Obtiene el userId del usuario autenticado
 * Por ahora, como es una app de un solo usuario, retorna el usuario por defecto
 */
export async function getUserId(): Promise<string> {
  // TODO: Implementar JWT real
  // Por ahora, obtener el usuario por defecto
  const defaultUser = await findUserByEmail('user@local');
  
  if (!defaultUser) {
    throw new Error('Usuario no encontrado. Ejecuta el seed primero.');
  }
  
  return defaultUser.id;
}
