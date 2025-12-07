import { SignJWT, jwtVerify } from 'jose';

// Obtener secret desde variable de entorno o generar uno por defecto
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // En desarrollo, generar un secret por defecto (NO usar en producción)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET debe estar configurado en producción');
    }
    console.warn('⚠️  JWT_SECRET no configurado. Usando secret por defecto (solo para desarrollo)');
    // Secret por defecto para desarrollo (32 bytes)
    return new TextEncoder().encode('dev-secret-key-change-in-production-min-32-chars');
  }
  
  // Convertir secret a Uint8Array
  return new TextEncoder().encode(secret);
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Genera un token JWT para un usuario
 * @param userId ID del usuario
 * @param email Email del usuario
 * @param expiresIn Tiempo de expiración en segundos (por defecto 7 días)
 * @returns Token JWT firmado
 */
export async function generateToken(
  userId: string,
  email: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 días por defecto
): Promise<string> {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(secret);
  
  return jwt;
}

/**
 * Verifica y decodifica un token JWT
 * @param token Token JWT a verificar
 * @returns Payload del token si es válido
 * @throws Error si el token es inválido o ha expirado
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = getJwtSecret();
  
  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Validar que el payload tenga los campos requeridos
    if (!payload.userId || !payload.email) {
      throw new Error('Token inválido: faltan campos requeridos');
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('Token expirado');
      }
      throw new Error(`Token inválido: ${error.message}`);
    }
    throw new Error('Token inválido');
  }
}

/**
 * Extrae el token del header Authorization
 * @param authHeader Valor del header Authorization
 * @returns Token extraído o null si no es válido
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

