/**
 * Request Tracker Service para proteger el Agent Core de IA
 * 
 * Tracking detallado de todas las llamadas a la IA
 * Para monitoreo, debugging y detección de patrones
 */

export type RequestStatus = 'success' | 'failure' | 'timeout' | 'rate_limited' | 'circuit_open';

interface RequestMetric {
  operation: string;
  userId: string;
  status: RequestStatus;
  duration: number; // en milisegundos
  timestamp: number;
  inputHash: string;
  error?: string;
}

// Almacenamiento de métricas (últimas 1000 por operación)
const metrics: RequestMetric[] = [];
const MAX_METRICS = 1000;

/**
 * Registra una llamada
 */
export async function trackRequest(
  operation: string,
  status: RequestStatus,
  userId: string,
  duration: number,
  inputHash: string,
  error?: Error
): Promise<void> {
  const metric: RequestMetric = {
    operation,
    userId,
    status,
    duration,
    timestamp: Date.now(),
    inputHash,
    error: error?.message,
  };
  
  metrics.push(metric);
  
  // Mantener solo las últimas MAX_METRICS
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
  
  // Log estructurado
  console.log(`[RequestTracker] ${operation}`, {
    userId,
    status,
    duration: `${duration}ms`,
    timestamp: new Date(metric.timestamp).toISOString(),
  });
}

/**
 * Obtiene métricas agregadas
 */
export function getMetrics(operation?: string, userId?: string): {
  total: number;
  success: number;
  failure: number;
  timeout: number;
  rateLimited: number;
  circuitOpen: number;
  averageDuration: number;
  p95Duration: number;
  p99Duration: number;
} {
  let filtered = metrics;
  
  // Filtrar por operación
  if (operation) {
    filtered = filtered.filter((m) => m.operation === operation);
  }
  
  // Filtrar por usuario
  if (userId) {
    filtered = filtered.filter((m) => m.userId === userId);
  }
  
  if (filtered.length === 0) {
    return {
      total: 0,
      success: 0,
      failure: 0,
      timeout: 0,
      rateLimited: 0,
      circuitOpen: 0,
      averageDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
    };
  }
  
  const total = filtered.length;
  const success = filtered.filter((m) => m.status === 'success').length;
  const failure = filtered.filter((m) => m.status === 'failure').length;
  const timeout = filtered.filter((m) => m.status === 'timeout').length;
  const rateLimited = filtered.filter((m) => m.status === 'rate_limited').length;
  const circuitOpen = filtered.filter((m) => m.status === 'circuit_open').length;
  
  const durations = filtered.map((m) => m.duration).sort((a, b) => a - b);
  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  const p95Duration = durations[p95Index] || 0;
  const p99Duration = durations[p99Index] || 0;
  
  return {
    total,
    success,
    failure,
    timeout,
    rateLimited,
    circuitOpen,
    averageDuration: Math.round(averageDuration),
    p95Duration,
    p99Duration,
  };
}

/**
 * Detecta patrones sospechosos
 */
export function detectSuspiciousPatterns(): Array<{
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}> {
  const patterns: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];
  
  const now = Date.now();
  const lastMinute = metrics.filter((m) => now - m.timestamp < 60000);
  
  // Patrón 1: Muchos rate limits
  const rateLimited = lastMinute.filter((m) => m.status === 'rate_limited').length;
  if (rateLimited > 10) {
    patterns.push({
      type: 'high_rate_limiting',
      description: `${rateLimited} requests rate limited en el último minuto`,
      severity: 'high',
    });
  }
  
  // Patrón 2: Muchos circuit breakers abiertos
  const circuitOpen = lastMinute.filter((m) => m.status === 'circuit_open').length;
  if (circuitOpen > 5) {
    patterns.push({
      type: 'circuit_breaker_open',
      description: `${circuitOpen} requests bloqueados por circuit breaker en el último minuto`,
      severity: 'high',
    });
  }
  
  // Patrón 3: Muchos timeouts
  const timeouts = lastMinute.filter((m) => m.status === 'timeout').length;
  if (timeouts > 5) {
    patterns.push({
      type: 'high_timeout_rate',
      description: `${timeouts} timeouts en el último minuto`,
      severity: 'medium',
    });
  }
  
  // Patrón 4: Mismo input repetido muchas veces
  const inputHashes = new Map<string, number>();
  lastMinute.forEach((m) => {
    const count = inputHashes.get(m.inputHash) || 0;
    inputHashes.set(m.inputHash, count + 1);
  });
  
  for (const [hash, count] of inputHashes.entries()) {
    if (count > 10) {
      patterns.push({
        type: 'repeated_input',
        description: `Mismo input usado ${count} veces en el último minuto`,
        severity: 'medium',
      });
    }
  }
  
  return patterns;
}

/**
 * Limpia métricas antiguas
 */
export function clearOldMetrics(olderThanMs: number = 3600000): void {
  const now = Date.now();
  const cutoff = now - olderThanMs;
  
  const filtered = metrics.filter((m) => m.timestamp > cutoff);
  metrics.length = 0;
  metrics.push(...filtered);
}

