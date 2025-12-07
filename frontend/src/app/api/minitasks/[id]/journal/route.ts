import { NextRequest, NextResponse } from 'next/server';
import {
  createMiniTaskJournalEntryService,
  getMiniTaskJournalEntriesService,
} from '@/services/miniTaskJournalService';
import { getUserId } from '@/lib/auth/getUserId';
import { createMiniTaskJournalEntrySchema } from '@smarter-app/shared';
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    
    const entries = await getMiniTaskJournalEntriesService(userId, params.id, {
      dateFrom,
      dateTo,
      limit,
    });
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', `/api/minitasks/${params.id}/journal`, 200, duration);
    
    return NextResponse.json(entries);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', `/api/minitasks/${params.id}/journal`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener entradas del journal' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const data = createMiniTaskJournalEntrySchema.parse(body);
    
    const entry = await createMiniTaskJournalEntryService(userId, params.id, data);
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', `/api/minitasks/${params.id}/journal`, 201, duration);
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', `/api/minitasks/${params.id}/journal`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear entrada del journal' },
      { status: 400 }
    );
  }
}

