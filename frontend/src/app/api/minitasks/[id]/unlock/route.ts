import { NextRequest, NextResponse } from 'next/server';
import { unlockMiniTaskService } from '@/services/miniTaskService';
import { getUserId } from '@/lib/auth/getUserId';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId();
    const result = await unlockMiniTaskService(params.id, userId);
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', `/api/minitasks/${params.id}/unlock`, 200, duration);
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', `/api/minitasks/${params.id}/unlock`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al desbloquear minitask' },
      { status: 400 }
    );
  }
}

