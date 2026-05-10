import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { getPendingTasksForToday } from '@/services/pendingAlarmsService';

// Forzar renderizado dinámico (usa headers())
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const pendingTasks = await getPendingTasksForToday(userId);
    return NextResponse.json(pendingTasks);
  } catch (error) {
    console.error('Error al obtener tareas pendientes:', error);
    
    // Detectar errores de token inválido
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener tareas pendientes';
    const isTokenError = typeof errorMessage === 'string' && (
      errorMessage.includes('Token') ||
      errorMessage.includes('token') ||
      errorMessage.includes('autenticación') ||
      errorMessage.includes('authentication')
    );
    
    return NextResponse.json(
      { error: errorMessage },
      { status: isTokenError ? 401 : 500 }
    );
  }
}

