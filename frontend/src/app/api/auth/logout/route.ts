import { NextRequest, NextResponse } from 'next/server';
import { logApiRequest } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Por ahora solo retornamos éxito
  // En el futuro aquí se podría invalidar tokens JWT en el servidor
  const duration = Date.now() - startTime;
  logApiRequest('POST', '/api/auth/logout', 200, duration);
  
  return NextResponse.json({ success: true });
}


