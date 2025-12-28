/**
 * Throttler/Debouncer Service para proteger el Agent Core de IA
 * 
 * Implementa debouncing y throttling para prevenir llamadas excesivas
 * Basado en mejores prácticas de n8n y Flowise
 */

interface ThrottleConfig {
  delay: number; // Delay en milisegundos para debouncing
  maxCalls: number; // Máximo de llamadas
  windowMs: number; // Ventana de tiempo para throttling
}

// Configuración por operación
const THROTTLE_CONFIG: Record<string, ThrottleConfig> = {
  queryCoach: {
    delay: 500, // 500ms de debounce
    maxCalls: 3,
    windowMs: 5000, // 5 segundos
  },
  validateGoal: {
    delay: 1000, // 1 segundo de debounce
    maxCalls: 1,
    windowMs: 1000, // 1 segundo
  },
  unlockMiniTask: {
    delay: 500,
    maxCalls: 1,
    windowMs: 1000,
  },
};

// Timers de debounce por usuario y operación
const debounceTimers = new Map<string, NodeJS.Timeout>();

// Historial de llamadas para throttling
const throttleHistory = new Map<string, number[]>();

/**
 * Limpia timers y historial expirado
 */
const CLEANUP_INTERVAL = 30000; // 30 segundos
setInterval(() => {
  const now = Date.now();
  
  // Limpiar historial de throttling expirado
  for (const [key, timestamps] of throttleHistory.entries()) {
    const filtered = timestamps.filter((ts) => now - ts < 60000); // Mantener último minuto
    
    if (filtered.length === 0) {
      throttleHistory.delete(key);
    } else {
      throttleHistory.set(key, filtered);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Debounce: Espera un delay antes de ejecutar
 */
export async function debounce<T>(
  operation: string,
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const config = THROTTLE_CONFIG[operation];
  
  if (!config) {
    // Si no hay configuración, ejecutar inmediatamente
    return fn();
  }
  
  const key = `${operation}:${userId}`;
  
  return new Promise<T>((resolve, reject) => {
    // Cancelar timer anterior si existe
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Crear nuevo timer
    const timer = setTimeout(async () => {
      debounceTimers.delete(key);
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, config.delay);
    
    debounceTimers.set(key, timer);
  });
}

/**
 * Throttle: Limita el número de llamadas en una ventana de tiempo
 */
export async function throttle<T>(
  operation: string,
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const config = THROTTLE_CONFIG[operation];
  
  if (!config) {
    // Si no hay configuración, ejecutar inmediatamente
    return fn();
  }
  
  const key = `${operation}:${userId}`;
  const now = Date.now();
  
  // Obtener historial de llamadas
  let history = throttleHistory.get(key) || [];
  
  // Filtrar llamadas dentro de la ventana
  history = history.filter((timestamp) => now - timestamp < config.windowMs);
  
  // Verificar si excede el límite
  if (history.length >= config.maxCalls) {
    const oldestCall = history[0];
    const waitTime = config.windowMs - (now - oldestCall);
    
    throw new ThrottleError(
      `Throttle limit excedido para ${operation}. Espera ${Math.ceil(waitTime / 1000)} segundos.`
    );
  }
  
  // Registrar llamada actual
  history.push(now);
  throttleHistory.set(key, history);
  
  // Ejecutar función
  return fn();
}

/**
 * Combina debounce y throttle
 */
export async function debounceAndThrottle<T>(
  operation: string,
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Primero aplicar throttle
  return throttle(operation, userId, () => {
    // Luego aplicar debounce
    return debounce(operation, userId, fn);
  });
}

/**
 * Limpia timers y historial para un usuario
 */
export function clearThrottle(userId: string, operation?: string): void {
  if (operation) {
    const key = `${operation}:${userId}`;
    const timer = debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(key);
    }
    throttleHistory.delete(key);
  } else {
    // Limpiar todo para el usuario
    for (const [key, timer] of debounceTimers.entries()) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(timer);
        debounceTimers.delete(key);
      }
    }
    
    for (const [key] of throttleHistory.entries()) {
      if (key.endsWith(`:${userId}`)) {
        throttleHistory.delete(key);
      }
    }
  }
}

/**
 * Error personalizado para throttle
 */
export class ThrottleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThrottleError';
  }
}

