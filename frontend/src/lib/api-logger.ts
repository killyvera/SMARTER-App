/**
 * Logger para las rutas de API
 */

export function logApiRequest(
  method: string,
  path: string,
  status: number,
  duration?: number
) {
  const timestamp = new Date().toISOString();
  const durationStr = duration ? ` (${duration}ms)` : '';
  const statusColor = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
  
  console.log(
    `[API] ${timestamp} ${statusColor} ${method} ${path} → ${status}${durationStr}`
  );
}

export function logApiError(method: string, path: string, error: unknown) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error(
    `[API] ${timestamp} ❌ ${method} ${path} → Error: ${errorMessage}`
  );
}


