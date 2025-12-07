import { NextRequest, NextResponse } from 'next/server';
import {
  updateChecklistItemService,
  deleteChecklistItemService,
  toggleChecklistItemService,
} from '@/services/miniTaskChecklistService';
import { getUserId } from '@/lib/auth/getUserId';
import { z } from 'zod';
import { logApiRequest, logApiError } from '@/lib/api-logger';

const updateChecklistItemSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const data = updateChecklistItemSchema.parse(body);
    
    const item = await updateChecklistItemService(userId, params.itemId, data);
    
    const duration = Date.now() - startTime;
    logApiRequest('PATCH', `/api/minitasks/${params.id}/checklist/${params.itemId}`, 200, duration);
    
    return NextResponse.json(item);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PATCH', `/api/minitasks/${params.id}/checklist/${params.itemId}`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar item del checklist' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    await deleteChecklistItemService(userId, params.itemId);
    
    const duration = Date.now() - startTime;
    logApiRequest('DELETE', `/api/minitasks/${params.id}/checklist/${params.itemId}`, 200, duration);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('DELETE', `/api/minitasks/${params.id}/checklist/${params.itemId}`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar item del checklist' },
      { status: 500 }
    );
  }
}

// Endpoint especial para toggle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    if (body.action === 'toggle') {
      const item = await toggleChecklistItemService(userId, params.itemId);
      
      const duration = Date.now() - startTime;
      logApiRequest('PUT', `/api/minitasks/${params.id}/checklist/${params.itemId}`, 200, duration);
      
      return NextResponse.json(item);
    }
    
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PUT', `/api/minitasks/${params.id}/checklist/${params.itemId}`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al hacer toggle del item' },
      { status: 500 }
    );
  }
}

