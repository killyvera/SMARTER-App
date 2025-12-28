/**
 * Circuit Breaker Service para proteger el Agent Core de IA
 * 
 * Implementa el patrón Circuit Breaker para prevenir cascading failures
 * Basado en mejores prácticas de n8n
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal, permite llamadas
  OPEN = 'OPEN', // Bloqueado después de N fallos
  HALF_OPEN = 'HALF_OPEN', // Intentando recuperación
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Número de fallos antes de abrir
  timeout: number; // Tiempo en ms antes de intentar recuperación
  successThreshold: number; // Número de éxitos para cerrar desde HALF_OPEN
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastStateChange: number;
}

// Configuración por defecto (puede ser sobrescrita por env vars)
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  timeout: 30000, // 30 segundos
  successThreshold: 2,
};

// Estado de circuit breakers por endpoint
const circuitStates = new Map<string, CircuitBreakerState>();

/**
 * Obtiene o crea el estado del circuit breaker para un endpoint
 */
function getOrCreateState(endpoint: string): CircuitBreakerState {
  let state = circuitStates.get(endpoint);
  
  if (!state) {
    state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      lastStateChange: Date.now(),
    };
    circuitStates.set(endpoint, state);
  }
  
  return state;
}

/**
 * Verifica si el circuit breaker permite la llamada
 */
export async function checkCircuitBreakerState(endpoint: string): Promise<void> {
  const state = getOrCreateState(endpoint);
  const now = Date.now();
  const config = DEFAULT_CONFIG;
  
  // Si está CLOSED, permitir
  if (state.state === CircuitState.CLOSED) {
    return;
  }
  
  // Si está OPEN, verificar si es tiempo de intentar recuperación
  if (state.state === CircuitState.OPEN) {
    const timeSinceLastFailure = state.lastFailureTime
      ? now - state.lastFailureTime
      : Infinity;
    
    if (timeSinceLastFailure >= config.timeout) {
      // Cambiar a HALF_OPEN para intentar recuperación
      state.state = CircuitState.HALF_OPEN;
      state.successCount = 0;
      state.lastStateChange = now;
      console.log(`[CircuitBreaker] ${endpoint} cambió a HALF_OPEN`);
      return; // Permitir intento
    }
    
    // Aún en timeout, rechazar
    throw new CircuitBreakerError(
      `Circuit breaker está OPEN para ${endpoint}. Intenta de nuevo en ${Math.ceil((config.timeout - timeSinceLastFailure) / 1000)} segundos.`
    );
  }
  
  // Si está HALF_OPEN, permitir (ya que estamos intentando recuperación)
  if (state.state === CircuitState.HALF_OPEN) {
    return;
  }
}

/**
 * Registra un éxito en el circuit breaker
 */
export async function recordSuccess(endpoint: string): Promise<void> {
  const state = getOrCreateState(endpoint);
  const config = DEFAULT_CONFIG;
  
  // Resetear contador de fallos
  state.failureCount = 0;
  state.lastFailureTime = null;
  
  // Si estaba en HALF_OPEN, incrementar contador de éxitos
  if (state.state === CircuitState.HALF_OPEN) {
    state.successCount++;
    
    // Si alcanzamos el threshold, cerrar el circuito
    if (state.successCount >= config.successThreshold) {
      state.state = CircuitState.CLOSED;
      state.successCount = 0;
      state.lastStateChange = Date.now();
      console.log(`[CircuitBreaker] ${endpoint} se cerró después de ${config.successThreshold} éxitos`);
    }
  } else if (state.state === CircuitState.OPEN) {
    // Si estaba OPEN y tenemos éxito, cambiar a HALF_OPEN
    state.state = CircuitState.HALF_OPEN;
    state.successCount = 1;
    state.lastStateChange = Date.now();
    console.log(`[CircuitBreaker] ${endpoint} cambió a HALF_OPEN después de éxito`);
  }
}

/**
 * Registra un fallo en el circuit breaker
 */
export async function recordFailure(endpoint: string): Promise<void> {
  const state = getOrCreateState(endpoint);
  const config = DEFAULT_CONFIG;
  const now = Date.now();
  
  state.failureCount++;
  state.lastFailureTime = now;
  state.successCount = 0; // Resetear contador de éxitos
  
  // Si está en HALF_OPEN y falla, volver a OPEN
  if (state.state === CircuitState.HALF_OPEN) {
    state.state = CircuitState.OPEN;
    state.lastStateChange = now;
    console.log(`[CircuitBreaker] ${endpoint} volvió a OPEN después de fallo en HALF_OPEN`);
    return;
  }
  
  // Si alcanzamos el threshold de fallos, abrir el circuito
  if (state.failureCount >= config.failureThreshold && state.state === CircuitState.CLOSED) {
    state.state = CircuitState.OPEN;
    state.lastStateChange = now;
    console.log(`[CircuitBreaker] ${endpoint} se abrió después de ${config.failureThreshold} fallos`);
  }
}

/**
 * Obtiene el estado actual del circuit breaker
 */
export function getCircuitBreakerState(endpoint: string): {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  timeUntilRetry: number | null;
} {
  const state = getOrCreateState(endpoint);
  const config = DEFAULT_CONFIG;
  
  let timeUntilRetry: number | null = null;
  
  if (state.state === CircuitState.OPEN && state.lastFailureTime) {
    const elapsed = Date.now() - state.lastFailureTime;
    timeUntilRetry = Math.max(0, config.timeout - elapsed);
  }
  
  return {
    state: state.state,
    failureCount: state.failureCount,
    lastFailureTime: state.lastFailureTime,
    timeUntilRetry,
  };
}

/**
 * Resetea el circuit breaker manualmente (útil para testing o recovery manual)
 */
export function resetCircuitBreaker(endpoint: string): void {
  const state = getOrCreateState(endpoint);
  state.state = CircuitState.CLOSED;
  state.failureCount = 0;
  state.successCount = 0;
  state.lastFailureTime = null;
  state.lastStateChange = Date.now();
  console.log(`[CircuitBreaker] ${endpoint} fue reseteado manualmente`);
}

/**
 * Error personalizado para circuit breaker
 */
export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

