/**
 * Retry Handler Service para proteger el Agent Core de IA
 * 
 * Implementa retry logic con exponential backoff
 * Basado en mejores prácticas de n8n y OpenAI
 */

interface RetryConfig {
  maxAttempts: number; // Máximo número de intentos (incluyendo el primero)
  baseDelay: number; // Delay base en milisegundos
  maxDelay: number; // Delay máximo en milisegundos
  retryableErrors: number[]; // Códigos de error HTTP que se pueden reintentar
}

// Configuración por defecto
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3, // 1 intento inicial + 2 reintentos
  baseDelay: 1000, // 1 segundo
  maxDelay: 16000, // 16 segundos máximo
  retryableErrors: [429, 500, 502, 503, 504], // Rate limit y errores del servidor
};

// Errores que NO deben reintentarse
const NON_RETRYABLE_ERRORS = [400, 401, 403, 404]; // Errores del cliente

/**
 * Calcula el delay para el siguiente intento usando exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * 2^(attempt - 1)
  const delay = config.baseDelay * Math.pow(2, attempt - 1);
  
  // Aplicar jitter aleatorio (±20%) para evitar thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  const finalDelay = delay + jitter;
  
  // Limitar al máximo
  return Math.min(finalDelay, config.maxDelay);
}

/**
 * Determina si un error es retryable
 */
function isRetryableError(error: any, config: RetryConfig): boolean {
  // Si es un error de validación o input, no reintentar
  if (error instanceof Error) {
    const errorName = error.constructor.name;
    if (errorName === 'ValidationError' || errorName === 'RateLimitError') {
      return false;
    }
  }
  
  // Si tiene código HTTP, verificar si es retryable
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    
    // NO reintentar errores del cliente
    if (NON_RETRYABLE_ERRORS.includes(statusCode)) {
      return false;
    }
    
    // Reintentar si está en la lista de errores retryables
    return config.retryableErrors.includes(statusCode);
  }
  
  // Si es un error de timeout, reintentar
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Si es un error de red, reintentar
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Por defecto, no reintentar (errores desconocidos)
  return false;
}

/**
 * Ejecuta una función con retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  error?: any,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: any = error;
  
  // Si no hay error inicial, ejecutar la función
  if (!error) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
    }
  }
  
  // Verificar si el error es retryable
  if (!isRetryableError(lastError, finalConfig)) {
    throw lastError;
  }
  
  // Intentar reintentos
  for (let attempt = 1; attempt < finalConfig.maxAttempts; attempt++) {
    const delay = calculateDelay(attempt, finalConfig);
    
    console.log(
      `[RetryHandler] Reintentando después de ${delay}ms (intento ${attempt + 1}/${finalConfig.maxAttempts})`
    );
    
    // Esperar antes del siguiente intento
    await new Promise((resolve) => setTimeout(resolve, delay));
    
    try {
      const result = await fn();
      console.log(`[RetryHandler] Reintento exitoso en intento ${attempt + 1}`);
      return result;
    } catch (e: any) {
      lastError = e;
      
      // Si el nuevo error no es retryable, lanzar inmediatamente
      if (!isRetryableError(e, finalConfig)) {
        throw e;
      }
      
      // Si es el último intento, lanzar el error
      if (attempt === finalConfig.maxAttempts - 1) {
        console.error(`[RetryHandler] Todos los reintentos fallaron`);
        throw lastError;
      }
    }
  }
  
  // Si llegamos aquí, todos los reintentos fallaron
  throw lastError;
}

/**
 * Wrapper para funciones que necesitan retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retry(fn, undefined, config);
}

/**
 * Obtiene información sobre si un error es retryable
 */
export function shouldRetry(error: any): boolean {
  const config = DEFAULT_CONFIG;
  return isRetryableError(error, config);
}

