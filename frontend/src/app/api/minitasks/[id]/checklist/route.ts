import { NextRequest, NextResponse } from 'next/server';
import {
  getChecklistItemsService,
  createChecklistItemService,
} from '@/services/miniTaskChecklistService';
import { getUserId } from '@/lib/auth/getUserId';
import { z } from 'zod';
import { logApiRequest, logApiError } from '@/lib/api-logger';

const createChecklistItemSchema = z.object({
  label: z.string().min(1, 'El label es requerido').max(200),
  order: z.number().int().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId(request);
    const result = await getChecklistItemsService(userId, params.id);
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', `/api/minitasks/${params.id}/checklist`, 200, duration);
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', `/api/minitasks/${params.id}/checklist`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener items del checklist' },
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
    
    const data = createChecklistItemSchema.parse(body);
    
    const item = await createChecklistItemService(userId, params.id, data);
    
    const duration = Date.now() - startTime;
    logApiRequest('POST', `/api/minitasks/${params.id}/checklist`, 201, duration);
    
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', `/api/minitasks/${params.id}/checklist`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear item del checklist' },
      { status: 400 }
    );
  }
}

