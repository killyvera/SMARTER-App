import { NextRequest, NextResponse } from 'next/server';
import {
  updateMiniTaskJournalEntryService,
  deleteMiniTaskJournalEntryService,
} from '@/services/miniTaskJournalService';
import { getUserId } from '@/lib/auth/getUserId';
import { updateMiniTaskJournalEntrySchema } from '@smarter-app/shared';
import { logApiRequest, logApiError } from '@/lib/api-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const data = updateMiniTaskJournalEntrySchema.parse(body);
    
    const entry = await updateMiniTaskJournalEntryService(userId, params.entryId, data);
    
    const duration = Date.now() - startTime;
    logApiRequest('PATCH', `/api/minitasks/${params.id}/journal/${params.entryId}`, 200, duration);
    
    return NextResponse.json(entry);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PATCH', `/api/minitasks/${params.id}/journal/${params.entryId}`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar entrada del journal' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    
    await deleteMiniTaskJournalEntryService(userId, params.entryId);
    
    const duration = Date.now() - startTime;
    logApiRequest('DELETE', `/api/minitasks/${params.id}/journal/${params.entryId}`, 200, duration);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('DELETE', `/api/minitasks/${params.id}/journal/${params.entryId}`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar entrada del journal' },
      { status: 400 }
    );
  }
}

