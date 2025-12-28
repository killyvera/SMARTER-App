import { NextRequest, NextResponse } from 'next/server';
import { queryCoachService } from '@/services/miniTaskJournalService';
import { getUserId } from '@/lib/auth/getUserId';
import { coachQuerySchema } from '@smarter-app/shared';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import { getClientIP } from '@/lib/getClientIP';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const { query, includeHistory } = coachQuerySchema.parse(body);
    
    const response = await queryCoachService(
      userId,
      params.id,
      query,
      includeHistory ?? true
    );
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', `/api/minitasks/${params.id}/journal/coach`, 200, duration);
    
    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', `/api/minitasks/${params.id}/journal/coach`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al consultar al coach' },
      { status: 400 }
    );
  }
}

