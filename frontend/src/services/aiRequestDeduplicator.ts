/**
 * Request Deduplication Service para proteger el Agent Core de IA
 * 
 * Previene llamadas duplicadas con el mismo input usando hash caching
 * Basado en mejores prácticas de n8n y Flowise
 */

import { createHash } from 'crypto';

interface CachedRequest<T> {
  result: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

// Cache de requests por hash
const requestCache = new Map<string, CachedRequest<any>>();

// TTL por tipo de operación (en milisegundos)
const OPERATION_TTL: Record<string, number> = {
  validateGoal: 30000, // 30 segundos
  unlockMiniTask: 30000, // 30 segundos
  queryCoach: 10000, // 10 segundos (queries más dinámicas)
  validateMiniTask: 30000, // 30 segundos
};

// Limpieza periódica de cache expirado
const CLEANUP_INTERVAL = 10000; // 10 segundos
setInterval(() => {
  const now = Date.now();
  
  for (const [hash, cached] of requestCache.entries()) {
    if (now - cached.timestamp > cached.ttl) {
      requestCache.delete(hash);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Crea un hash único del request
 */
function createRequestHash(
  operation: string,
  userId: string,
  input: any
): string {
  const inputString = JSON.stringify(input);
  const hashInput = `${operation}:${userId}:${inputString}`;
  
  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Obtiene un resultado cacheado si existe y no ha expirado
 */
export async function getCachedResult<T>(
  operation: string,
  userId: string,
  input: any
): Promise<T | null> {
  const hash = createRequestHash(operation, userId, input);
  const cached = requestCache.get(hash);
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  const age = now - cached.timestamp;
  
  // Verificar si ha expirado
  if (age > cached.ttl) {
    requestCache.delete(hash);
    return null;
  }
  
  // Retornar resultado cacheado
  console.log(`[RequestDeduplicator] Cache hit para ${operation} (edad: ${age}ms)`);
  return cached.result as T;
}

/**
 * Cachea un resultado
 */
export async function cacheResult<T>(
  operation: string,
  userId: string,
  input: any,
  result: T
): Promise<void> {
  const hash = createRequestHash(operation, userId, input);
  const ttl = OPERATION_TTL[operation] || 30000; // Default 30 segundos
  
  requestCache.set(hash, {
    result,
    timestamp: Date.now(),
    ttl,
  });
  
  console.log(`[RequestDeduplicator] Resultado cacheado para ${operation} (TTL: ${ttl}ms)`);
}

/**
 * Limpia el cache para una operación específica
 */
export function clearCache(operation?: string, userId?: string): void {
  if (!operation && !userId) {
    // Limpiar todo el cache
    requestCache.clear();
    console.log('[RequestDeduplicator] Cache limpiado completamente');
    return;
  }
  
  // Limpiar entradas específicas
  const keysToDelete: string[] = [];
  
  for (const [hash, cached] of requestCache.entries()) {
    // Nota: No podemos determinar operation/userId desde el hash
    // Por simplicidad, limpiamos todo si se especifica operation o userId
    keysToDelete.push(hash);
  }
  
  keysToDelete.forEach((key) => requestCache.delete(key));
  console.log(`[RequestDeduplicator] Cache limpiado para ${operation || 'todas las operaciones'}`);
}

/**
 * Obtiene estadísticas del cache
 */
export function getCacheStats(): {
  size: number;
  operations: Record<string, number>;
} {
  const operations: Record<string, number> = {};
  
  // Nota: No podemos determinar la operación desde el hash
  // Retornamos tamaño total
  return {
    size: requestCache.size,
    operations,
  };
}

