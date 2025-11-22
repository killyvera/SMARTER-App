import { NextRequest, NextResponse } from 'next/server';
import { validateGoalService } from '@/services/goalService';
import { getUserId } from '@/lib/auth/getUserId';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId();
    const result = await validateGoalService(params.id, userId);
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', `/api/goals/${params.id}/validate`, 200, duration);
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', `/api/goals/${params.id}/validate`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error al validar goal';
    console.error('Error en validación de goal:', errorMessage, error);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

