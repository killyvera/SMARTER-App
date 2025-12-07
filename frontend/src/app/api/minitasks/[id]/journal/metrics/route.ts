import { NextRequest, NextResponse } from 'next/server';
import { getJournalMetricsService } from '@/services/miniTaskJournalService';
import { getUserId } from '@/lib/auth/getUserId';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
    
    const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined;
    
    const metrics = await getJournalMetricsService(userId, params.id, dateRange);
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', `/api/minitasks/${params.id}/journal/metrics`, 200, duration);
    
    return NextResponse.json(metrics);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', `/api/minitasks/${params.id}/journal/metrics`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener métricas del journal' },
      { status: 500 }
    );
  }
}

