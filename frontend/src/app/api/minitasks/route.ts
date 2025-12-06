import { NextRequest, NextResponse } from 'next/server';
import { createMiniTaskSchema } from '@smarter-app/shared';
import {
  createMiniTaskService,
  getMiniTasksByGoalService,
  getMiniTasksByStatusService,
  getAllMiniTasksByUserService,
} from '@/services/miniTaskService';
import { logApiRequest, logApiError } from '@/lib/api-logger';
import { getUserId } from '@/lib/auth/getUserId';

// GET /api/minitasks
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    const status = searchParams.get('status');
    
    let miniTasks;
    let path = '/api/minitasks';
    
    if (goalId) {
      miniTasks = await getMiniTasksByGoalService(goalId, userId);
      path += `?goalId=${goalId}`;
    } else if (status) {
      miniTasks = await getMiniTasksByStatusService(userId, status);
      path += `?status=${status}`;
    } else {
      // Si no hay filtros, obtener todas las mini-tasks del usuario
      miniTasks = await getAllMiniTasksByUserService(userId);
      path += '?all=true';
    }
    
    const duration = Date.now() - startTime;
    logApiRequest('GET', path, 200, duration);
    return NextResponse.json(miniTasks);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('GET', '/api/minitasks', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener minitasks' },
      { status: 500 }
    );
  }
}

// POST /api/minitasks
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const data = createMiniTaskSchema.parse(body);
    
    const miniTask = await createMiniTaskService(data);
    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/minitasks', 201, duration);
    
    return NextResponse.json(miniTask, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError('POST', '/api/minitasks', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear minitask' },
      { status: 400 }
    );
  }
}

