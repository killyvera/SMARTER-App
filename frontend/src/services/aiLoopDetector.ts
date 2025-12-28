/**
 * Loop Detection Service para proteger el Agent Core de IA
 * 
 * Detecta bucles infinitos en llamadas recursivas
 * Basado en mejores prácticas de n8n
 */

interface CallRecord {
  operation: string;
  inputHash: string;
  timestamp: number;
}

interface LoopDetectionConfig {
  threshold: number; // Número de llamadas repetidas para considerar loop
  windowMs: number; // Ventana de tiempo en milisegundos
  blockDuration: number; // Duración del bloqueo en milisegundos
}

// Configuración por defecto
const DEFAULT_CONFIG: LoopDetectionConfig = {
  threshold: 3, // 3 llamadas repetidas
  windowMs: 10000, // En 10 segundos
  blockDuration: 60000, // Bloquear por 60 segundos
};

// Historial de llamadas por usuario
const callHistory = new Map<string, CallRecord[]>();

// Bloqueos activos por usuario y operación
const activeBlocks = new Map<string, number>(); // key: userId:operation, value: timestamp de bloqueo

// Limpieza periódica de historial y bloques expirados
const CLEANUP_INTERVAL = 30000; // 30 segundos
setInterval(() => {
  const now = Date.now();
  
  // Limpiar historial antiguo
  for (const [userId, history] of callHistory.entries()) {
    const filtered = history.filter(
      (record) => now - record.timestamp < DEFAULT_CONFIG.windowMs * 2
    );
    
    if (filtered.length === 0) {
      callHistory.delete(userId);
    } else {
      callHistory.set(userId, filtered);
    }
  }
  
  // Limpiar bloques expirados
  for (const [key, blockUntil] of activeBlocks.entries()) {
    if (now > blockUntil) {
      activeBlocks.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Crea un hash del input para detectar duplicados
 */
function hashInput(input: any): string {
  const inputString = JSON.stringify(input);
  // Usar hash simple (en producción usar crypto)
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verifica si hay un loop detectado
 */
export async function checkLoop(
  operation: string,
  userId: string,
  input: any
): Promise<void> {
  const config = DEFAULT_CONFIG;
  const now = Date.now();
  const blockKey = `${userId}:${operation}`;
  
  // 1. Verificar si está bloqueado
  const blockUntil = activeBlocks.get(blockKey);
  if (blockUntil && now < blockUntil) {
    const remainingSeconds = Math.ceil((blockUntil - now) / 1000);
    throw new LoopDetectionError(
      `Loop detectado para ${operation}. Bloqueado por ${remainingSeconds} segundos más.`
    );
  }
  
  // 2. Obtener historial del usuario
  let history = callHistory.get(userId) || [];
  
  // 3. Crear hash del input actual
  const inputHash = hashInput(input);
  
  // 4. Filtrar llamadas en la ventana de tiempo
  const recentCalls = history.filter(
    (record) =>
      record.operation === operation &&
      record.inputHash === inputHash &&
      now - record.timestamp < config.windowMs
  );
  
  // 5. Verificar si excede el threshold
  if (recentCalls.length >= config.threshold - 1) {
    // Bloquear
    activeBlocks.set(blockKey, now + config.blockDuration);
    
    // Limpiar historial para esta operación
    history = history.filter(
      (record) => !(record.operation === operation && record.inputHash === inputHash)
    );
    callHistory.set(userId, history);
    
    console.warn(
      `[LoopDetector] Loop detectado para ${operation} (usuario: ${userId}). Bloqueado por ${config.blockDuration}ms`
    );
    
    throw new LoopDetectionError(
      `Loop detectado: ${operation} fue llamado ${recentCalls.length + 1} veces en ${config.windowMs / 1000} segundos con el mismo input. Bloqueado por ${config.blockDuration / 1000} segundos.`
    );
  }
  
  // 6. Registrar la llamada actual
  history.push({
    operation,
    inputHash,
    timestamp: now,
  });
  
  // Mantener solo las últimas 20 llamadas por usuario
  if (history.length > 20) {
    history = history.slice(-20);
  }
  
  callHistory.set(userId, history);
}

/**
 * Limpia el historial para un usuario (útil para testing o recovery)
 */
export function clearHistory(userId: string, operation?: string): void {
  if (operation) {
    const history = callHistory.get(userId) || [];
    const filtered = history.filter((record) => record.operation !== operation);
    callHistory.set(userId, filtered);
  } else {
    callHistory.delete(userId);
  }
  
  // También limpiar bloques
  if (operation) {
    activeBlocks.delete(`${userId}:${operation}`);
  } else {
    // Limpiar todos los bloques del usuario
    for (const [key] of activeBlocks.entries()) {
      if (key.startsWith(`${userId}:`)) {
        activeBlocks.delete(key);
      }
    }
  }
}

/**
 * Obtiene información sobre el estado del loop detector
 */
export function getLoopDetectionInfo(userId: string, operation: string): {
  recentCalls: number;
  isBlocked: boolean;
  blockUntil: number | null;
} {
  const history = callHistory.get(userId) || [];
  const now = Date.now();
  const config = DEFAULT_CONFIG;
  
  const recentCalls = history.filter(
    (record) =>
      record.operation === operation &&
      now - record.timestamp < config.windowMs
  ).length;
  
  const blockKey = `${userId}:${operation}`;
  const blockUntil = activeBlocks.get(blockKey) || null;
  const isBlocked = blockUntil !== null && now < blockUntil;
  
  return {
    recentCalls,
    isBlocked,
    blockUntil: isBlocked ? blockUntil : null,
  };
}

/**
 * Error personalizado para loop detection
 */
export class LoopDetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoopDetectionError';
  }
}

