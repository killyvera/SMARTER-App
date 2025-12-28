/**
 * Timeout Handler Service para proteger el Agent Core de IA
 * 
 * Maneja timeouts de manera elegante usando AbortController
 * Basado en mejores prácticas de OpenAI y n8n
 */

interface TimeoutConfig {
  timeout: number; // Tiempo en milisegundos
  operation: string; // Nombre de la operación para logging
}

// Configuración de timeouts por operación
const OPERATION_TIMEOUTS: Record<string, number> = {
  validateGoal: 30000, // 30 segundos
  unlockMiniTask: 45000, // 45 segundos
  queryCoach: 20000, // 20 segundos
  validateMiniTask: 30000, // 30 segundos
};

/**
 * Ejecuta una función con timeout
 */
export async function executeWithTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { timeout, operation } = config;
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Configurar timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    // Ejecutar función con signal
    const result = await fn(signal);
    
    // Limpiar timeout si se completó antes
    clearTimeout(timeoutId);
    
    return result;
  } catch (error: any) {
    // Limpiar timeout
    clearTimeout(timeoutId);
    
    // Si fue abortado por timeout
    if (signal.aborted || error.name === 'AbortError') {
      throw new TimeoutError(
        `Timeout después de ${timeout}ms para operación: ${operation}`
      );
    }
    
    // Re-lanzar otros errores
    throw error;
  }
}

/**
 * Obtiene el timeout configurado para una operación
 */
export function getTimeoutForOperation(operation: string): number {
  return OPERATION_TIMEOUTS[operation] || 30000; // Default 30 segundos
}

/**
 * Wrapper para funciones de OpenAI que soportan AbortSignal
 */
export async function executeOpenAICallWithTimeout<T>(
  operation: string,
  callFn: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const timeout = getTimeoutForOperation(operation);
  
  return executeWithTimeout(callFn, {
    timeout,
    operation,
  });
}

/**
 * Error personalizado para timeouts
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

