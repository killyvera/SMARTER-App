import { NextRequest, NextResponse } from 'next/server';
import { updateGoalSchema } from '@smarter-app/shared';
import {
  getGoalService,
  updateGoalService,
} from '@/services/goalService';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import { getUserId } from '@/lib/auth/getUserId';

// GET /api/goals/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const path = `/api/goals/${params.id}`;
  
  try {
    const userId = await getUserId();
    const goal = await getGoalService(params.id, userId);
    const duration = Date.now() - startTime;
    logApiRequest('GET', path, 200, duration);
    
    return NextResponse.json(goal);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', path, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Goal no encontrado' },
      { status: 404 }
    );
  }
}

// PATCH /api/goals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const path = `/api/goals/${params.id}`;
  
  try {
    const userId = await getUserId();
    const body = await request.json();
    const data = updateGoalSchema.parse(body);
    
    const goal = await updateGoalService(params.id, userId, data);
    const duration = Date.now() - startTime;
    logApiRequest('PATCH', path, 200, duration);
    
    return NextResponse.json(goal);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('PATCH', path, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar goal' },
      { status: 400 }
    );
  }
}

