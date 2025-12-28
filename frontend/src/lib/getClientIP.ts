import { NextRequest } from 'next/server';

/**
 * Obtiene la IP del cliente desde el request
 * Considera headers de proxy (X-Forwarded-For, X-Real-IP)
 */
export function getClientIP(request: NextRequest): string | undefined {
  // Intentar obtener desde X-Forwarded-For (útil cuando hay proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For puede contener múltiples IPs separadas por coma
    // La primera es la IP original del cliente
    return forwardedFor.split(',')[0].trim();
  }
  
  // Intentar obtener desde X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  // Fallback: intentar obtener desde el socket (no disponible en Next.js Edge)
  // En producción con Netlify/Vercel, usar headers anteriores
  
  return undefined;
}

