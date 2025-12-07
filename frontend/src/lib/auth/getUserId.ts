import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';

/**
 * Obtiene el userId del usuario autenticado desde el token JWT
 * @param request Request de Next.js con el header Authorization
 * @returns ID del usuario autenticado
 * @throws Error si el token es inválido, expirado o no está presente
 */
export async function getUserId(request?: NextRequest): Promise<string> {
  // Si no se proporciona request, intentar obtenerlo del contexto (no disponible en Next.js)
  // Por ahora, requerimos el request
  if (!request) {
    throw new Error('Request es requerido para obtener el userId');
  }
  
  // Extraer token del header Authorization
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw new Error('Token de autenticación no proporcionado');
  }
  
  // Verificar y decodificar token
  const payload = await verifyToken(token);
  
  return payload.userId;
}
