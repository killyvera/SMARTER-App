import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/getUserId';
import { findGoalsByUser } from '@/repositories/goalRepository';
import { checkAndUpdateGoalCompletion } from '@/services/goalService';
import { logApiRequest, logApiError } from '@/lib/api-logger';

/**
 * Endpoint para revisar y actualizar el estado de todas las goals activas
 * Verifica si todas las minitasks están completadas y marca la goal como COMPLETED si corresponde
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    
    // Obtener solo las goals activas
    const activeGoals = await findGoalsByUser(userId, { status: 'ACTIVE' });
    
    // Revisar cada goal activa
    const results = await Promise.allSettled(
      activeGoals.map(goal => 
        checkAndUpdateGoalCompletion(goal.id, userId)
      )
    );
    
    // Contar cuántas goals fueron actualizadas
    const updated = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected').length;
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/goals/check-completion', 200, duration);
    
    return NextResponse.json({
      checked: activeGoals.length,
      updated,
      errors,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/goals/check-completion', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al revisar completitud de goals' },
      { status: 500 }
    );
  }
}

