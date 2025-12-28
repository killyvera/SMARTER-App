/**
 * Request Queue Manager para proteger el Agent Core de IA
 * 
 * Maneja cola de requests para prevenir sobrecarga
 * Basado en mejores prácticas de Flowise
 */

interface QueuedRequest<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
  timeout: number;
}

interface QueueConfig {
  maxConcurrent: number; // Máximo de requests simultáneos por usuario
  maxQueueSize: number; // Máximo de requests en cola por usuario
  queueTimeout: number; // Timeout en cola (milisegundos)
}

// Configuración por defecto
const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 2, // Máximo 2 requests simultáneos por usuario
  maxQueueSize: 10, // Máximo 10 requests en cola
  queueTimeout: 60000, // 60 segundos en cola
};

// Colas por usuario
const userQueues = new Map<string, QueuedRequest<any>[]>();
const activeRequests = new Map<string, number>(); // userId -> número de requests activos

/**
 * Procesa la cola de un usuario
 */
async function processQueue(userId: string): Promise<void> {
  const queue = userQueues.get(userId) || [];
  const config = DEFAULT_CONFIG;
  const active = activeRequests.get(userId) || 0;
  
  // Si no hay espacio para más requests concurrentes, esperar
  if (active >= config.maxConcurrent) {
    return;
  }
  
  // Si no hay requests en cola, terminar
  if (queue.length === 0) {
    return;
  }
  
  // Tomar el siguiente request de la cola
  const request = queue.shift()!;
  userQueues.set(userId, queue);
  
  // Incrementar contador de requests activos
  activeRequests.set(userId, active + 1);
  
  // Verificar timeout en cola
  const queueTime = Date.now() - request.timestamp;
  if (queueTime > config.queueTimeout) {
    activeRequests.set(userId, active);
    request.reject(
      new Error(`Request timeout en cola después de ${config.queueTimeout}ms`)
    );
    // Continuar procesando la cola
    setImmediate(() => processQueue(userId));
    return;
  }
  
  // Ejecutar el request
  request
    .fn()
    .then((result) => {
      request.resolve(result);
    })
    .catch((error) => {
      request.reject(error);
    })
    .finally(() => {
      // Decrementar contador de requests activos
      const currentActive = activeRequests.get(userId) || 0;
      activeRequests.set(userId, Math.max(0, currentActive - 1));
      
      // Procesar siguiente request en cola
      setTimeout(() => processQueue(userId), 0);
    });
}

/**
 * Agrega un request a la cola
 */
export async function enqueue<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const config = DEFAULT_CONFIG;
  const queue = userQueues.get(userId) || [];
  const active = activeRequests.get(userId) || 0;
  
  // Si hay espacio para ejecutar inmediatamente, hacerlo
  if (active < config.maxConcurrent) {
    activeRequests.set(userId, active + 1);
    
    try {
      const result = await fn();
      const currentActive = activeRequests.get(userId) || 0;
      activeRequests.set(userId, Math.max(0, currentActive - 1));
      
      // Procesar siguiente en cola
      setImmediate(() => processQueue(userId));
      
      return result;
    } catch (error) {
      const currentActive = activeRequests.get(userId) || 0;
      activeRequests.set(userId, Math.max(0, currentActive - 1));
      
      // Procesar siguiente en cola
      setImmediate(() => processQueue(userId));
      
      throw error;
    }
  }
  
  // Si la cola está llena, rechazar
  if (queue.length >= config.maxQueueSize) {
    throw new Error(
      `Cola llena para usuario ${userId}. Máximo ${config.maxQueueSize} requests en cola.`
    );
  }
  
  // Agregar a la cola
  return new Promise<T>((resolve, reject) => {
    const request: QueuedRequest<T> = {
      id: `${userId}:${Date.now()}:${Math.random()}`,
      fn,
      resolve,
      reject,
      timestamp: Date.now(),
      timeout: config.queueTimeout,
    };
    
    queue.push(request);
    userQueues.set(userId, queue);
    
    // Intentar procesar la cola
    setImmediate(() => processQueue(userId));
  });
}

/**
 * Obtiene el estado de la cola para un usuario
 */
export function getQueueStatus(userId: string): {
  queueSize: number;
  activeRequests: number;
  maxConcurrent: number;
  maxQueueSize: number;
} {
  const queue = userQueues.get(userId) || [];
  const active = activeRequests.get(userId) || 0;
  const config = DEFAULT_CONFIG;
  
  return {
    queueSize: queue.length,
    activeRequests: active,
    maxConcurrent: config.maxConcurrent,
    maxQueueSize: config.maxQueueSize,
  };
}

/**
 * Limpia la cola de un usuario (útil para recovery)
 */
export function clearQueue(userId: string): void {
  const queue = userQueues.get(userId) || [];
  
  // Rechazar todos los requests pendientes
  queue.forEach((request) => {
    request.reject(new Error('Cola limpiada manualmente'));
  });
  
  userQueues.delete(userId);
  activeRequests.delete(userId);
}

