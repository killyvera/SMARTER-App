import { NextRequest, NextResponse } from 'next/server';
import { validateMiniTaskService } from '@/services/miniTaskService';
import { getUserId } from '@/lib/auth/getUserId';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  console.log('=== API MINITASK VALIDATE - INICIO ===');
  console.log('Validación de minitask:', {
    miniTaskId: params.id,
    timestamp: new Date().toISOString(),
  });
  
  try {
    const userId = await getUserId(request);
    console.log('✅ [API] Usuario obtenido:', { userId });
    
    console.log('🚀 [API] Llamando a validateMiniTaskService...');
    const result = await validateMiniTaskService(params.id, userId);
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', `/api/minitasks/${params.id}/validate`, 200, duration);
    
    console.log('=== API MINITASK VALIDATE - ÉXITO ===');
    console.log('Resultado:', {
      hasScore: !!result.score,
      passed: result.passed,
      isAction: result.isAction,
      duration: `${duration}ms`,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', `/api/minitasks/${params.id}/validate`, error);
    
    console.error('=== API MINITASK VALIDATE - ERROR ===');
    console.error('Error completo:', {
      miniTaskId: params.id,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Error al validar minitask';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

