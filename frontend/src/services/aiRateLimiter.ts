/**
 * Rate Limiter Service para proteger el Agent Core de IA
 * 
 * Implementa Token Bucket algorithm para rate limiting por usuario y global
 * Basado en mejores prácticas de n8n y Flowise
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Ventana de tiempo en milisegundos
}

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
  requests: number[];
}

// Configuración de límites por operación
const OPERATION_LIMITS: Record<string, RateLimitConfig> = {
  validateGoal: { maxRequests: 5, windowMs: 60000 }, // 5 por minuto
  unlockMiniTask: { maxRequests: 3, windowMs: 60000 }, // 3 por minuto
  queryCoach: { maxRequests: 10, windowMs: 60000 }, // 10 por minuto
};

// Límites globales
const GLOBAL_LIMITS = {
  perSecond: 20, // Máximo 20 llamadas por segundo
  perMinutePerIP: 100, // Máximo 100 llamadas por minuto por IP
};

// Almacenamiento en memoria (Map)
const userLimits = new Map<string, RateLimitEntry>();
const globalLimits = new Map<string, RateLimitEntry>();
const ipLimits = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas
const CLEANUP_INTERVAL = 60000; // 1 minuto
setInterval(() => {
  const now = Date.now();
  
  // Limpiar límites de usuario
  for (const [key, entry] of userLimits.entries()) {
    if (now - entry.lastRefill > 300000) { // 5 minutos sin actividad
      userLimits.delete(key);
    }
  }
  
  // Limpiar límites globales
  for (const [key, entry] of globalLimits.entries()) {
    if (now - entry.lastRefill > 60000) { // 1 minuto sin actividad
      globalLimits.delete(key);
    }
  }
  
  // Limpiar límites por IP
  for (const [key, entry] of ipLimits.entries()) {
    if (now - entry.lastRefill > 300000) { // 5 minutos sin actividad
      ipLimits.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Obtiene o crea una entrada de rate limit
 */
function getOrCreateEntry(
  map: Map<string, RateLimitEntry>,
  key: string,
  config: RateLimitConfig
): RateLimitEntry {
  const now = Date.now();
  let entry = map.get(key);
  
  if (!entry) {
    entry = {
      tokens: config.maxRequests,
      lastRefill: now,
      requests: [],
    };
    map.set(key, entry);
    return entry;
  }
  
  // Refill tokens usando sliding window
  const elapsed = now - entry.lastRefill;
  const refillAmount = Math.floor((elapsed / config.windowMs) * config.maxRequests);
  
  if (refillAmount > 0) {
    entry.tokens = Math.min(config.maxRequests, entry.tokens + refillAmount);
    entry.lastRefill = now;
    
    // Limpiar requests fuera de la ventana
    entry.requests = entry.requests.filter(
      (timestamp) => now - timestamp < config.windowMs
    );
  }
  
  return entry;
}

/**
 * Verifica si se puede hacer una request según el rate limit
 */
function checkLimit(
  map: Map<string, RateLimitEntry>,
  key: string,
  config: RateLimitConfig
): boolean {
  const entry = getOrCreateEntry(map, key, config);
  const now = Date.now();
  
  // Verificar requests en la ventana de tiempo
  const requestsInWindow = entry.requests.filter(
    (timestamp) => now - timestamp < config.windowMs
  );
  
  if (requestsInWindow.length >= config.maxRequests) {
    return false; // Rate limit excedido
  }
  
  // Agregar request actual
  entry.requests.push(now);
  entry.tokens = Math.max(0, entry.tokens - 1);
  
  return true; // Permitido
}

/**
 * Verifica rate limit para una operación específica por usuario
 */
export async function checkUserRateLimit(
  operation: string,
  userId: string
): Promise<void> {
  const config = OPERATION_LIMITS[operation];
  
  if (!config) {
    // Si no hay configuración, permitir (fallback)
    return;
  }
  
  const key = `${operation}:${userId}`;
  
  if (!checkLimit(userLimits, key, config)) {
    throw new RateLimitError(
      `Rate limit excedido para ${operation}. Máximo ${config.maxRequests} requests por ${config.windowMs / 1000} segundos.`
    );
  }
}

/**
 * Verifica rate limit global (por segundo)
 */
export async function checkGlobalRateLimit(): Promise<void> {
  const now = Date.now();
  const secondKey = Math.floor(now / 1000).toString();
  const config: RateLimitConfig = {
    maxRequests: GLOBAL_LIMITS.perSecond,
    windowMs: 1000,
  };
  
  if (!checkLimit(globalLimits, secondKey, config)) {
    throw new RateLimitError(
      `Rate limit global excedido. Máximo ${GLOBAL_LIMITS.perSecond} requests por segundo.`
    );
  }
}

/**
 * Verifica rate limit por IP
 */
export async function checkIPRateLimit(ip: string): Promise<void> {
  const config: RateLimitConfig = {
    maxRequests: GLOBAL_LIMITS.perMinutePerIP,
    windowMs: 60000,
  };
  
  if (!checkLimit(ipLimits, ip, config)) {
    throw new RateLimitError(
      `Rate limit por IP excedido. Máximo ${GLOBAL_LIMITS.perMinutePerIP} requests por minuto.`
    );
  }
}

/**
 * Verifica todos los rate limits (usuario, global, IP)
 */
export async function checkAllRateLimits(
  operation: string,
  userId: string,
  ip?: string
): Promise<void> {
  // 1. Verificar límite global
  await checkGlobalRateLimit();
  
  // 2. Verificar límite por IP si está disponible
  if (ip) {
    await checkIPRateLimit(ip);
  }
  
  // 3. Verificar límite por usuario y operación
  await checkUserRateLimit(operation, userId);
}

/**
 * Obtiene información del rate limit actual
 */
export function getRateLimitInfo(operation: string, userId: string): {
  remaining: number;
  resetAt: number;
} {
  const config = OPERATION_LIMITS[operation];
  
  if (!config) {
    return { remaining: Infinity, resetAt: Date.now() };
  }
  
  const key = `${operation}:${userId}`;
  const entry = userLimits.get(key);
  
  if (!entry) {
    return {
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }
  
  const now = Date.now();
  const requestsInWindow = entry.requests.filter(
    (timestamp) => now - timestamp < config.windowMs
  );
  
  return {
    remaining: Math.max(0, config.maxRequests - requestsInWindow.length),
    resetAt: now + config.windowMs,
  };
}

/**
 * Error personalizado para rate limiting
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

