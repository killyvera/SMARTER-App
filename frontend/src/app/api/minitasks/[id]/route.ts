import { NextRequest, NextResponse } from 'next/server';
import { updateMiniTaskSchema } from '@smarter-app/shared';
import {
  getMiniTaskService,
  updateMiniTaskService,
} from '@/services/miniTaskService';
import { getUserId } from '@/lib/auth/getUserId';

// GET /api/minitasks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    const miniTask = await getMiniTaskService(params.id, userId);
    return NextResponse.json(miniTask);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'MiniTask no encontrada' },
      { status: 404 }
    );
  }
}

// PATCH /api/minitasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    const data = updateMiniTaskSchema.parse(body);
    
    const miniTask = await updateMiniTaskService(params.id, userId, data);
    return NextResponse.json(miniTask);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar minitask' },
      { status: 400 }
    );
  }
}

