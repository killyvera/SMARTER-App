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
    const body = await request.json().catch(() => ({}));
    
    // Si viene con acceptedTitle, acceptedDescription o acceptedMiniTasks, es confirmación final
    const isConfirmation = !!(body.acceptedTitle || body.acceptedDescription || (body.acceptedMiniTasks && Array.isArray(body.acceptedMiniTasks) && body.acceptedMiniTasks.length > 0));
    
    console.log('=== API VALIDATE - INICIO ===');
    console.log('Validación de goal:', {
      goalId: params.id,
      userId,
      isConfirmation,
      hasAcceptedTitle: !!body.acceptedTitle,
      hasAcceptedDescription: !!body.acceptedDescription,
      acceptedMiniTasks: body.acceptedMiniTasks,
      acceptedMiniTasksLength: body.acceptedMiniTasks?.length,
      acceptedMiniTasksType: Array.isArray(body.acceptedMiniTasks) ? 'array' : typeof body.acceptedMiniTasks,
    });
    
    const options = isConfirmation ? {
      acceptedTitle: body.acceptedTitle,
      acceptedDescription: body.acceptedDescription,
      acceptedMiniTasks: body.acceptedMiniTasks,
    } : undefined;
    
    console.log('Opciones pasadas al servicio:', {
      hasOptions: !!options,
      hasAcceptedMiniTasks: !!(options?.acceptedMiniTasks),
      acceptedMiniTasksLength: options?.acceptedMiniTasks?.length,
    });
    
    const result = await validateGoalService(params.id, userId, options);
    
    console.log('=== API VALIDATE - RESULTADO ===');
    console.log('Resultado:', {
      hasScore: !!result.score,
      hasFeedback: !!result.feedback,
      suggestedMiniTasksLength: result.suggestedMiniTasks?.length,
    });
    
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

